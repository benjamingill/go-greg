import { useLayoutEffect, useRef, useState } from 'react';
import {
  type BonusRun,
  cellSpins,
  cellValue,
  claimedCount,
  grewOnMove,
  growthSteps,
  nextGrowth,
  type Size,
  START_SIZE,
  walkSpot,
} from '../engine/bonus';
import { BONUS_START_SPINS } from '../engine/config';
import { type Prize, prizeMult, type Tier } from '../engine/prizes';
import { PAYING, type PayingSymbol } from '../engine/symbols';
import { Coin, DoubleArt, SYMBOL_ART, TIER_NAMES, valueText } from './art';
import { Greg } from './Greg';

/** "6×5": rows × columns, the way the machine labels Greg's sizes. */
const sizeLabel = (s: Size) => `${s.h}×${s.w}`;

/** Scrambles a number into a well-mixed 32-bit value, so neighbouring squares look unrelated. */
const mix = (n: number) => {
  let h = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
};

/** A normal reel symbol for square `i` on frame `frame` of bonus `seed`. It changes every spin. */
const tileFor = (seed: number, frame: number, i: number): PayingSymbol =>
  PAYING[mix(mix(seed + frame * 7919) + i) % PAYING.length] as PayingSymbol;

/** A dimmed normal reel symbol, shown behind the board's empty squares. */
function Tile({ sym }: { sym: PayingSymbol }) {
  return <span className={`bonus-tile${sym.length === 1 ? ' letter' : ''}`}>{SYMBOL_ART[sym]}</span>;
}

/**
 * The label on each prize of a coin or diamond ("MINI", "$200", "+1 SPIN"). A boost is
 * added into the first cash prize ("$1100") and marks it `boosted`; on a square
 * with only jackpots or spins, it's added to the last label instead ("MINI + $50").
 * Spins Go Greg added (`extraSpins`) are folded into the first "+1 SPIN" ("+3 SPINS").
 */
function prizeLabels(
  prizes: readonly Prize[],
  boost: number,
  extraSpins: number,
  value: (mult: number) => string,
): { text: string; boosted: boolean; spin: boolean; tier?: Tier | undefined }[] {
  const boostAt = boost > 0 ? prizes.findIndex((p) => p.kind === 'cash') : -1;
  const spinAt = prizes.findIndex((p) => p.kind === 'spin');
  return prizes.map((p, k) => {
    if (k === boostAt) return { text: value(prizeMult(p) + boost), boosted: true, spin: false };
    const spins = p.kind === 'spin' ? 1 + (k === spinAt ? extraSpins : 0) : 0;
    const text =
      p.kind === 'spin'
        ? `+${spins} SPIN${spins > 1 ? 'S' : ''}`
        : p.kind === 'jackpot'
          ? TIER_NAMES[p.tier].toUpperCase()
          : value(prizeMult(p));
    const tier = p.kind === 'jackpot' ? p.tier : undefined;
    const spin = p.kind === 'spin';
    const extra = boost > 0 && boostAt < 0 && k === prizes.length - 1;
    return extra
      ? { text: `${text} + ${value(boost)}`, boosted: true, spin, tier }
      : { text, boosted: spins > 1, spin, tier };
  });
}

type RollItem = PayingSymbol | 'coin' | 'diamond';
const ROLL_LENGTH = 8;

/**
 * What scrolls past in spinning square `i` on spin `spin`: mostly normal symbols,
 * with coins and diamonds at random spots (each about 1 in 7). Every square and
 * every spin gets its own strip, so they don't all show the same pattern.
 */
const rollFor = (spin: number, i: number): RollItem[] =>
  Array.from({ length: ROLL_LENGTH }, (_, k) => {
    const h = mix(mix(spin * 104729 + i) + k * 7919);
    const roll = h % 7;
    if (roll === 0) return 'coin';
    if (roll === 1) return 'diamond';
    return PAYING[(h >>> 8) % PAYING.length] as PayingSymbol;
  });

/** How long one pass of a spinning strip takes (ms); matches `roll-down` in slots.css. */
const ROLL_MS = 530;

/** The gap between board squares (px); matches `.bonus-board`. */
const GAP = 4;

