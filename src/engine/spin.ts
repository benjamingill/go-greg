import { cheats } from './cheats';
import {
  FREE_GAMES,
  FREE_GREG_REEL_WEIGHTS,
  FREE_REEL_WEIGHTS,
  GEM_PRIZES,
  GREG_REEL_WEIGHTS,
  JACKPOT_CHANCE,
  LONE_FREE_GAMES_CHANCE,
  RANDOM_BONUS_CHANCE,
  REEL_WEIGHTS,
  SCATTER_PAYS,
} from './config';
import { type JackpotTerms, PLAIN_TERMS } from './jackpots';
import { PAYLINES, REELS, ROWS } from './paylines';
import type { Prize } from './prizes';
import { draw, type Rng, randomInt } from './rng';
import { GEM_COLORS, type GemColor, PAYING, PAYTABLE, type PayingSymbol, type Sym, WILD_PAYS } from './symbols';

export interface Gem {
  color: GemColor;
  prize: Prize;
}

export interface Cell {
  sym: Sym;
  /** Only on gem cells. */
  gem?: Gem;
}

/** `grid[reel][row]`, row 0 at the top. */
export type Grid = readonly (readonly Cell[])[];

export interface LineWin {
  /** Index into PAYLINES. */
  line: number;
  sym: PayingSymbol | 'wild';
  count: number;
  /** Multiple of the total bet. */
  pay: number;
}

/** A gem and where it landed: its reel and row (0 = top). */
export interface PlacedGem extends Gem {
  reel: number;
  row: number;
}

export interface BonusTrigger {
  gems: PlacedGem[];
  /** The gem colours whose extras start: all those on the screen with Greg, or the ones that hit their own chance without him. */
  colors: GemColor[];
  /** True when gems started it without Greg. */
  random: boolean;
}

export interface ReelResult {
  grid: Grid;
  lineWins: LineWin[];
  scatters: number;
  /** Instant scatter prize, as a multiple of the total bet. */
  scatterPay: number;
  /** Free Games awarded (0 if none). */
  freeGames: number;
  bonus: BonusTrigger | null;
  jackpot: boolean;
}

/** Symbols that appear at most once per reel. */
const ONCE_PER_REEL: ReadonlySet<Sym> = new Set(['scatter', 'greg']);

function drawReel(
  rng: Rng,
  reel: number,
  gregLanded: boolean,
  seen: { grand: boolean },
  free: boolean,
  jackpots: JackpotTerms,
): Cell[] {
  const weights =
    reel > 0 && gregLanded
      ? free
        ? FREE_GREG_REEL_WEIGHTS
        : GREG_REEL_WEIGHTS
      : (free ? FREE_REEL_WEIGHTS : REEL_WEIGHTS)[reel];
  if (!weights) throw new RangeError(`No reel ${reel}`);
  const cells: Cell[] = [];
  while (cells.length < ROWS) {
    const sym = draw(rng, weights);
    if (ONCE_PER_REEL.has(sym) && cells.some((c) => c.sym === sym)) continue;
    if (sym === 'gem') {
      const color = GEM_COLORS[randomInt(rng, GEM_COLORS.length)] as GemColor;
      const prize = draw(rng, seen.grand ? jackpots.gemsNoGrand : jackpots.gems);
      if (prize.kind === 'jackpot' && prize.tier === 'grand') seen.grand = true;
      cells.push({ sym, gem: { color, prize } });
    } else {
      cells.push({ sym });
    }
  }
  return cells;
}

/**
 * Reel 1 is drawn first; if Greg is on it, reels 2–5 use the Greg weights. Free
 * Games use their own reels, with more wilds. At most one Grand shows on the gems.
 * `jackpots` sets how likely jackpot gems are at the bet.
 */
export function drawGrid(rng: Rng, free = false, jackpots: JackpotTerms = PLAIN_TERMS): Grid {
  const seen = { grand: false };
  const first = drawReel(rng, 0, false, seen, free, jackpots);
  const greg = first.some((c) => c.sym === 'greg');
  return [first, ...Array.from({ length: REELS - 1 }, (_, i) => drawReel(rng, i + 1, greg, seen, free, jackpots))];
}

const cellAt = (grid: Grid, reel: number, row: number) => grid[reel]?.[row]?.sym;

/**
 * Line wins on the first `lines` paylines pay left to right from reel 1. The
 * paytable is in line bets, so each pay is divided by `lines` to make it a
 * multiple of the total bet. Wilds stand in for any paying symbol,
 * including at the start of a line, and a run of wilds from reel 1 also pays
 * as WILD, so each line pays its best reading.
 */
