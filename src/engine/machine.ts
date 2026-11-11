import { roundCents } from '..';
import { type BonusRun, playBonus } from './bonus';
import { jackpotTerms } from './jackpots';
import { linesFor } from './paylines';
import { type PickGame, startPick } from './pick';
import type { Rng } from './rng';
import { type ReelResult, spinReels } from './spin';

/**
 * A bet is a denomination (what one credit is worth) times one of that
 * denomination's betCredits amounts.
 */
export const DENOMS = [0.01, 0.02, 0.05, 0.1, 1, 2] as const;
/** The bet buttons, as multiples of the denomination's baseBet. */
export const BET_MULTS = [1, 2, 3, 5, 10] as const;

/**
 * The smallest bet, in credits: 100 at 1¢ and 2¢ (the 1¢ deck reads 100–1000
 * credits), 50 from 5¢ up (every bet seen at 5¢, 10¢ and $1 fits 50–500).
 */
export const baseBet = (denom: number) => (denom < 0.05 ? 100 : 50);

/** The bets on the bet buttons at a denomination, in credits. */
export const betCredits = (denom: number) => BET_MULTS.map((x) => x * baseBet(denom));
export const START_BANKROLL = 1000;

export const betFor = (denom: number, credits: number) => roundCents(denom * credits);

export interface FreeGames {
  left: number;
  played: number;
  /** Won during these Free Games, features included. */
  won: number;
}

export interface Machine {
  bankroll: number;
  /** Dollars per credit. */
  denom: number;
  /** Credits bet per spin. */
  credits: number;
  /** Stays after the last free spin (with `left` 0) so the total can be shown, until the next spin. */
  freeGames: FreeGames | null;
}

/** Everything one spin won, in dollars. Features are settled in full when they trigger. */
export interface SpinResult {
  bet: number;
  /** Credits the spin was played at, for showing prizes in credits. */
  credits: number;
  /** Paid for (not a free spin). */
  paid: boolean;
  /** Lines played. */
  lines: number;
  reels: ReelResult;
  lineWin: number;
  scatterWin: number;
  bonus: BonusRun | null;
  bonusWin: number;
  pick: PickGame | null;
  jackpotWin: number;
  total: number;
}

export const createMachine = (bankroll = START_BANKROLL, denom = 0.01, credits = 100): Machine => ({
  bankroll,
  denom,
  credits,
  freeGames: null,
});

export const betOf = (m: Machine) => betFor(m.denom, m.credits);

export const inFreeGames = (m: Machine) => (m.freeGames?.left ?? 0) > 0;

export const canSpin = (m: Machine) => inFreeGames(m) || m.bankroll >= betOf(m);

// Bets can't change during Free Games: they play at the bet that started them.

export function setCredits(m: Machine, credits: number): Machine {
  if (inFreeGames(m) || !betCredits(m.denom).includes(credits)) return m;
  return { ...m, credits };
}

/** Changes the denomination, staying on the same bet button (×3 stays ×3). */
export function setDenom(m: Machine, denom: number): Machine {
  if (inFreeGames(m)) return m;
  const mult = m.credits / baseBet(m.denom);
  const credits = mult * baseBet(denom);
  return { ...m, denom, credits: betCredits(denom).includes(credits) ? credits : baseBet(denom) };
}

export function spin(m: Machine, rng: Rng): { machine: Machine; result: SpinResult } | null {
  if (!canSpin(m)) return null;
  const free = inFreeGames(m);
  const bet = betOf(m);
  const money = (mult: number) => roundCents(bet * mult);

  const lines = linesFor(m.denom);
  // Jackpots are fixed amounts at the denomination; their odds rise with the bet.
  const jackpots = jackpotTerms(m.denom, m.credits);
  const reels = spinReels(rng, lines, free, jackpots);
  const bonus = reels.bonus ? playBonus(reels.bonus, rng, jackpots) : null;
  const pick = reels.jackpot ? startPick(rng, jackpots) : null;

  const lineWin = money(reels.lineWins.reduce((sum, w) => sum + w.pay, 0));
  const scatterWin = money(reels.scatterPay);
  const bonusWin = bonus ? money(bonus.total) : 0;
  const jackpotWin = pick ? money(jackpots.mult[pick.winner]) : 0;
  const total = roundCents(lineWin + scatterWin + bonusWin + jackpotWin);

  let freeGames: FreeGames | null = free && m.freeGames ? { ...m.freeGames } : null;
  if (freeGames) {
    freeGames.left--;
    freeGames.played++;
    freeGames.won = roundCents(freeGames.won + total);
  }
  if (reels.freeGames > 0) {
    freeGames = freeGames
      ? { ...freeGames, left: freeGames.left + reels.freeGames }
      : { left: reels.freeGames, played: 0, won: 0 };
  }

  return {
    machine: { ...m, bankroll: roundCents(m.bankroll - (free ? 0 : bet) + total), freeGames },
    result: {
      bet,
      credits: m.credits,
      paid: !free,
      lines,
      reels,
      lineWin,
      scatterWin,
      bonus,
      bonusWin,
      pick,
      jackpotWin,
      total,
    },
  };
}
