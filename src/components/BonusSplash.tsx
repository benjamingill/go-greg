import { Fragment } from 'react';
import greg from '../assets/faces/greg.png';
import mike from '../assets/faces/mike.png';
import scott from '../assets/faces/scott.png';
import type { Extras, GemColor } from '../engine/symbols';
import { Coin } from './art';
import { Greg } from './Greg';

/** The line under each extra's name, copied from the machine. */
type Featuring = 'spins' | 'symbols' | 'rows';

const PLAQUES: readonly {
  extra: keyof Extras;
  color: GemColor;
  label: string;
  featuring: Featuring;
  face: string;
}[] = [
  { extra: 'moSpins', color: 'green', label: "Mo' Spins", featuring: 'spins', face: scott },
  { extra: 'goGreg', color: 'red', label: 'Go Greg', featuring: 'rows', face: greg },
  { extra: 'moSymbols', color: 'blue', label: "Mo' Symbols", featuring: 'symbols', face: mike },
];

const CONFETTI = 14;

/**
 * Shown over the Greg Bonus board before the first spin, like the machine's
 * "YOU'VE WON" screen. It stays until the player presses Spin.
 */
export function BonusSplash({ extras }: { extras: Extras }) {
  return (
    <div className="bonus-splash" aria-live="polite">
      <div className="splash-greg">
        <Greg />
        {Array.from({ length: CONFETTI }, (_, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed decoration.
            key={i}
            className="confetti"
            style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-((i * 53) % 1400)}ms` }}
          />
        ))}
      </div>
      <div className="splash-title">You've won</div>
      {PLAQUES.filter((p) => extras[p.extra]).map((p, k) => (
        <Fragment key={p.extra}>
          {/* A "+" joins the plaques when more than one extra is won. */}
          {k > 0 && (
            <div className="splash-plus" aria-hidden="true">
              {/* Drawn, not typed, so it sits exactly in the middle. */}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v18M3 12h18" />
              </svg>
            </div>
          )}
          <div className={`splash-plaque splash-${p.color}`}>
            <img src={p.face} alt="" className={`splash-face face-${p.color}`} />
            <span className="splash-body">
              <span className="splash-name">{p.label}</span>
              {p.featuring === 'spins' && (
                <span className="splash-featuring">
                  Featuring{' '}
                  <span className="splash-tagged" role="img" aria-label="diamond with +1 spin">
                    💎<small>+1 spin</small>
                  </span>{' '}
                  and{' '}
                  <span className="splash-tagged" role="img" aria-label="coin with +1 spin">
                    <Coin decorative />
                    <small>+1 spin</small>
                  </span>
                </span>
              )}
              {p.featuring === 'rows' && (
                <span className="splash-featuring">
                  Featuring extra rows and random <span className="splash-boost">prize boost</span>
                </span>
              )}
              {p.featuring === 'symbols' && (
                <span className="splash-featuring">
                  Featuring{' '}
                  <span role="img" aria-label="diamonds">
                    💎💎
                  </span>{' '}
                  and{' '}
                  <span className="coin-pair" role="img" aria-label="coins">
                    <Coin decorative />
                    <Coin decorative />
                  </span>
                </span>
              )}
            </span>
          </div>
        </Fragment>
      ))}
      <div className="splash-press">Press Spin to start feature</div>
    </div>
  );
}
