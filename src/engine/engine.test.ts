import { describe, expect, it } from 'vitest';
import { cellSpins, growthSteps, playBonus } from './bonus';
import { JACKPOT_VALUES } from './config';
import { jackpotTerms, jackpotValue } from './jackpots';
import { betCredits, createMachine, DENOMS, setCredits, setDenom, spin } from './machine';
import { emptyPicks, PICK_COINS, pickCoin, pickDone, startPick } from './pick';
import { cash, JACKPOT_MULT, jackpot, TIERS } from './prizes';
import { seeded } from './rng';
import {
  type BonusTrigger,
  type Cell,
  drawGrid,
  evaluate,
  type Gem,
  type Grid,
  lineWins,
  type PlacedGem,
} from './spin';
import type { Sym } from './symbols';

/** Never passes a random-chance check. */
const never = () => 0.999;

/** Builds a grid from three rows of five symbols, top row first. */
const grid = (...rows: Sym[][]): Grid =>
  Array.from({ length: 5 }, (_, reel) => rows.map((r): Cell => ({ sym: r[reel] as Sym })));

const filler: Sym[] = ['J', 'Q', 'K', 'A', 'spaghetti'];

describe('line wins', () => {
  it('pays matching symbols left to right', () => {
    const wins = lineWins(grid(filler, ['salad', 'salad', 'salad', 'salad', 'salad'], filler), 25);
    expect(wins).toContainEqual({ line: 0, sym: 'salad', count: 5, pay: 3 });
  });

  it('lets wilds stand in, including on reel 1', () => {
    const wins = lineWins(grid(filler, ['steak', 'wild', 'steak', 'wild', 'J'], filler), 25);
    expect(wins).toContainEqual({ line: 0, sym: 'steak', count: 4, pay: 1 });
    const leading = lineWins(grid(filler, ['wild', 'K', 'K', 'J', 'J'], filler), 25);
    expect(leading).toContainEqual({ line: 0, sym: 'K', count: 3, pay: 0.2 });
  });

  it('plays only the first lines, paying in line bets', () => {
    // Salad on every square: all 25 lines win on 25 lines, only lines 1–5 on 5.
    const salad: Sym[] = ['salad', 'salad', 'salad', 'salad', 'salad'];
    expect(lineWins(grid(salad, salad, salad), 25)).toHaveLength(25);
    const five = lineWins(grid(salad, salad, salad), 5);
    expect(five.map((w) => w.line)).toEqual([0, 1, 2, 3, 4]);
    // 5 salads = 75 line bets: 3× the bet on 25 lines, 15× on 5.
    expect(five[0]?.pay).toBe(15);
  });

  it('pays runs of wilds from reel 1 as WILD when that beats the other reading', () => {
    const wild: Sym[] = ['wild', 'wild', 'wild', 'wild', 'wild'];
    expect(lineWins(grid(filler, wild, filler), 25).find((w) => w.line === 0)).toEqual({
      line: 0,
      sym: 'wild',
      count: 5,
      pay: 4,
    });
    // WILD, WILD, WILD, K: four Ks (15 line bets) beat three wilds (10).
    const k = lineWins(grid(filler, ['wild', 'wild', 'wild', 'K', 'J'], filler), 25).find((w) => w.line === 0);
    expect(k).toMatchObject({ sym: 'K', count: 4 });
    // Three wilds then a scatter: three wilds (10) beat three of anything else (7.5 at most).
    const w3 = lineWins(grid(filler, ['wild', 'wild', 'wild', 'scatter', 'Q'], filler), 25).find((w) => w.line === 0);
    expect(w3).toMatchObject({ sym: 'wild', count: 3, pay: 0.4 });
  });

  it('needs 3 in a row from reel 1', () => {
    expect(lineWins(grid(filler, ['K', 'K', 'Q', 'K', 'K'], filler)).find((w) => w.line === 0)).toBeUndefined();
    expect(lineWins(grid(filler, ['greg', 'K', 'K', 'K', 'K'], filler)).find((w) => w.line === 0)).toBeUndefined();
  });
});

