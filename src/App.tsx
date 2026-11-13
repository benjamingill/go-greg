import { type ComponentType, useEffect, useState } from 'react';
import { load, save } from '.';
import { SlotsGame } from './SlotsGame';
import { THEME } from './themes';

/** Casino games. `active` is false while another game is showing. */
const GAMES: readonly { id: string; label: string; title: string; Game: ComponentType<{ active: boolean }> }[] = [
  { id: 'slots', label: 'Slots', title: THEME.goName, Game: SlotsGame },
];

const LAST_GAME_KEY = 'casino:last-game';

export function App() {
  return <Casino />;
}

/**
 * Switches between the casino games. Each game is independent (its own
 * bankroll, stats and saved data). All games stay mounted and hidden ones keep
 * their state, so switching away mid-round and back picks up where you left off.
 */
function Casino() {
  const [current, setCurrent] = useState(() =>
    load(LAST_GAME_KEY, (v) => (GAMES.some((g) => g.id === v) ? (v as string) : undefined), GAMES[0]?.id ?? ''),
  );

  useEffect(() => {
    save(LAST_GAME_KEY, current);
    document.title = GAMES.find((g) => g.id === current)?.title ?? THEME.goName;
  }, [current]);

  return (
    <>
      {GAMES.length > 1 && (
        <nav className="game-switcher" aria-label="Games">
          {GAMES.map((g) => (
            <button
              type="button"
              key={g.id}
              className={g.id === current ? 'selected' : ''}
              aria-pressed={g.id === current}
              onClick={() => setCurrent(g.id)}
            >
              {g.label}
            </button>
          ))}
        </nav>
      )}
      {GAMES.map(({ id, Game }) => (
        <div key={id} hidden={id !== current}>
          <Game active={id === current} />
        </div>
      ))}
    </>
  );
}
