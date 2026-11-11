import { useMemo } from 'react';
import type { Cell, Grid } from '../engine/spin';
import { SYMBOL_ART, SymbolView } from './art';

const BLUR = Object.values(SYMBOL_ART);

/**
 * The 5×3 reels. Reels at index `stopped` and above are still spinning.
 * `highlight` holds "reel-row" keys for squares in a winning line.
 */
export function Reels({
  grid,
  credits,
  bet,
  inCredits,
  stopped,
  highlight,
}: {
  grid: Grid;
  /** Credits bet, and the bet in dollars, for showing gem prizes in credits or dollars. */
  credits: number;
  bet: number;
  inCredits: boolean;
  stopped: number;
  highlight: ReadonlySet<string>;
}) {
  // A fixed shuffle of symbols for each spinning reel, so the blur doesn't change every render.
  const strips = useMemo(
    () => grid.map((_, r) => Array.from({ length: 10 }, (_, i) => BLUR[(i * 7 + r * 3) % BLUR.length])),
    [grid],
  );
  // Once Greg lands on reel 1, his reel stays icy, and so does the reel that stops
  // next while it spins (lighting up from its middle). A reel that has stopped stays
  // icy only if it landed a gem.
  const gregLanded = stopped > 0 && (grid[0]?.some((c) => c.sym === 'greg') ?? false);
  const icy = (cells: readonly Cell[], reel: number) =>
    gregLanded && (reel === 0 || reel === stopped || (reel < stopped && cells.some((c) => c.gem)));
  return (
    <div className="reels">
      {grid.map((cells, reel) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: reels are fixed positions.
        <div className={`reel${icy(cells, reel) ? ` greg-reel${reel >= stopped ? ' lighting' : ''}` : ''}`} key={reel}>
          {reel >= stopped ? (
            <div className="reel-strip" aria-hidden="true">
              {[...(strips[reel] ?? []), ...(strips[reel] ?? [])].map((s, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: decorative, never reordered.
                <span key={i}>{s}</span>
              ))}
            </div>
          ) : (
            cells.map((cell, row) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: rows are fixed positions.
                key={row}
                className={`reel-cell landed${highlight.has(`${reel}-${row}`) ? ' win' : ''}${cell.sym === 'greg' ? ' greg-cell' : ''}`}
              >
                <SymbolView cell={cell} credits={credits} bet={bet} inCredits={inCredits} />
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