describe('features', () => {
  it('awards Free Games and an instant prize for scatters', () => {
    const three = evaluate(grid(['scatter', 'J', 'scatter', 'Q', 'scatter'], filler, filler), never);
    expect(three).toMatchObject({ scatters: 3, freeGames: 6, scatterPay: 2 });
    const five = evaluate(grid(['scatter', 'scatter', 'scatter', 'scatter', 'scatter'], filler, filler), never);
    expect(five).toMatchObject({ freeGames: 6, scatterPay: 50 });
    expect(evaluate(grid(['scatter', 'J', 'scatter', 'Q', 'K'], filler, filler), never).freeGames).toBe(0);
  });

  it('gives every wild its own chance at the jackpot game', () => {
    const rolls =
      (...r: number[]) =>
      () =>
        r.shift() ?? 1;
    const wilds = grid(['wild', 'J', 'wild', 'Q', 'wild'], filler, filler);
    // The first two wilds miss; the third hits.
    expect(evaluate(wilds, rolls(0.5, 0.5, 0)).jackpot).toBe(true);
    expect(evaluate(wilds, rolls(0.5, 0.5, 0.5)).jackpot).toBe(false);
  });

  it('retriggers Free Games and starts the Greg Bonus and the jackpot game during Free Games', () => {
    const g = grid(['greg', 'wild', 'scatter', 'scatter', 'scatter'], filler, filler);
    const withGem = g.map((reel, i) =>
      i === 1
        ? [...reel.slice(0, 1), { sym: 'gem', gem: { color: 'red', prize: cash(1) } } as Cell, ...reel.slice(2)]
        : reel,
    );
    const r = evaluate(withGem, () => 0, 25);
    expect(r).toMatchObject({ freeGames: 6, scatterPay: 2, jackpot: true });
    expect(r.bonus).toEqual({
      gems: [{ color: 'red', prize: cash(1), reel: 1, row: 1 }],
      colors: ['red'],
      random: false,
    });
  });

  it('lets a lone FREE GAMES symbol start Free Games by chance, for the smallest prize', () => {
    const one = grid(['scatter', 'J', 'Q', 'K', 'A'], filler, filler);
    expect(evaluate(one, () => 0).freeGames).toBe(6);
    expect(evaluate(one, () => 0).scatterPay).toBe(2);
    expect(evaluate(one, never)).toMatchObject({ freeGames: 0, scatterPay: 0 });
    // Two lone symbols each roll: the first misses, the second hits.
    const two = grid(['scatter', 'J', 'scatter', 'K', 'A'], filler, filler);
    const rolls = [0.5, 0];
    expect(evaluate(two, () => rolls.shift() ?? 0.5).freeGames).toBe(6);
  });

  it('lands FREE GAMES symbols and Greg during Free Games', () => {
    const rng = seeded(7);
    let scatters = 0;
    let gregs = 0;
    for (let i = 0; i < 2000; i++) {
      const cells = drawGrid(rng).flat();
      if (cells.some((c) => c.sym === 'scatter')) scatters++;
      if (cells.some((c) => c.sym === 'greg')) gregs++;
    }
    expect(scatters).toBeGreaterThan(0);
    expect(gregs).toBeGreaterThan(0);
  });

  it('gives each gem colour its own chance to start its extra when there is no Greg', () => {
    const g = grid(['J', 'gem', 'gem', 'gem', 'K'], filler, filler) as Cell[][];
    (g[1] as Cell[])[0] = { sym: 'gem', gem: { color: 'green', prize: cash(1) } };
    (g[2] as Cell[])[0] = { sym: 'gem', gem: { color: 'red', prize: cash(2) } };
    (g[3] as Cell[])[0] = { sym: 'gem', gem: { color: 'blue', prize: cash(3) } };
    // Green, red, blue roll in that order: green and blue hit, red misses.
    const rolls = [0, 0.5, 0];
    const bonus = evaluate(g, () => rolls.shift() ?? 0.5).bonus;
    expect(bonus).toMatchObject({ colors: ['green', 'blue'], random: true });
    // Every gem on the screen still turns into a diamond.
    expect(bonus?.gems).toHaveLength(3);
    // No hits, no bonus.
    expect(evaluate(g, never).bonus).toBeNull();
  });

  it('starts the Greg Bonus when Greg lands with a gem', () => {
    const g = grid(['greg', 'gem', 'J', 'Q', 'K'], filler, filler) as Cell[][];
    (g[1] as Cell[])[0] = { sym: 'gem', gem: { color: 'red', prize: cash(5) } };
    expect(evaluate(g, never).bonus).toEqual({
      gems: [{ color: 'red', prize: cash(5), reel: 1, row: 0 }],
      colors: ['red'],
      random: false,
    });

    (g[0] as Cell[])[0] = { sym: 'J' };
    expect(evaluate(g, never).bonus).toBeNull();
  });
});

