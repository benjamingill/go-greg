import { betOf, createMachine, type Machine, spin } from './machine';
import type { Rng } from './rng';

export interface SimReport {
  /** Paid spins. */
  spins: number;
  wagered: number;
  /** Return to player for each source, and in total, as fractions of the amount wagered. */
  rtp: { lines: number; scatter: number; bonus: number; jackpot: number; total: number };
  /** One in this many paid spins. */
  every: { bonus: number; freeGames: number; jackpot: number; anyWin: number };
}

/** Plays `spins` paid spins of `credits` at `denom` (and every free spin they award) and adds up the returns. */
export function simulate(spins: number, rng: Rng, denom = 0.01, credits = 100): SimReport {
  let m: Machine = createMachine(1e9, denom, credits);
  const won = { lines: 0, scatter: 0, bonus: 0, jackpot: 0 };
  const hits = { bonus: 0, freeGames: 0, jackpot: 0, anyWin: 0 };
  let paid = 0;
  while (paid < spins || (m.freeGames?.left ?? 0) > 0) {
    const out = spin(m, rng);
    if (!out) break;
    const r = out.result;
    m = out.machine;
    if (r.paid) {
      paid++;
      if (r.total > 0) hits.anyWin++;
    }
    won.lines += r.lineWin;
    won.scatter += r.scatterWin;
    won.bonus += r.bonusWin;
    won.jackpot += r.jackpotWin;
    if (r.bonus) hits.bonus++;
    if (r.pick) hits.jackpot++;
    if (r.reels.freeGames > 0) hits.freeGames++;
  }
  const total = won.lines + won.scatter + won.bonus + won.jackpot;
  const every = (n: number) => (n > 0 ? paid / n : Number.POSITIVE_INFINITY);
  const wagered = paid * betOf(m);
  return {
    spins: paid,
    wagered,
    rtp: {
      lines: won.lines / wagered,
      scatter: won.scatter / wagered,
      bonus: won.bonus / wagered,
      jackpot: won.jackpot / wagered,
      total: total / wagered,
    },
    every: {
      bonus: every(hits.bonus),
      freeGames: every(hits.freeGames),
      jackpot: every(hits.jackpot),
      anyWin: every(hits.anyWin),
    },
  };
}
