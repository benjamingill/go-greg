import { useState } from 'react';
import { type Cheat, cheats } from '../engine/cheats';

const LABELS: Record<Cheat, string> = { bonus: 'Greg Bonus', freeGames: 'Free Games', jackpot: 'Jackpot' };

/**
 * Checkboxes that force each special game, a button that holds the game where
 * it is (Pause / Play), and one that puts the game back to how it starts. Shown only in the local dev build.
 */
export function DevCheats({ paused, onPause, onReset }: { paused: boolean; onPause: () => void; onReset: () => void }) {
  const [on, setOn] = useState({ ...cheats });
  return (
    <fieldset className="dev-cheats">
      <legend className="dev-cheats-title">Force</legend>
      {(Object.keys(LABELS) as Cheat[]).map((k) => (
        <label key={k}>
          <input
            type="checkbox"
            checked={on[k]}
            onChange={(e) => {
              cheats[k] = e.target.checked;
              setOn({ ...cheats });
            }}
          />
          {LABELS[k]}
        </label>
      ))}
      <button type="button" className="dev-cheats-button" onClick={onPause}>
        {paused ? 'Play' : 'Pause'}
      </button>
      <button type="button" className="dev-cheats-button" onClick={onReset}>
        Reset game
      </button>
    </fieldset>
  );
}