describe('Greg Bonus', () => {
  /** A bonus started by Greg: every gem colour present switches on. */
  const withGreg = (placed: PlacedGem[]): BonusTrigger => ({
    gems: placed,
    colors: [...new Set(placed.map((g) => g.color))],
    random: false,
  });
  const gems = (n: number, color: Gem['color'] = 'green'): PlacedGem[] =>
    Array.from({ length: n }, (_, i) => ({ color, prize: cash(1), reel: i % 5, row: Math.floor(i / 5) % 3 }));

  it('plays until the spins run out and adds up every spin', () => {
    const run = playBonus(withGreg(gems(1)), seeded(1));
    const last = run.frames[run.frames.length - 1];
    expect(last?.spinsLeft).toBe(0);
    expect(run.total).toBeCloseTo(run.frames.reduce((s, f) => s + f.win, 0));
    expect(run.frames[0]?.size).toEqual({ w: 2, h: 2 });
  });

  it('turns on the extras for each gem colour', () => {
    const run = playBonus(withGreg([...gems(1, 'red'), ...gems(1, 'blue')]), seeded(2));
    expect(run.extras).toEqual({ moSpins: false, goGreg: true, moSymbols: true });
    expect(run).toMatchObject({ cols: 5, rows: 8 });
    expect(playBonus(withGreg(gems(1)), seeded(2))).toMatchObject({ cols: 5, rows: 5 });
  });

  it('only switches on the extras of the colours that triggered, though every gem becomes a diamond', () => {
    const placed: PlacedGem[] = [
      { color: 'green', prize: cash(1), reel: 0, row: 0 },
      { color: 'red', prize: cash(1), reel: 1, row: 0 },
    ];
    const run = playBonus({ gems: placed, colors: ['green'], random: true }, seeded(8));
    expect(run.extras).toEqual({ moSpins: true, goGreg: false, moSymbols: false });
    expect(run.rows).toBe(5);
    expect(run.frames[0]?.board.filter((c) => c?.kind === 'diamond')).toHaveLength(2);
  });

  it('grows Greg as diamonds are collected', () => {
    const run = playBonus(withGreg(gems(5)), seeded(3));
    // Greg starts 2×2 and claims the 5 starting diamonds, which grows him to 3×3.
    expect(run.frames[0]?.moves).toHaveLength(5);
    expect(run.frames[0]).toMatchObject({ size: { w: 3, h: 3 }, spinsLeft: 8, grew: true, diamonds: 5, total: 5 });
    for (const f of run.frames) {
      const reached = growthSteps(run.rows).filter((g) => f.diamonds >= g.at);
      expect(f.size).toEqual(reached[reached.length - 1]?.size ?? { w: 2, h: 2 });
    }
  });

  it("counts a Mo' Symbols double diamond as two towards growth", () => {
    let doubles = 0;
    for (let seed = 0; seed < 50; seed++) {
      const run = playBonus(withGreg(gems(1, 'blue')), seeded(seed));
      run.frames.slice(1).forEach((f, n) => {
        const before = run.frames[n] ?? f;
        const counted = f.moves.reduce((sum, m) => sum + (f.board[m.cell]?.prizes.length ?? 0), 0);
        doubles += f.moves.filter((m) => (f.board[m.cell]?.prizes.length ?? 0) > 1).length;
        expect(f.diamonds - before.diamonds).toBe(counted);
      });
    }
    expect(doubles).toBeGreaterThan(0);
  });

  it('collects coins only inside Greg, and diamonds anywhere', () => {
    const run = playBonus(withGreg(gems(1)), seeded(4));
    run.frames.slice(1).forEach((f, n) => {
      // Greg collects with the box he had going into the spin (he may grow after it).
      const g = run.frames[n] ?? f;
      f.board.forEach((c, i) => {
        if (!c) return;
        const x = i % run.cols;
        const y = Math.floor(i / run.cols);
        const inside = x >= g.greg.x && x < g.greg.x + g.size.w && y >= g.greg.y && y < g.greg.y + g.size.h;
        expect(c.collected).toBe(c.kind === 'diamond' || inside);
      });
    });
  });

  it('moves Greg to cover each diamond that lands, and nowhere else', () => {
    const run = playBonus(withGreg(gems(2, 'red')), seeded(6));
    run.frames.slice(1).forEach((f, n) => {
      const before = run.frames[n] ?? f;
      const landed = f.board.flatMap((c, i) => (c?.kind === 'diamond' ? [i] : []));
      expect(f.moves.map((m) => m.cell).sort()).toEqual(landed.sort());
      for (const m of f.moves) {
        const x = m.cell % run.cols;
        const y = Math.floor(m.cell / run.cols);
        // Inside him after the move (he may have grown on it).
        expect(x >= m.at.x && x < m.at.x + m.size.w && y >= m.at.y && y < m.at.y + m.size.h).toBe(true);
      }
      if (f.moves.length === 0) expect(f.greg).toEqual(before.greg);
      // No diamond lands on a square Greg was covering.
      for (const m of f.moves) {
        const x = m.cell % run.cols;
        const y = Math.floor(m.cell / run.cols);
        const g = before.greg;
        expect(x >= g.x && x < g.x + before.size.w && y >= g.y && y < g.y + before.size.h).toBe(false);
      }
    });
  });

  it('keeps the triggering gems where they landed and starts Greg clear of them', () => {
    const placed: PlacedGem[] = [
      { color: 'red', prize: cash(2), reel: 3, row: 1 },
      { color: 'green', prize: cash(1), reel: 0, row: 2 },
    ];
    for (let seed = 0; seed < 30; seed++) {
      const run = playBonus(withGreg(placed), seeded(seed));
      expect(run.frames[0]?.board[1 * 5 + 3]?.kind).toBe('diamond');
      expect(run.frames[0]?.board[2 * 5 + 0]?.kind).toBe('diamond');
      for (const i of [1 * 5 + 3, 2 * 5 + 0]) {
        const x = i % 5;
        const y = Math.floor(i / 5);
        const { x: gx, y: gy } = run.startAt;
        expect(x >= gx && x < gx + 2 && y >= gy && y < gy + 2).toBe(false);
      }
    }
  });

  it("picks 5 squares (8 with Go Greg) before each spin for Mo' Symbols doubles", () => {
    let doubles = 0;
    for (let seed = 0; seed < 60; seed++) {
      for (const [colors, most] of [
        [['blue'], 5],
        [['blue', 'red'], 8],
        [['green'], 0],
      ] as const) {
        const trigger = withGreg(colors.map((c, i) => ({ ...gems(1, c)[0], reel: i, row: 0 }) as PlacedGem));
        for (const f of playBonus(trigger, seeded(seed)).frames.slice(1)) {
          const n = f.board.filter((c) => c && c.prizes.length > 1).length;
          expect(n).toBeLessThanOrEqual(most);
          doubles += n;
        }
      }
    }
    expect(doubles).toBeGreaterThan(0);
  });

  it("adds +2 and +3 spins to a coin or diamond only with Mo' Spins and Go Greg together", () => {
    const tags = (colors: Gem['color'][]) => {
      let most = 0;
      for (let seed = 0; seed < 300; seed++) {
        const trigger = withGreg(colors.map((c, i) => ({ ...gems(1, c)[0], reel: i, row: 0 }) as PlacedGem));
        for (const f of playBonus(trigger, seeded(seed)).frames) {
          for (const c of f.board) most = Math.max(most, c ? cellSpins(c) : 0);
        }
      }
      return most;
    };
    expect(tags(['green'])).toBe(1);
    expect(tags(['red'])).toBe(0);
    expect(tags(['green', 'red'])).toBeGreaterThanOrEqual(2);
    expect(tags(['green', 'red'])).toBeLessThanOrEqual(3);
  });

  it("makes +1 Spin a prize in place of cash with Mo' Spins", () => {
    let spinPrizes = 0;
    for (let seed = 0; seed < 60; seed++) {
      const run = playBonus(withGreg(gems(1, 'green')), seeded(seed));
      for (const f of run.frames) {
        for (const c of f.board) spinPrizes += c?.prizes.filter((p) => p.kind === 'spin').length ?? 0;
      }
    }
    expect(spinPrizes).toBeGreaterThan(0);
    // Without Mo' Spins there are none.
    for (let seed = 0; seed < 30; seed++) {
      const run = playBonus(withGreg(gems(1, 'red')), seeded(seed));
      for (const f of run.frames) for (const c of f.board) expect(c?.prizes.some((p) => p.kind === 'spin')).toBeFalsy();
    }
  });

  it('adds a spin for each +1 Spin prize collected, on top of growth', () => {
    for (const seed of [11, 12, 13, 14]) {
      const run = playBonus(withGreg(gems(1, 'green')), seeded(seed));
      run.frames.slice(1).forEach((f, n) => {
        const prev = run.frames[n];
        const collected = f.board.reduce((sum, c) => (c?.collected ? sum + cellSpins(c) : sum), 0);
        const grown = growthSteps(run.rows)
          .filter((g) => g.at > (prev?.diamonds ?? 0) && g.at <= f.diamonds)
          .reduce((sum, g) => sum + (run.rows > 5 ? (g.spinsGoGreg ?? g.spins) : g.spins), 0);
        expect(f.spinsLeft).toBe((prev?.spinsLeft ?? 0) - 1 + collected + grown);
      });
    }
  });

  it('boosts 1 or more things Greg collects with Go Greg, diamonds included', () => {
    let several = 0;
    let onDiamond = 0;
    for (let seed = 0; seed < 300; seed++) {
      for (const f of playBonus(withGreg(gems(1, 'red')), seeded(seed)).frames.slice(1)) {
        const boosted = f.board.filter((c) => c && c.boost > 0);
        for (const c of boosted) expect(c?.collected).toBe(true);
        if (boosted.length >= 2) several++;
        if (boosted.some((c) => c?.kind === 'diamond')) onDiamond++;
      }
    }
    expect(several).toBeGreaterThan(0);
    expect(onDiamond).toBeGreaterThan(0);
  });

  it('records jackpots won', () => {
    const run = playBonus(withGreg([{ color: 'green', prize: jackpot('grand'), reel: 0, row: 0 }]), seeded(5));
    expect(run.jackpots).toContain('grand');
    expect(run.total).toBeGreaterThanOrEqual(2000);
  });
});

