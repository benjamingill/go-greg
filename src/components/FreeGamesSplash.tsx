/**
 * Shown over the reels when a spin awards Free Games, like the machine's
 * "6 FREE GAMES AWARDED" sign: the number in a red medallion over a red scroll.
 * It stays until the player presses Spin, which starts the first free game.
 */
export function FreeGamesSplash({ games }: { games: number }) {
  return (
    <div className="free-splash" aria-live="polite">
      <div className="free-medal">{games}</div>
      <div className="free-scroll">
        <span className="free-title">Free games</span>
        <span className="free-title">awarded</span>
        <span className="free-press">Press Spin to start feature</span>
      </div>
    </div>
  );
}
