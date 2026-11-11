/** Symbols that pay on a payline, best first. */
export const PAYING = ['salad', 'donut', 'steak', 'breadsticks', 'spaghetti', 'A', 'K', 'Q', 'J'] as const;
export type PayingSymbol = (typeof PAYING)[number];

/**
 * Every base-game symbol. `wild` stands in for paying symbols only. `scatter`
 * starts Free Games. `greg` (reel 1 only) and `gem` start the Greg Bonus.
 */
export type Sym = PayingSymbol | 'wild' | 'scatter' | 'greg' | 'gem';

/** Pays for 3, 4 and 5 in a row, as multiples of the line bet (total bet ÷ lines played). */
export const PAYTABLE: Record<PayingSymbol, readonly [number, number, number]> = {
  salad: [7.5, 25, 75],
  donut: [7.5, 25, 75],
  steak: [7.5, 25, 75],
  breadsticks: [7.5, 25, 75],
  spaghetti: [7.5, 25, 75],
  A: [5, 15, 50],
  K: [5, 15, 50],
  Q: [5, 15, 50],
  J: [5, 15, 50],
};

/** What a run of wilds from reel 1 pays for 3, 4 and 5, as multiples of the line bet. */
export const WILD_PAYS: readonly [number, number, number] = [10, 40, 100];

export const isPaying = (s: Sym): s is PayingSymbol => s in PAYTABLE;

/** Each gem colour turns on one Greg Bonus extra. */
export type GemColor = 'green' | 'red' | 'blue';
export const GEM_COLORS: readonly GemColor[] = ['green', 'red', 'blue'];

export interface Extras {
  /** Green: some coins and diamonds carry "+1 Spin". */
  moSpins: boolean;
  /** Red: an 8×5 board (8 tall, 5 wide), and Greg can grow to fill it. Adds bonus prizes inside Greg. */
  goGreg: boolean;
  /** Blue: two coins or two diamonds can land in one square. */
  moSymbols: boolean;
}

export const EXTRA_FOR: Record<GemColor, keyof Extras> = { green: 'moSpins', red: 'goGreg', blue: 'moSymbols' };
