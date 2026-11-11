/**
 * The numbers that set how often things happen and how much they pay. They
 * were tuned with `simulate` so the machine returns about 94% of what's bet.
 * Change one and rerun the RTP test (engine/rtp.test.ts) to check the total.
 */
import { cash, JACKPOT_MULT, jackpot, type Prize, type Tier } from './prizes';
import { table } from './rng';
import type { Sym } from './symbols';

type Weights = readonly (readonly [Sym, number])[];

/**
 * Weights are roughly percent of squares. The paying symbols, WILD and gem come
 * from 397 real base-game spins (research/go-ghost): the royals show more than
 * the pictures, and J most of all. The five pictures stand in for the machine's
 * cufflinks, chandelier, mirror, book and mustache man (about 7.9% each).
 */
const PAYING_WEIGHTS: Weights = [
  ['salad', 7.9],
  ['donut', 7.9],
  ['steak', 7.9],
  ['breadsticks', 7.9],
  ['spaghetti', 7.9],
  ['A', 10.9],
  ['K', 10.5],
  ['Q', 10.9],
  ['J', 17.2],
];
const WILD = 4.9;
/** Wilds in Free Games: about 17% of squares on the machine, against 4.9% on paid spins. */
const FREE_WILD = 19.6;
const SCATTER = 2.55;
const GEM = 4.4;
/** Gems on reels 2–5 when Greg is on reel 1, so about 3 in 4 Gregs come with at least one gem. */
const GREG_GEM = 11.8;
const GREG = 0.85;

const reel = (wild: number, gem: number, greg = false) =>
  table<Sym>([
    ...PAYING_WEIGHTS,
    ['wild', wild],
    ['scatter', SCATTER],
    ...(greg ? [['greg', GREG] as const] : []),
    ['gem', gem],
  ]);

/** How likely each symbol is in each square, per reel. Greg is only on reel 1. */
export const REEL_WEIGHTS = [reel(WILD, GEM, true), ...Array.from({ length: 4 }, () => reel(WILD, GEM))];

/**
 * Reels 2–5 when Greg is on reel 1: gems are much more common, so about 3 in 4
 * Gregs come with at least one gem (like the machine's separate reel strips).
 */
export const GREG_REEL_WEIGHTS = reel(WILD, GREG_GEM);

/** Free Games reels: the same, with many more wilds. */
export const FREE_REEL_WEIGHTS = [reel(FREE_WILD, GEM, true), ...Array.from({ length: 4 }, () => reel(FREE_WILD, GEM))];
export const FREE_GREG_REEL_WEIGHTS = reel(FREE_WILD, GREG_GEM);

/** Chance the Greg Bonus starts anyway when gems land without Greg. */
export const RANDOM_BONUS_CHANCE = 0.005;
/** Chance each wild on the screen starts the jackpot pick game. */
export const JACKPOT_CHANCE = 0.0025;

export const FREE_GAMES = 6;
/** Chance each FREE GAMES symbol starts Free Games on its own when fewer than 3 land (a guess; the machine's isn't known). */
export const LONE_FREE_GAMES_CHANCE = 0.002;
/** Instant prize for 3, 4 and 5 scatters. */
export const SCATTER_PAYS = [2, 10, 50] as const;

/** Mini and Minor gems per 100 gems, as seen on the machine. */
const MINI_GEMS = 2.703;
const MINOR_GEMS = 2.703;
/**
 * Maxi, Major and Grand are too rare to measure (the few seen came from big bets,
 * where the machine raises progressive odds). Each is as rare as it is big, so it
 * adds the same to a gem's average value as the average of Mini and Minor.
 */
const TIER_VALUE = (MINI_GEMS * JACKPOT_MULT.mini + MINOR_GEMS * JACKPOT_MULT.minor) / 2;
const tierGems = (tier: Tier) => TIER_VALUE / JACKPOT_MULT[tier];

/**
 * Cash, Mini and Minor are from 259 reel gems seen on the machine (`npm run tally`,
 * observations/prizes.csv). None showed more than 10×.
 */
