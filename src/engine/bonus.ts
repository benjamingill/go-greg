import {
  BONUS_START_SPINS,
  BOOST_CHANCE,
  BOOST_MORE_CHANCE,
  BOOST_PRIZES,
  BOOST_SPIN_CHANCE,
  BOOST_SPINS,
  COIN_CHANCE,
  DIAMOND_CHANCE,
  DOUBLE_SPOTS,
  SPIN_PRIZE_CHANCE,
} from './config';
import { type JackpotTerms, PLAIN_TERMS } from './jackpots';
import { type Prize, prizeMult, spinPrize, type Tier } from './prizes';
import { draw, type Rng, randomInt, shuffle } from './rng';
import type { BonusTrigger } from './spin';
import { EXTRA_FOR, type Extras } from './symbols';

export interface Size {
  w: number;
  h: number;
}

export interface Spot {
  x: number;
  y: number;
}

interface Growth {
  /** Total diamonds collected to reach this size. */
  at: number;
  size: Size;
  /** Spins added on the 5-tall board (Mo' Spins / Mo' Symbols). */
  spins: number;
  /** Spins added on the 8-tall board (Go Greg), when different. */
  spinsGoGreg?: number;
}

/** Greg's size when the bonus starts. */
export const START_SIZE: Size = { w: 2, h: 2 };

const GROWTH: readonly Growth[] = [
  { at: 5, size: { w: 3, h: 3 }, spins: 3 },
  { at: 9, size: { w: 4, h: 4 }, spins: 2 },
  // 5-tall boards give +1 here; Go Greg's 8-tall board gives +2.
  { at: 12, size: { w: 5, h: 5 }, spins: 1, spinsGoGreg: 2 },
  // Go Greg only: the board is 8 tall.
  { at: 15, size: { w: 5, h: 6 }, spins: 1 },
  { at: 18, size: { w: 5, h: 7 }, spins: 1 },
  { at: 21, size: { w: 5, h: 8 }, spins: 1 },
];

export interface BoardCell {
  kind: 'coin' | 'diamond';
  /** Two with Mo' Symbols doubles. */
  prizes: Prize[];
  /** Spins added on top of its prizes by Go Greg's bonus prizes (with Mo' Spins); 0 for none. */
  spinTag: number;
  /** Greg took it. Diamonds are always collected; coins only inside Greg. */
  collected: boolean;
  /** Go Greg bonus prize added to this cell. */
  boost: number;
}

/** The board after one spin of the Greg Bonus (or at the start, showing the triggering gems). */
export interface BonusFrame {
  /** Index `y * cols + x`. */
  board: (BoardCell | null)[];
  /** Greg's top-left square once he has finished moving (and growing). */
  greg: Spot;
  size: Size;
  /**
   * Greg's moves this spin, in order: each slides him the shortest way across
   * and/or up or down so one diamond (`cell`) is inside him, and he claims it.
   * `reach` is where he stands to cover it. If that diamond takes him to a new
   * size, he grows: `at` and `size` are where he is and how big he is after the
   * claim (the same spot as `reach` unless growing pushed him back onto the board).
   */
  moves: { cell: number; reach: Spot; at: Spot; size: Size }[];
  /** He grew on this spin. */
  grew: boolean;
  diamonds: number;
  spinsLeft: number;
  /** Collected on this spin, as a multiple of the bet. */
  win: number;
  /** Collected so far. */
  total: number;
}

export interface BonusRun {
  cols: number;
  rows: number;
  extras: Extras;
  /** Where Greg first appears, before claiming the diamonds already on the board. */
  startAt: Spot;
  /** Frame 0 is the start; each later frame is one spin. */
  frames: BonusFrame[];
  /** The whole bonus, as a multiple of the bet. */
  total: number;
  jackpots: Tier[];
  /** What each jackpot pays, as a multiple of the bet it was played at. */
  jackpotMults: Record<Tier, number>;
}

/** The sizes Greg can grow to on a board `rows` tall. */
export const growthSteps = (rows: number) => GROWTH.filter((g) => g.size.h <= rows);

/** The next size Greg is working towards, if any. */
export function nextGrowth(run: BonusRun, frame: BonusFrame): Growth | undefined {
  return growthSteps(run.rows).find((g) => g.at > frame.diamonds);
}

/** Spins collecting it adds: each "+1 Spin" prize it shows, and any added by Go Greg. */
export const cellSpins = (c: BoardCell) => c.spinTag + c.prizes.filter((p) => p.kind === 'spin').length;

/** What a square pays (in bets): its prizes and any boost. */
/** A coin or diamond's value, as a multiple of the bet. `mults` is each jackpot's at the bet (BonusRun.jackpotMults). */
export const cellValue = (c: BoardCell, mults: Record<Tier, number>) =>
  c.prizes.reduce((sum, p) => sum + prizeMult(p, mults), 0) + c.boost;

const area = (s: Size) => s.w * s.h;