describe('gem prizes', () => {
  it('shows at most one Grand across the gems in a spin', () => {
    // A source that always picks the last choice: every square is a gem, and the first one's prize is the Grand.
    const cells = drawGrid(() => 0.999999).flat();
    expect(cells.filter((c) => c.gem).length).toBeGreaterThan(1);
    expect(cells.filter((c) => c.gem?.prize.kind === 'jackpot' && c.gem.prize.tier === 'grand')).toHaveLength(1);
  });
});

describe('jackpot pick game', () => {
  it('ends on the third match of the winner, with no other jackpot shown 3 times', () => {
    for (let seed = 0; seed < 200; seed++) {
      const game = startPick(seeded(seed));
      expect(game.sequence.length).toBeLessThanOrEqual(PICK_COINS);
      expect(game.sequence[game.sequence.length - 1]).toBe(game.winner);
      for (const t of TIERS) {
        const n = game.sequence.filter((s) => s === t).length;
        expect(n).toBe(t === game.winner ? 3 : Math.min(n, 2));
      }
    }
  });

  it('reveals coins in order until the winner matches 3 times', () => {
    const game = startPick(seeded(7));
    let revealed = emptyPicks();
    for (let i = 0; i < PICK_COINS && !pickDone(game, revealed); i++) revealed = pickCoin(game, revealed, i);
    expect(pickDone(game, revealed)).toBe(true);
    expect(revealed.filter((t) => t !== null)).toEqual(game.sequence);
    expect(pickCoin(game, revealed, PICK_COINS - 1)).toBe(revealed);
  });
});