/** A claimed diamond on its way from its square (where it starts, in px within the board area) to the column. */
type Flight = {
  key: string;
  double: boolean;
  left: number;
  top: number;
  size: number;
  dx: number;
  dy: number;
  scale: number;
  /** What bursts out of the square first (its value to the banner, its spins to SPINS LEFT). */
  bursts: Burst[];
};

/**
 * A collected coin's value or "+1 SPIN", flying from its label (where it starts and its size,
 * in px within the board area) to the banner total or SPINS LEFT as the coin blasts.
 */
type CoinBurst = {
  cell: number;
  kind: 'value' | 'spins';
  amount: number;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  dx: number;
  dy: number;
  scale: number;
};

/** A claimed diamond's value or spins, flying from the square's centre to where it's counted. */
type Burst = { kind: 'value' | 'spins'; amount: number; fontSize: number; dx: number; dy: number; scale: number };

/**
 * The Greg Bonus board, showing frame `frame` of `run`. While `rolling`, every
 * square spins, and the columns stop on the next frame one at a time from the
 * left (`landedCols` have stopped); everything else still shows `frame`. Then Greg makes `moved` of the frame's moves, claiming a diamond
 * with each; it leaves the board and fills a slot on the side. Coin and diamond
 * values show in credits (at `credits` bet) or dollars (at `bet`), like the meters
 * (`inCredits`); the running total shows in credits.
 */