const GEM_PRIZE_WEIGHTS: readonly (readonly [Prize, number])[] = [
  [cash(0.5), 19.305],
  [cash(1), 23.938],
  [cash(1.5), 7.722],
  [cash(2), 8.88],
  [cash(2.5), 3.861],
  [cash(3), 3.475],
  [cash(4), 3.475],
  [cash(5), 18.919],
  [cash(6), 1.544],
  [cash(10), 2.317],
  [jackpot('mini'), MINI_GEMS],
  [jackpot('minor'), MINOR_GEMS],
  [jackpot('maxi'), tierGems('maxi')],
  [jackpot('major'), tierGems('major')],
  [jackpot('grand'), tierGems('grand')],
];

/** What a gem on the base reels shows. */
export const GEM_PRIZES = table<Prize>(GEM_PRIZE_WEIGHTS);
/** The same without the Grand: at most one Grand shows on the gems in a spin. */
export const GEM_PRIZES_NO_GRAND = table<Prize>(
  GEM_PRIZE_WEIGHTS.filter(([p]) => !(p.kind === 'jackpot' && p.tier === 'grand')),
);

/** What coins and diamonds show in the Greg Bonus. Only Mini and Minor jackpots land here. */
export const BOARD_PRIZES = table<Prize>([
  [cash(0.5), 42.106],
  [cash(1), 28.709],
  [cash(2), 12.44],
  [cash(2.5), 5],
  [cash(3), 5.404],
  [cash(5), 3.152],
  [cash(10), 1.801],
  [cash(20), 0.72],
  [cash(50), 0.225],
  [cash(100), 0.072],
  [jackpot('mini'), 0.7],
  [jackpot('minor'), 0.2],
]);

export const BONUS_START_SPINS = 5;
/** Chance per square per spin that a coin lands. */
export const COIN_CHANCE = 0.0242;
/** Chance per square per spin that a diamond lands (until Greg fills the board). */
export const DIAMOND_CHANCE = 0.0242;
/** Mo' Symbols: squares picked before each spin where a coin or diamond lands doubled, on the 5-tall and 8-tall boards. */
export const DOUBLE_SPOTS = { short: 5, tall: 8 } as const;
/** Mo' Spins: chance a coin or diamond's prize is "+1 Spin" (instead of cash or a jackpot). */
export const SPIN_PRIZE_CHANCE = 0.12;
/** Go Greg: chance per spin of a bonus prize on something Greg collects. */
export const BOOST_CHANCE = 0.17;
/** Go Greg: once a spin has a bonus prize, the chance each other thing Greg collects gets one too (a guess). */
export const BOOST_MORE_CHANCE = 0.25;
/** Mo' Spins and Go Greg together: chance a bonus prize is spins instead of cash (a guess). */
export const BOOST_SPIN_CHANCE = 0.25;
export const BOOST_SPINS = table<number>([
  [1, 70],
  [2, 30],
]);
export const BOOST_PRIZES = table<number>([
  [1, 30],
  [2, 25],
  [3, 18],
  [5, 14],
  [10, 8],
  [20, 4],
  [50, 1],
]);

/**
 * What each jackpot pays, in dollars, at each denomination, whatever the bet (like the
 * machine's plaques). Read off real cabinets with 100-credit bets: 1¢ (Mini $15), 5¢ and
 * 10¢ (Mini $75 and $150, on one shared Grand), and $1 (Mini $1,000). Minor is always 2×
 * Mini. Grand, Major and Maxi are progressives on the machine; here they stay at the
 * amounts seen, shared by 1¢–2¢, 5¢–10¢ and $1–$2. The 2¢ and $2 rows are guesses.
 */
export const JACKPOT_VALUES: Record<number, Record<Tier, number>> = {
  0.01: { mini: 15, minor: 30, maxi: 885, major: 2700, grand: 9350 },
  0.02: { mini: 30, minor: 60, maxi: 539.38, major: 1533.63, grand: 8063.4 },
  0.05: { mini: 75, minor: 150, maxi: 2957, major: 10038, grand: 41049 },
  0.1: { mini: 150, minor: 300, maxi: 2957, major: 10038, grand: 41049 },
  1: { mini: 1000, minor: 2000, maxi: 5242, major: 15189, grand: 80802 },
  2: { mini: 2000, minor: 4000, maxi: 5242, major: 15189, grand: 80802 },
};

/** Jackpot pick game: how likely each jackpot is to be the one that's matched. */
export const PICK_WEIGHTS = table([
  ['mini', 60],
  ['minor', 28],
  ['maxi', 9],
  ['major', 2.5],
  ['grand', 0.5],
] as const);