/** True if Greg grew on move `k` (from 0) of frame `frame`. */
export function grewOnMove(run: BonusRun, frame: number, k: number): boolean {
  const f = run.frames[frame];
  const m = f?.moves[k];
  if (!f || !m) return false;
  const before = k > 0 ? f.moves[k - 1]?.size : (run.frames[frame - 1]?.size ?? START_SIZE);
  return before !== undefined && area(m.size) > area(before);
}

/** Where Greg stands before move `k` (from 0) of frame `frame`. */
function moveStart(run: BonusRun, frame: number, k: number): Spot {
  const prev = run.frames[frame]?.moves[k - 1];
  if (prev) return prev.at;
  return run.frames[frame - 1]?.greg ?? run.startAt;
}

/** How many squares Greg walks on move `k` (across first, then up or down). */
export function walkLength(run: BonusRun, frame: number, k: number): number {
  const m = run.frames[frame]?.moves[k];
  if (!m) return 0;
  const from = moveStart(run, frame, k);
  return Math.abs(m.reach.x - from.x) + Math.abs(m.reach.y - from.y);
}

/** Where Greg is after `step` squares of move `k`: across first, then up or down. */
export function walkSpot(run: BonusRun, frame: number, k: number, step: number): Spot {
  const from = moveStart(run, frame, k);
  const to = run.frames[frame]?.moves[k]?.reach ?? from;
  const across = Math.abs(to.x - from.x);
  if (step <= across) return { x: from.x + Math.sign(to.x - from.x) * step, y: from.y };
  const down = Math.min(step - across, Math.abs(to.y - from.y));
  return { x: to.x, y: from.y + Math.sign(to.y - from.y) * down };
}

/**
 * How many of frame `frame`'s diamonds Greg has claimed: he has started `moved`
 * moves and walked `step` squares of the last one, and claims it on arrival.
 */
export function claimedCount(run: BonusRun, frame: number, moved: number, step: number): number {
  if (moved === 0) return 0;
  return step >= walkLength(run, frame, moved - 1) ? moved : moved - 1;
}

/**
 * The bonus total (in bets) as the screen shows it: frame `frame`'s total, less
 * the diamonds Greg hasn't claimed yet (he has made `moved` of its moves).
 */
export function totalSoFar(run: BonusRun, frame: number, moved: number): number {
  const f = run.frames[frame];
  if (!f) return 0;
  const unclaimed = f.moves.slice(moved).reduce((sum, m) => {
    const c = f.board[m.cell];
    return sum + (c ? cellValue(c, run.jackpotMults) : 0);
  }, 0);
  return f.total - unclaimed;
}