describe('machine', () => {
  it('charges the bet and pays wins', () => {
    const out = spin(createMachine(100, 0.02, 100), seeded(8));
    expect(out?.machine.bankroll).toBeCloseTo(100 - 2 + (out?.result.total ?? 0));
  });

  it("won't spin without enough money", () => {
    expect(spin(createMachine(1, 0.02, 100), seeded(9))).toBeNull();
  });

  it('plays Free Games without charging, at the bet that started them', () => {
    const m = { ...createMachine(100, 0.02, 100), freeGames: { left: 2, played: 4, won: 10 } };
    expect(setCredits(m, 200)).toBe(m);
    expect(setDenom(m, 1)).toBe(m);
    const out = spin(m, seeded(10));
    expect(out?.result.paid).toBe(false);
    expect(out?.machine.bankroll).toBeCloseTo(100 + (out?.result.total ?? 0));
    expect(out?.machine.freeGames?.played).toBe(5);
  });

  it('has bet buttons on a 100-credit base at 1¢ and 2¢, and 50 from 5¢ up', () => {
    expect(betCredits(0.01)).toEqual([100, 200, 300, 500, 1000]);
    expect(betCredits(0.02)).toEqual([100, 200, 300, 500, 1000]);
    for (const d of [0.05, 0.1, 1, 2]) expect(betCredits(d)).toEqual([50, 100, 150, 250, 500]);
  });

  it("only takes the denomination's bet buttons", () => {
    const m = createMachine(100, 0.01, 100);
    expect(setCredits(m, 150)).toBe(m);
    expect(setCredits(m, 1000).credits).toBe(1000);
    expect(setCredits(setDenom(m, 1), 150).credits).toBe(150);
  });

  it('stays on the same bet button when the denomination changes', () => {
    const m = createMachine(100, 0.01, 300);
    expect(setDenom(m, 0.05).credits).toBe(150);
    expect(setDenom(setDenom(m, 0.05), 0.02).credits).toBe(300);
    expect(setDenom(createMachine(100, 1, 500), 0.01).credits).toBe(1000);
  });
});

