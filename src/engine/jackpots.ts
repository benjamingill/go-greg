/**
 * Jackpots for one bet. Like the machine's, each jackpot pays a fixed amount at each
 * denomination (JACKPOT_VALUES), whatever the bet, and its odds rise in proportion to
 * the amount bet. The odds are scaled so each jackpot adds as much to the return as it
 * would paying JACKPOT_MULT bets at the odds in config.ts: chance × amount stays the same.
 */
import { BOARD_PRIZES, GEM_PRIZES, GEM_PRIZES_NO_GRAND, JACKPOT_VALUES, PICK_WEIGHTS } from './config';
import { JACKPOT_MULT, type Prize, TIERS, type Tier } from './prizes';
import { type Table, table } from './rng';

export interface JackpotTerms {
  /** What each jackpot pays, as a multiple of the bet. */
  mult: Record<Tier, number>;
  /** How many times likelier each jackpot is than at the odds in config.ts. */
  odds: Record<Tier, number>;
  /** Reel gem prizes with the jackpots' weights scaled by `odds` (and the same without the Grand). */
  gems: Table<Prize>;
  gemsNoGrand: Table<Prize>;
  /** Bonus coin and diamond prizes, scaled the same way. */
  board: Table<Prize>;
  /** Which jackpot the pick game is won on, scaled the same way. */
  pick: Table<Tier>;
  /** How many times likelier the pick game is to start than JACKPOT_CHANCE. */
  pickChance: number;
}

const byTier = (f: (t: Tier) => number) => Object.fromEntries(TIERS.map((t) => [t, f(t)])) as Record<Tier, number>;

/**
 * `t` with each jackpot's weight scaled by its `odds`. The other entries make room (or
 * fill in), so the total weight stays the same and each jackpot's chance is exactly its
 * chance in `t` × its odds. A table of only jackpots (the pick game) is just scaled.
 */
function scaled<T>(t: Table<T>, tierOf: (item: T) => Tier | null, odds: Record<Tier, number>): Table<T> {
  let plain = 0;
  let before = 0;
  let after = 0;
  t.items.forEach((item, i) => {
    const w = t.weights[i] as number;
    const tier = tierOf(item);
    if (tier) {
      before += w;
      after += w * odds[tier];
    } else plain += w;
  });
  const rest = plain > 0 ? Math.max(0, (plain + before - after) / plain) : 1;
  return table(
    t.items.map((item, i) => {
      const tier = tierOf(item);
      return [item, (t.weights[i] as number) * (tier ? odds[tier] : rest)] as const;
    }),
  );
}

const prizeTier = (p: Prize) => (p.kind === 'jackpot' ? p.tier : null);

function terms(mult: Record<Tier, number>, odds: Record<Tier, number>): JackpotTerms {
  const pick = scaled(PICK_WEIGHTS, (t) => t, odds);
  return {
    mult,
    odds,
    gems: scaled(GEM_PRIZES, prizeTier, odds),
    gemsNoGrand: scaled(GEM_PRIZES_NO_GRAND, prizeTier, odds),
    board: scaled(BOARD_PRIZES, prizeTier, odds),
    pick,
    pickChance: pick.total / PICK_WEIGHTS.total,
  };
}

/** Each jackpot pays JACKPOT_MULT bets at the odds in config.ts (the default, and for tests). */
export const PLAIN_TERMS: JackpotTerms = terms(
  JACKPOT_MULT,
  byTier(() => 1),
);

/** A jackpot in dollars at a denomination. */
export function jackpotValue(tier: Tier, denom: number): number {
  const values = JACKPOT_VALUES[denom];
  if (!values) throw new RangeError(`No jackpots for denomination ${denom}`);
  return values[tier];
}

const cache = new Map<string, JackpotTerms>();

/** The jackpot terms for a bet of `credits` at `denom`. */
export function jackpotTerms(denom: number, credits: number): JackpotTerms {
  const key = `${denom}|${credits}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const bet = denom * credits;
  const made = terms(
    byTier((t) => jackpotValue(t, denom) / bet),
    byTier((t) => (JACKPOT_MULT[t] * bet) / jackpotValue(t, denom)),
  );
  cache.set(key, made);
  return made;
}
