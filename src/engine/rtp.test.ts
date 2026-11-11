import { expect, it } from 'vitest';
import { seeded } from './rng';
import { simulate } from './simulate';

/**
 * About 93% over 3 million spins (line wins about 31%), with Greg on about 1 spin in 40, 3 in 4
 * Gregs bringing a gem, and the Greg Bonus about 1 in 44. The return is meant to stay between
 * 90% and 95%. One million spins still swing by a point or two (big bonuses and jackpots are
 * rare), so this checks that range.
 * The seed is fixed, so this only fails when the payout numbers change.
 */
it('returns between 90% and 95% of what is bet', () => {
  const r = simulate(1_000_000, seeded(42));
  expect(r.rtp.total).toBeGreaterThan(0.9);
  expect(r.rtp.total).toBeLessThan(0.95);
  expect(r.rtp.lines).toBeGreaterThan(0.29);
  expect(r.rtp.lines).toBeLessThan(0.34);
  expect(r.every.bonus).toBeGreaterThan(40);
  expect(r.every.bonus).toBeLessThan(56);
}, 60_000);