export function BonusBoard({
  run,
  frame,
  rolling,
  landedCols,
  moved: started,
  step,
  banked,
  onBanked,
  coinsIn,
  onCoinIn,
  bet,
  credits,
  inCredits,
}: {
  run: BonusRun;
  frame: number;
  rolling: boolean;
  /** While rolling, the columns (from the left) that have already stopped on the next frame. */
  landedCols: number;
  /** Greg's moves started this frame, and squares walked on the last one. */
  moved: number;
  step: number;
  /** This frame's claimed diamonds whose value and spins have landed (and count). */
  banked: number;
  /** A claimed diamond's value and spins have landed: `moves` of frame `frame`'s moves now count. */
  onBanked: (frame: number, moves: number) => void;
  /** This frame's collected coins (by square) whose value and spins have landed (and count). */
  coinsIn: readonly number[];
  /** A collected coin's value and spins have landed. */
  onCoinIn: (frame: number, cell: number) => void;
  bet: number;
  credits: number;
  inCredits: boolean;
}) {
  // Moves whose diamond Greg has reached (and claimed). While he walks to the next,
  // he's shown on the square he has got to.
  const moved = claimedCount(run, frame, started, step);
  const walkingTo = !rolling && started > moved ? walkSpot(run, frame, started - 1, step) : null;
  // The diamond Greg has just claimed flies from its square to the diamond column
  // (or, when it grows him, to his new size on the ladder). Measured once both are on screen.
  const mainRef = useRef<HTMLDivElement>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  // A diamond that grows Greg first fills the last slot of its set; he grows once
  // that set has shown full (`grownKey` is then this move's key).
  const [grownKey, setGrownKey] = useState('');
  useLayoutEffect(() => {
    const main = mainRef.current;
    const from = main?.querySelector('[data-claimed]');
    const to = main?.querySelector('[data-target]') ?? main?.querySelector('.size-ladder .here, .all-pays');
    if (rolling || moved === 0 || !main || !from || !to) {
      setFlight(null);
      // Nothing to watch land, so nothing to wait for.
      setGrownKey(`${frame}-${moved}`);
      if (!rolling) onBanked(frame, moved);
      return;
    }
    const m = main.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const size = Math.min(a.width, a.height);
    const end = Math.min(b.width, b.height);
    // Its value flies to the banner total (outside the board, in the same bonus screen),
    // and its spins to the SPINS LEFT number, at the same time.
    const cell = run.frames[frame]?.board[run.frames[frame]?.moves[moved - 1]?.cell ?? -1];
    const burstTo = (kind: Burst['kind'], amount: number, target: Element | null | undefined): Burst[] => {
      if (amount <= 0 || !target) return [];
      const c = target.getBoundingClientRect();
      const fontSize = size * (kind === 'value' ? 0.32 : 0.2);
      return [
        {
          kind,
          amount,
          fontSize,
          dx: c.left + c.width / 2 - (a.left + a.width / 2),
          dy: c.top + c.height / 2 - (a.top + a.height / 2),
          scale: Number.parseFloat(getComputedStyle(target).fontSize) / fontSize,
        },
      ];
    };
    const bursts = cell
      ? [
          ...burstTo(
            'value',
            cellValue(cell, run.jackpotMults),
            main.closest('.bonus-screen')?.querySelector('.hero-credits strong'),
          ),
          ...burstTo('spins', cellSpins(cell), main.querySelector('.spins-left strong')),
        ]
      : [];
    // Nothing to fly: it counts at once.
    if (bursts.length === 0) onBanked(frame, moved);
    setFlight({
      key: `${frame}-${moved}`,
      double: from.getAttribute('data-claimed') === 'double',
      left: a.left - m.left + (a.width - size) / 2,
      top: a.top - m.top + (a.height - size) / 2,
      size,
      dx: b.left + b.width / 2 - (a.left + a.width / 2),
      dy: b.top + b.height / 2 - (a.top + a.height / 2),
      scale: end / size,
      bursts,
    });
  }, [frame, moved, rolling, run, onBanked]);

  // Once the squares have all landed, each collected coin sends its value flying to the banner
  // total and its spins to SPINS LEFT as it blasts; they count as they land (`coinsIn`).
  const [coinBursts, setCoinBursts] = useState<CoinBurst[]>([]);
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (rolling || !main) {
      setCoinBursts([]);
      return;
    }
    const m = main.getBoundingClientRect();
    const targets = {
      value: main.closest('.bonus-screen')?.querySelector('.hero-credits strong'),
      spins: main.querySelector('.spins-left strong'),
    };
    const bursts: CoinBurst[] = [];
    for (const el of main.querySelectorAll<HTMLElement>('[data-coin]')) {
      const cell = Number(el.dataset.coin);
      const coin = run.frames[frame]?.board[cell];
      if (!coin) continue;
      const before = bursts.length;
      for (const [kind, amount, label] of [
        ['value', cellValue(coin, run.jackpotMults), el.querySelector('.bonus-prize:not(.spin-prize)')],
        ['spins', cellSpins(coin), el.querySelector('.spin-prize, .bonus-tag')],
      ] as const) {
        const to = targets[kind];
        if (amount <= 0 || !label || !to) continue;
        const a = label.getBoundingClientRect();
        const c = to.getBoundingClientRect();
        const fontSize = Number.parseFloat(getComputedStyle(label).fontSize);
        bursts.push({
          cell,
          kind,
          amount,
          left: a.left - m.left,
          top: a.top - m.top,
          width: a.width,
          height: a.height,
          fontSize,
          dx: c.left + c.width / 2 - (a.left + a.width / 2),
          dy: c.top + c.height / 2 - (a.top + a.height / 2),
          scale: Number.parseFloat(getComputedStyle(to).fontSize) / fontSize,
        });
      }
      // Nothing to watch fly: it counts at once.
      if (bursts.length === before) onCoinIn(frame, cell);
    }
    setCoinBursts(bursts);
  }, [frame, rolling, run, onCoinIn]);

  /** A prize multiple as written on a square: credits ("200") or dollars ("$200"), like the meters. */
  const valueLabel = (mult: number) => valueText(mult, credits, bet, inCredits);
  const f = run.frames[frame];
  if (!f) return null;
  // Greg grows the moment a claimed diamond takes him to a new size, so his size goes move by move.
  // Before the first spin, he starts 2×2 at `startAt` and claims the diamonds already there.
  const before = run.frames[frame - 1] ?? { greg: run.startAt, size: START_SIZE, diamonds: 0 };
  const lastMove = moved > 0 ? f.moves[moved - 1] : undefined;
  const lastSize = (moved > 1 ? f.moves[moved - 2]?.size : before.size) ?? before.size;
  // The move now showing grows him: until its set of slots has shown full, he
  // stays the size he was, where he reached the diamond.
  const grewOnThis = !rolling && moved > 0 && grewOnMove(run, frame, moved - 1);
  const holding = grewOnThis && grownKey !== `${frame}-${moved}`;
  const greg = walkingTo ?? (holding && lastMove ? lastMove.reach : (lastMove?.at ?? before.greg));
  const size = holding ? lastSize : (lastMove?.size ?? before.size);
  // He has just grown on the move now showing.
  const grewNow = grewOnThis && !holding;
  // Each claimed diamond counts once, a Mo' Symbols double twice.
  const counted = f.moves.slice(0, moved).reduce((n, m) => n + (f.board[m.cell]?.prizes.length ?? 1), before.diamonds);
  const added = lastMove ? (f.board[lastMove.cell]?.prizes.length ?? 1) : 0;
  // While holding, only up to the set he's filling (a double's spare diamond counts after he grows).
  const holdAt = growthSteps(run.rows).find((g) => g.at > counted - added)?.at ?? counted;
  const diamonds = holding ? Math.min(counted, holdAt) : counted;
  // Differs from bonus to bonus, so each one gets its own background tiles.
  const seed = run.startAt.x * 131 + run.startAt.y * 17 + Math.round(run.total * 100);
  const claimed = new Set(f.moves.slice(0, moved).map((m) => m.cell));

  // The diamond slots run from the last size Greg reached to the next one.
  // Once he's at full size, the last set stays full.
  const steps = growthSteps(run.rows);
  // Every size Greg can be in this bonus, smallest first.
  const sizes = [START_SIZE, ...steps.map((g) => g.size)];
  // While holding, the set he's filling is still the one showing (it shows full), not the next.
  const progress = holding ? diamonds - 1 : diamonds;
  const next = nextGrowth(run, { ...f, diamonds: progress });
  const reached = steps.filter((g) => g.at <= progress);
  const target = next ?? steps.at(-1);
  const from = next ? (reached.at(-1)?.at ?? 0) : (steps.at(-2)?.at ?? 0);
  const slots = (target?.at ?? 0) - from;
  const filled = next ? Math.min(diamonds - from, slots) : slots;
  // Once Greg fills the board, every coin pays.
  const full = !next;
  // The diamond claimed on the move now showing, and the slots it fills as it lands.
  const justClaimed = !rolling ? lastMove : undefined;
  const arrivingFrom = Math.max(0, filled - (diamonds - (counted - added)));

  // Spins left, as the player should see it: one comes off as the squares start spinning;
  // a "+1 spin" coin inside Greg adds one as its column lands, a "+1 spin" diamond as he claims it,
  // and growing adds its spins the moment he grows.
  const spinsShown = (() => {
    // "+1 spin" coins count once the squares have all landed and their spins have flown in.
    if (rolling) return f.spinsLeft - 1;
    const start = frame === 0 ? BONUS_START_SPINS : (run.frames[frame - 1]?.spinsLeft ?? 0) - 1;
    const coinTags = f.board.reduce(
      (n, c, i) => (c?.kind === 'coin' && c.collected && coinsIn.includes(i) ? n + cellSpins(c) : n),
      0,
    );
    const diamondTags = f.moves.slice(0, Math.min(moved, banked)).reduce((n, m) => {
      const c = f.board[m.cell];
      return n + (c ? cellSpins(c) : 0);
    }, 0);
    const grown = steps
      .filter((g) => g.at > before.diamonds && g.at <= progress)
      .reduce((n, g) => n + (run.rows > 5 ? (g.spinsGoGreg ?? g.spins) : g.spins), 0);
    return start + coinTags + diamondTags + grown;
  })();

  return (
    <div className="bonus">
      <div className="bonus-main" ref={mainRef}>
        <div className="bonus-board-fit" style={{ '--cols': run.cols, '--rows': run.rows } as React.CSSProperties}>
          <div
            className="bonus-board"
            style={
              {
                gridTemplateColumns: `repeat(${run.cols}, 1fr)`,
                gridTemplateRows: `repeat(${run.rows}, 1fr)`,
              } as React.CSSProperties
            }
          >
            {f.board.map((c, i) => {
              const x = i % run.cols;
              const y = Math.floor(i / run.cols);
              const spinning = rolling && x >= landedCols;
              // A column that has stopped early shows the next frame. Its coins aren't
              // blasted until every column has stopped and the frame lands in full.
              const early = rolling && !spinning;
              const tileFrame = early ? frame + 1 : frame;
              const shown = early ? (run.frames[frame + 1]?.board[i] ?? null) : c;
              // A diamond Greg has claimed stays, dimmed (see .claimed in slots.css).
              const gone = claimed.has(i) ? ' claimed' : '';
              const state = !shown
                ? ''
                : early
                  ? ` ${shown.kind}${shown.collected ? '' : ' missed'}`
                  : ` ${shown.kind}${shown.collected ? ' collected' : ' missed'}${gone}`;
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: squares are fixed positions.
                  key={`${frame}-${rolling}-${spinning}-${i}`}
                  className={`bonus-cell${spinning ? ' rolling' : state}`}
                  style={{ gridColumn: x + 1, gridRow: y + 1 }}
                  // A collected coin, whose value and spins fly to the banner and SPINS LEFT as it blasts.
                  data-coin={!rolling && shown?.kind === 'coin' && shown.collected ? i : undefined}
                  data-claimed={
                    justClaimed?.cell === i && !spinning
                      ? (c?.prizes.length ?? 1) > 1
                        ? 'double'
                        : 'single'
                      : undefined
                  }
                >
                  {spinning ? (
                    // Each square starts at a different point in the strip so they don't move in step.
                    <span
                      className="roll-strip"
                      style={{ animationDelay: `${-(mix(seed + frame * 31 + i * 7) % ROLL_MS)}ms` }}
                    >
                      {[...rollFor(seed + frame, i), ...rollFor(seed + frame, i)].map((r, k) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed strip of symbols.
                        <span key={k} className="roll-item">
                          {r === 'coin' ? <Coin /> : r === 'diamond' ? '💎' : <Tile sym={r} />}
                        </span>
                      ))}
                    </span>
                  ) : !shown ? (
                    <Tile sym={tileFor(seed, tileFrame, i)} />
                  ) : (
                    shown && (
                      <>
                        {/* A Mo' Symbols double is one picture of two diamonds or coins on a diagonal, each
                            value written over its half. A boosted value is in gold, with the boost added in. */}
                        {shown.prizes.length > 1 ? (
                          <span className="bonus-item bonus-double">
                            <DoubleArt kind={shown.kind} />
                            {prizeLabels(shown.prizes, shown.boost, shown.spinTag, valueLabel).map((l, k) => (
                              <span
                                // biome-ignore lint/suspicious/noArrayIndexKey: two fixed prizes.
                                key={k}
                                className={`bonus-prize double-label double-${k}${l.boosted ? ' boosted' : ''}${l.spin ? ' spin-prize' : ''}${l.tier ? ` jp-${l.tier}` : ''}`}
                              >
                                {l.text}
                              </span>
                            ))}
                          </span>
                        ) : (
                          prizeLabels(shown.prizes, shown.boost, shown.spinTag, valueLabel).map((l, k) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: one fixed prize.
                            <span key={k} className="bonus-item">
                              <span className="bonus-icon">{shown.kind === 'diamond' ? '💎' : <Coin />}</span>
                              <span
                                className={`bonus-prize${l.boosted ? ' boosted' : ''}${l.spin ? ' spin-prize' : ''}${l.tier ? ` jp-${l.tier}` : ''}`}
                              >
                                {l.text}
                              </span>
                            </span>
                          ))
                        )}
                        {shown.spinTag > 0 && !shown.prizes.some((p) => p.kind === 'spin') && (
                          <span className="bonus-tag">
                            +{shown.spinTag} spin{shown.spinTag > 1 ? 's' : ''}
                          </span>
                        )}
                      </>
                    )
                  )}
                </div>
              );
            })}
            <div
              className={`greg-area${grewNow ? ' grew' : ''}`}
              // Placed by translate (not grid lines) so he slides from square to square without
              // re-running layout each frame. --greg-step is one square plus the gap (slots.css).
              style={{
                translate: `calc(${greg.x} * var(--greg-step)) calc(${greg.y} * var(--greg-step))`,
                width: `calc(${size.w} * (100% + ${GAP}px) / ${run.cols} - ${GAP}px)`,
                height: `calc(${size.h} * (100% + ${GAP}px) / ${run.rows} - ${GAP}px)`,
              }}
            >
              <span className="greg-face">
                <Greg />
              </span>
            </div>
          </div>
        </div>
        {!full && (
          <div
            className="diamond-slots"
            role="img"
            aria-label={`${filled} of ${slots} diamonds`}
            style={{ '--n': slots } as React.CSSProperties}
          >
            {Array.from({ length: slots }, (_, k) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: slots are fixed positions.
                key={k}
                className={`diamond-slot${k < filled ? ' full' : ''}${justClaimed && k >= arrivingFrom && k < filled ? ' arriving' : ''}`}
                data-target={justClaimed && k === filled - 1 ? true : undefined}
                // The set has shown full: now Greg grows.
                onAnimationEnd={(e) => {
                  if (e.animationName === 'slot-hold') setGrownKey(`${frame}-${moved}`);
                }}
              >
                💎
              </span>
            ))}
          </div>
        )}
        <div className={`ladder-col${full ? ' all-pays-col' : ''}`}>
          {full ? (
            // With Greg filling the board, the diamond column and ladder give way to this panel.
            <div className="all-pays">
              <span>All</span>
              <Coin />
              <span>pays</span>
            </div>
          ) : (
            <ol className="size-ladder" aria-label={`Greg is ${sizeLabel(size)}`}>
              {[...sizes].reverse().map((sz, k, all) => {
                const here = sz.w === size.w && sz.h === size.h;
                // Sizes below the current one (later in this top-down list) have been passed and stay lit.
                const passed = all.findIndex((s) => s.w === size.w && s.h === size.h) < k;
                return (
                  <li key={sizeLabel(sz)} className={here ? 'here' : passed ? 'passed' : ''}>
                    {(here || passed) && (
                      <span className="ladder-greg">
                        <Greg />
                      </span>
                    )}
                    {sizeLabel(sz)}
                  </li>
                );
              })}
            </ol>
          )}
          <div className="spins-left">
            {/* A new count remounts it, which plays its pop as spins land. */}
            <strong key={spinsShown}>{spinsShown}</strong>
            <span>
              Spins
              <br />
              left
            </span>
          </div>
        </div>
        {coinBursts.map((b) => (
          <span
            key={`coin-${b.kind}-${frame}-${b.cell}`}
            className={`value-flight coin-flight${b.kind === 'spins' ? ' spins-flight' : ''}`}
            aria-hidden="true"
            style={
              {
                left: b.left,
                top: b.top,
                width: b.width,
                height: b.height,
                fontSize: b.fontSize,
                '--dx': `${b.dx}px`,
                '--dy': `${b.dy}px`,
                '--scale': b.scale,
              } as React.CSSProperties
            }
            // Landed (a coin's value and spins land together): the banner and SPINS LEFT take them in now.
            onAnimationEnd={(e) => {
              if (e.animationName === 'value-fly') onCoinIn(frame, b.cell);
            }}
          >
            {b.kind === 'value' ? valueLabel(b.amount) : `+${b.amount} SPIN${b.amount > 1 ? 'S' : ''}`}
          </span>
        ))}
        {flight?.bursts.map((b) => (
          <span
            key={`${b.kind}-${flight.key}`}
            className={`value-flight${b.kind === 'spins' ? ' spins-flight' : ''}`}
            aria-hidden="true"
            style={
              {
                left: flight.left,
                top: flight.top,
                width: flight.size,
                height: flight.size,
                fontSize: b.fontSize,
                '--dx': `${b.dx}px`,
                '--dy': `${b.dy}px`,
                '--scale': b.scale,
              } as React.CSSProperties
            }
            // Landed (both land together): the banner total and SPINS LEFT take them in now.
            onAnimationEnd={(e) => {
              if (e.animationName === 'value-fly') onBanked(frame, moved);
            }}
          >
            {b.kind === 'value' ? valueLabel(b.amount) : `+${b.amount} SPIN${b.amount > 1 ? 'S' : ''}`}
          </span>
        ))}
        {flight && (
          <span
            key={flight.key}
            className="diamond-flight"
            aria-hidden="true"
            style={
              {
                left: flight.left,
                top: flight.top,
                width: flight.size,
                height: flight.size,
                fontSize: flight.size * 0.8,
                '--dx': `${flight.dx}px`,
                '--dy': `${flight.dy}px`,
                '--scale': flight.scale,
              } as React.CSSProperties
            }
          >
            {flight.double ? <DoubleArt kind="diamond" /> : '💎'}
          </span>
        )}
      </div>
    </div>
  );
}