export function lineWins(grid: Grid, lines = PAYLINES.length): LineWin[] {
  const wins: LineWin[] = [];
  PAYLINES.slice(0, lines).forEach((rows, line) => {
    let best: LineWin | null = null;
    for (const sym of PAYING) {
      let count = 0;
      while (count < REELS) {
        const s = cellAt(grid, count, rows[count] as number);
        if (s !== sym && s !== 'wild') break;
        count++;
      }
      if (count < 3) continue;
      // The paytable is in line bets; as a multiple of the total bet that's ÷ lines played.
      const pay = (PAYTABLE[sym][count - 3] as number) / lines;
      if (!best || pay > best.pay) best = { line, sym, count, pay };
    }
    let wilds = 0;
    while (wilds < REELS && cellAt(grid, wilds, rows[wilds] as number) === 'wild') wilds++;
    if (wilds >= 3) {
      const pay = (WILD_PAYS[wilds - 3] as number) / lines;
      if (!best || pay > best.pay) best = { line, sym: 'wild', count: wilds, pay };
    }
    if (best) wins.push(best);
  });
  return wins;
}

const allCells = (grid: Grid) => grid.flat();

/** The Greg Bonus a grid starts: Greg with a gem, or now and then gems alone. */
function bonusTrigger(grid: Grid, rng: Rng): BonusTrigger | null {
  const gems = grid.flatMap((reel, r) => reel.flatMap((c, row) => (c.gem ? [{ ...c.gem, reel: r, row }] : [])));
  const greg = grid[0]?.some((c) => c.sym === 'greg') ?? false;
  const present = GEM_COLORS.filter((color) => gems.some((g) => g.color === color));
  if (greg && gems.length > 0) return { gems, colors: present, random: false };
  // Without Greg, each colour on the screen has its own chance to start its own extra.
  const hit = present.filter(() => rng() < RANDOM_BONUS_CHANCE);
  return hit.length > 0 ? { gems, colors: hit, random: true } : null;
}

/**
 * Works out everything a grid awards. 3 or more FREE GAMES symbols always award Free
 * Games, including during them (a retrigger); a lone one or two each have a small
 * chance of doing the same for the smallest prize. Any wild may start the jackpot game,
 * in a free game too.
 */
export function evaluate(
  grid: Grid,
  rng: Rng,
  lines = PAYLINES.length,
  jackpots: JackpotTerms = PLAIN_TERMS,
): ReelResult {
  const cells = allCells(grid);
  const scatters = cells.filter((c) => c.sym === 'scatter').length;
  const lone =
    scatters > 0 && scatters < 3 && Array.from({ length: scatters }).some(() => rng() < LONE_FREE_GAMES_CHANCE);
  const freeGames = scatters >= 3 || lone ? FREE_GAMES : 0;
  const scatterPay =
    scatters >= 3 ? (SCATTER_PAYS[Math.min(scatters, 5) - 3] as number) : lone ? (SCATTER_PAYS[0] as number) : 0;

  const bonus = bonusTrigger(grid, rng);

  // Every wild on the screen gets its own chance, which rises with the bet.
  const chance = JACKPOT_CHANCE * jackpots.pickChance;
  const jackpot = cells.filter((c) => c.sym === 'wild').some(() => rng() < chance);

  return { grid, lineWins: lineWins(grid, lines), scatters, scatterPay, freeGames, bonus, jackpot };
}

export function spinReels(
  rng: Rng,
  lines = PAYLINES.length,
  free = false,
  jackpots: JackpotTerms = PLAIN_TERMS,
): ReelResult {
  if (free) return evaluate(drawGrid(rng, true, jackpots), rng, lines, jackpots);
  const grid = drawGrid(rng, false, jackpots).map((reel) => [...reel]);
  // Testing switches (see cheats.ts): put the symbols that start each game on the screen.
  const put = (reel: number, row: number, cell: Cell) => {
    const cells = grid[reel];
    if (cells) cells[row] = cell;
  };
  if (cheats.bonus) {
    // Only one Greg: any the reel already drew gives way to a plain symbol.
    const first = grid[0];
    if (first) for (let row = 1; row < first.length; row++) if (first[row]?.sym === 'greg') first[row] = { sym: 'J' };
    put(0, 0, { sym: 'greg' });
    put(1, 1, {
      sym: 'gem',
      gem: { color: GEM_COLORS[randomInt(rng, GEM_COLORS.length)] as GemColor, prize: draw(rng, GEM_PRIZES) },
    });
  }
  if (cheats.freeGames) for (const reel of [0, 2, 4]) put(reel, 2, { sym: 'scatter' });
  if (cheats.jackpot) put(3, 0, { sym: 'wild' });
  const result = evaluate(grid, rng, lines, jackpots);
  return cheats.jackpot ? { ...result, jackpot: true } : result;
}
