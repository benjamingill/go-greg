/** How long an orb takes to fly from its symbol to the chest (ms). */
const FLIGHT_MS = 640;
/** Points along each flight; the browser draws straight lines between them. */
const STEPS = 20;
const SIZE = 18;
/** The share of the flight spent coming at the player; the rest is the drop into the target. */
const THROW = 0.72;
/** How far above the target (px) the throw ends, before the orb drops into it. */
const DROP = 26;
/** How big an orb gets at the top of its throw, as it comes towards the player. */
const NEAR = 2;
/** Each orb starts tilted up to this many degrees either way, so no two gems look the same. */
const TILT = 30;
/** And turns up to this many more degrees either way as it flies: a slight tumble, never a flip. */
const TUMBLE = 15;
/**
 * Three orbs leave each symbol, one after another, each aimed a little to one side of the
 * others (`spread`, as a share of the distance) so they don't fly on top of each other.
 */
const ORBS: readonly { delay: number; spread: number; size: number }[] = [
  { delay: 0, spread: 0, size: 1 },
  { delay: 80, spread: 0.05, size: 0.8 },
  { delay: 160, spread: -0.05, size: 0.9 },
];
/** The orb and its trail: each ghost follows a little later, smaller and fainter. */
const TRAIL: readonly { delay: number; scale: number; opacity: number }[] = [
  { delay: 0, scale: 1, opacity: 1 },
  { delay: 35, scale: 0.75, opacity: 0.45 },
  { delay: 70, scale: 0.5, opacity: 0.22 },
];

/** The middle of an element, or `at` of the way down it. */
const centre = (el: Element, at = 0.5) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height * at };
};

export interface TossOptions {
  /** A colour for the orbs ("green", "red", "blue"); gold without it. */
  color?: string;
  /** How far down the target the orbs land, 0 at its top and 1 at its bottom (half way by default). */
  aimY?: number;
}

/**
 * Tosses three glowing orbs (gold, unless `color` says otherwise) from each of `from` into
 * `to`, each with a short trail. Each is thrown at the player: it flies in a nearly straight
 * line to just above the target, growing as it comes and slowing like a toss, then drops
 * down into the target, shrinking as it falls in. `onLand` runs when the first orbs arrive.
 * Returns a function that stops it all (the orbs vanish and `onLand` doesn't run).
 */
export function tossCoins(
  from: readonly Element[],
  to: Element,
  onLand: () => void,
  { color, aimY }: TossOptions = {},
): () => void {
  const end = centre(to, aimY);
  const orbs: HTMLElement[] = [];
  const leads: Animation[] = [];
  const all: Animation[] = [];
  let stopped = false;

  for (const source of from) {
    const start = centre(source);
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    for (const [j, orb] of ORBS.entries()) {
      // Where the throw ends: above the target, nudged sideways by the orb's spread.
      const top = { x: end.x + distance * orb.spread, y: end.y - DROP };
      // Its own random tilt and tumble (its trail turns with it).
      const tilt = (Math.random() * 2 - 1) * TILT;
      const tumble = (Math.random() * 2 - 1) * TUMBLE;
      const frames = (scale: number, opacity: number): Keyframe[] => {
        const out: Keyframe[] = [];
        for (let i = 0; i <= STEPS; i++) {
          const t = i / STEPS;
          let x: number;
          let y: number;
          let grow: number;
          if (t <= THROW) {
            // The throw: fast at first, slowing as it reaches the top (ease-out), growing as it comes.
            const u = 1 - (1 - t / THROW) ** 2;
            x = start.x + (top.x - start.x) * u;
            y = start.y + (top.y - start.y) * u;
            grow = 1 + (NEAR - 1) * u;
          } else {
            // The drop: picks up speed as it falls into the target (ease-in), shrinking as it goes in.
            const u = ((t - THROW) / (1 - THROW)) ** 2;
            x = top.x + (end.x - top.x) * u;
            y = top.y + (end.y - top.y) * u;
            grow = NEAR - (NEAR - 0.6) * u;
          }
          const size = orb.size * scale * grow;
          out.push({
            offset: t,
            opacity: i === 0 ? 0 : opacity,
            transform: `translate(${x - SIZE / 2}px, ${y - SIZE / 2}px) rotate(${tilt + tumble * t}deg) scale(${size})`,
          });
        }
        return out;
      };
      for (const [k, trail] of TRAIL.entries()) {
        const el = document.createElement('div');
        el.className = color ? `toss-coin toss-${color}` : 'toss-coin';
        document.body.append(el);
        orbs.push(el);
        const flight = el.animate(frames(trail.scale, trail.opacity), {
          duration: FLIGHT_MS,
          delay: orb.delay + trail.delay,
          easing: 'linear',
          fill: 'both',
        });
        all.push(flight);
        // The chest pulses when the first orbs from each symbol land.
        if (j === 0 && k === 0) leads.push(flight);
      }
    }
  }

  Promise.all(leads.map((a) => a.finished)).then(
    () => {
      if (!stopped) onLand();
    },
    () => {},
  );
  Promise.all(all.map((a) => a.finished)).then(
    () => {
      if (!stopped) for (const el of orbs) el.remove();
    },
    () => {},
  );
  return () => {
    stopped = true;
    for (const a of all) a.cancel();
    for (const el of orbs) el.remove();
  };
}