/** Plays the whole Greg Bonus. `jackpots` sets the jackpots' odds and amounts at the bet. */
export function playBonus(trigger: BonusTrigger, rng: Rng, jackpots: JackpotTerms = PLAIN_TERMS): BonusRun {
  const extras: Extras = { moSpins: false, goGreg: false, moSymbols: false };
  for (const color of trigger.colors) extras[EXTRA_FOR[color]] = true;
  // The board stands upright: 5 wide, and 8 tall with Go Greg.
  const cols = 5;
  const rows = extras.goGreg ? 8 : 5;
  const steps = growthSteps(rows);
  const won: Tier[] = [];
  const noteJackpots = (c: BoardCell) => {
    for (const p of c.prizes) if (p.kind === 'jackpot') won.push(p.tier);
  };

  let size: Size = START_SIZE;
  let diamonds = 0;
  let spinsLeft = BONUS_START_SPINS;
  let total = 0;

  /** Grows Greg for any thresholds reached. Returns true if he grew. */
  const grow = () => {
    let grew = false;
    for (const g of steps) {
      if (diamonds >= g.at && g.size.w * g.size.h > size.w * size.h) {
        size = g.size;
        spinsLeft += rows > 5 ? (g.spinsGoGreg ?? g.spins) : g.spins;
        grew = true;
      }
    }
    return grew;
  };
  /** Greg stays put; when he grows, he moves only as far as he must to stay on the board. */
  const keepOnBoard = (at: Spot) => ({
    x: Math.min(at.x, cols - size.w),
    y: Math.min(at.y, rows - size.h),
  });

  const covers = (at: Spot, s: Size, i: number) => {
    const x = i % cols;
    const y = Math.floor(i / cols);
    return x >= at.x && x < at.x + s.w && y >= at.y && y < at.y + s.h;
  };
  // The gems that started the bonus stay where they landed on the reels (the top rows of the
  // board). Greg starts 2×2 at a random spot that doesn't cover any of them.
  const gemSquares = trigger.gems.map((g) => g.row * cols + g.reel);
  const clearSpots: Spot[] = [];
  for (let y = 0; y <= rows - size.h; y++) {
    for (let x = 0; x <= cols - size.w; x++) {
      if (!gemSquares.some((i) => covers({ x, y }, size, i))) clearSpots.push({ x, y });
    }
  }
  let greg = clearSpots[randomInt(rng, clearSpots.length)] as Spot;

  /** The shortest slide (across, then up or down) that puts square `i` inside Greg. */
  const cover = (from: Spot, i: number): Spot => {
    const x = i % cols;
    const y = Math.floor(i / cols);
    return {
      x: x < from.x ? x : x >= from.x + size.w ? x - size.w + 1 : from.x,
      y: y < from.y ? y : y >= from.y + size.h ? y - size.h + 1 : from.y,
    };
  };
  const distance = (a: Spot, b: Spot) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  /**
   * Greg goes after each diamond on `board`, nearest first, claiming it. Each
   * claim counts at once, so he grows as soon as he reaches a new size and the
   * rest count towards the next one.
   */
  const claimAll = (board: (BoardCell | null)[]) => {
    const moves: BonusFrame['moves'] = [];
    let grew = false;
    const left = board.flatMap((c, i) => (c?.kind === 'diamond' ? [i] : []));
    while (left.length > 0) {
      let best = 0;
      left.forEach((i, k) => {
        if (distance(greg, cover(greg, i)) < distance(greg, cover(greg, left[best] as number))) best = k;
      });
      const [cell] = left.splice(best, 1) as [number];
      greg = cover(greg, cell);
      const reach = greg;
      // A Mo' Symbols double counts as two diamonds.
      diamonds += board[cell]?.prizes.length ?? 1;
      if (grow()) {
        greg = keepOnBoard(greg);
        grew = true;
      }
      moves.push({ cell, reach, at: greg, size });
    }
    return { moves, grew };
  };

  // The triggering gems are diamonds already on the board, never on Greg's squares. He
  // claims them like any others.
  const start: (BoardCell | null)[] = Array(cols * rows).fill(null);
  trigger.gems.forEach((g, i) => {
    const cell: BoardCell = { kind: 'diamond', prizes: [g.prize], spinTag: 0, collected: true, boost: 0 };
    start[gemSquares[i] as number] = cell;
    total += cellValue(cell, jackpots.mult);
    noteJackpots(cell);
  });
  const startAt = greg;
  const first = claimAll(start);
  const frames: BonusFrame[] = [
    { board: start, greg, size, moves: first.moves, grew: first.grew, diamonds, spinsLeft, win: total, total },
  ];

  while (spinsLeft > 0) {
    spinsLeft--;
    const full = size.w === cols && size.h === rows;
    const board: (BoardCell | null)[] = [];
    let win = 0;
    // Mo' Symbols: squares picked before the spin; a coin or diamond that lands on one lands doubled.
    const doubleSpots = new Set(
      extras.moSymbols
        ? shuffle(
            rng,
            Array.from({ length: cols * rows }, (_, i) => i),
          ).slice(0, rows > 5 ? DOUBLE_SPOTS.tall : DOUBLE_SPOTS.short)
        : [],
    );
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const r = rng();
        const isInside = x >= greg.x && x < greg.x + size.w && y >= greg.y && y < greg.y + size.h;
        // No diamonds land on Greg's squares (or anywhere once he fills the board).
        const kind =
          r < DIAMOND_CHANCE
            ? !full && !isInside
              ? 'diamond'
              : null
            : r < DIAMOND_CHANCE + COIN_CHANCE
              ? 'coin'
              : null;
        if (!kind) {
          board.push(null);
          continue;
        }
        // With Mo' Spins, a prize may be +1 Spin in place of cash or a jackpot.
        const drawPrize = (): Prize =>
          extras.moSpins && rng() < SPIN_PRIZE_CHANCE ? spinPrize() : draw(rng, jackpots.board);
        const prizes = [drawPrize()];
        if (doubleSpots.has(y * cols + x)) prizes.push(drawPrize());
        const cell: BoardCell = {
          kind,
          prizes,
          spinTag: 0,
          collected: kind === 'diamond' || isInside,
          boost: 0,
        };
        board.push(cell);
      }
    }
    // Go Greg: 1 or more of what Greg collects this spin (coins inside him, and the diamonds he
    // goes for) may get a bonus prize. With Mo' Spins too, it may be spins instead of cash.
    const collected = board.filter((c): c is BoardCell => c?.collected === true);
    if (extras.goGreg && collected.length > 0 && rng() < BOOST_CHANCE) {
      const lucky = new Set([collected[randomInt(rng, collected.length)] as BoardCell]);
      for (const c of collected) if (rng() < BOOST_MORE_CHANCE) lucky.add(c);
      for (const c of lucky) {
        if (extras.moSpins && rng() < BOOST_SPIN_CHANCE) c.spinTag += draw(rng, BOOST_SPINS);
        else c.boost = draw(rng, BOOST_PRIZES);
      }
    }
    for (const cell of board) {
      if (!cell?.collected) continue;
      win += cellValue(cell, jackpots.mult);
      noteJackpots(cell);
      spinsLeft += cellSpins(cell);
    }
    total += win;

    // Coins were collected where Greg stood. Now he goes after the diamonds.
    const { moves, grew } = claimAll(board);
    frames.push({ board, greg, size, moves, grew, diamonds, spinsLeft, win, total });
  }

  return { cols, rows, extras, startAt, frames, total, jackpots: won, jackpotMults: jackpots.mult };
}