describe('jackpots', () => {
  it('pays a fixed amount at each denomination, whatever the bet', () => {
    for (const denom of DENOMS) {
      expect(JACKPOT_VALUES[denom]).toBeDefined();
      for (const credits of betCredits(denom)) {
        const bet = denom * credits;
        for (const t of TIERS) expect(jackpotTerms(denom, credits).mult[t] * bet).toBeCloseTo(jackpotValue(t, denom));
      }
    }
  });

  it('has odds in proportion to the bet, so each jackpot adds the same share of the return', () => {
    for (const denom of DENOMS) {
      for (const credits of betCredits(denom)) {
        const j = jackpotTerms(denom, credits);
        // Chance × amount (as a multiple of the bet) is the same at every bet: JACKPOT_MULT.
        for (const t of TIERS) expect(j.odds[t] * j.mult[t]).toBeCloseTo(JACKPOT_MULT[t]);
        // Twice the bet, twice the chance.
        const most = Math.max(...betCredits(denom));
        const top = jackpotTerms(denom, most);
        for (const t of TIERS) expect(top.odds[t] / j.odds[t]).toBeCloseTo(most / credits);
      }
    }
  });

  it('pays the jackpot game at its fixed amount', () => {
    const m = createMachine(1e6, 1, 100);
    for (let seed = 0; seed < 20000; seed++) {
      const out = spin(m, seeded(seed));
      if (out?.result.pick) {
        expect(out.result.jackpotWin).toBe(jackpotValue(out.result.pick.winner, 1));
        return;
      }
    }
    throw new Error('no jackpot game in 20,000 spins');
  });
});
