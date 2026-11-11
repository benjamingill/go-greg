export type Tier = 'mini' | 'minor' | 'maxi' | 'major' | 'grand';
export const TIERS: readonly Tier[] = ['mini', 'minor', 'maxi', 'major', 'grand'];

/**
 * How much each jackpot adds to the return, as if it paid this many bets at the odds in
 * config.ts. What a jackpot really pays is a fixed amount at each denomination
 * (JACKPOT_VALUES), whatever the bet, so its odds are scaled to match: see jackpots.ts.
 */
export const JACKPOT_MULT: Record<Tier, number> = { mini: 10, minor: 25, maxi: 100, major: 500, grand: 2000 };

/** What a gem, coin or diamond pays: cash (a multiple of the bet), a jackpot, or (with Mo' Spins) +1 spin. */
export type Prize = { kind: 'cash'; mult: number } | { kind: 'jackpot'; tier: Tier } | { kind: 'spin' };

/** What a prize pays in cash, as a multiple of the bet (a spin pays none). `mults` is each jackpot's, for the bet. */
export const prizeMult = (p: Prize, mults: Record<Tier, number> = JACKPOT_MULT) =>
  p.kind === 'cash' ? p.mult : p.kind === 'jackpot' ? mults[p.tier] : 0;

export const spinPrize = (): Prize => ({ kind: 'spin' });

export const cash = (mult: number): Prize => ({ kind: 'cash', mult });
export const jackpot = (tier: Tier): Prize => ({ kind: 'jackpot', tier });
