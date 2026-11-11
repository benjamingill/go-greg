import { useEffect, useState } from 'react';
import { type PickGame as Game, PICK_COINS, pickDone, type Revealed } from '../engine/pick';
import { Cup, TIER_NAMES } from './art';

/** How long the matched names show before the "Jackpot awarded" overlay comes up. */
const AWARD_DELAY_MS = 1500;

/**
 * The jackpot pick game: turn over coffee cups until three jackpots match. Laid out
 * like the machine's: a banner over a 5 × 3 grid filling the reel area, picked
 * cups showing just the jackpot name.
 */
export function PickGame({
  game,
  revealed,
  amount,
  onPick,
}: {
  game: Game;
  revealed: Revealed;
  /** The jackpot won, in dollars, for the overlay (jackpots are shown in currency). */
  amount: number;
  onPick: (index: number) => void;
}) {
  const done = pickDone(game, revealed);
  const [awarded, setAwarded] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setAwarded(true), AWARD_DELAY_MS);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <div className={`pick${done ? ' done' : ''}`}>
      <div className="pick-banner">
        {done ? (
          "You've won!"
        ) : (
          <>
            Match <span className="pick-three">3</span> jackpots to win
          </>
        )}
      </div>
      <div className="pick-fit">
        <div className="pick-grid">
          {Array.from({ length: PICK_COINS }, (_, i) => {
            const t = revealed[i] ?? null;
            // Once won, everything but the matched three dims, unpicked cups included.
            const lit = done && t === game.winner ? ' won' : done ? ' dim' : '';
            return (
              <button
                type="button"
                // biome-ignore lint/suspicious/noArrayIndexKey: cups are fixed positions.
                key={i}
                className={`pick-cup${t ? ` pick-${t} revealed` : ''}${lit}`}
                disabled={done || t !== null}
                onClick={() => onPick(i)}
                aria-label={t ? TIER_NAMES[t] : `Coffee cup ${i + 1}`}
              >
                {t ? <span className="pick-name">{TIER_NAMES[t]}</span> : <Cup />}
              </button>
            );
          })}
        </div>
      </div>
      {done && awarded && (
        <div className="jackpot-award" aria-live="polite">
          <div className={`award-name pick-${game.winner}`}>{TIER_NAMES[game.winner]}</div>
          <div className="award-scroll">
            <span className="award-label">Jackpot awarded</span>
            {/* Jackpots are shown in currency, not credits. */}
            <strong className="award-amount">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
