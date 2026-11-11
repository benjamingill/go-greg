// Tallies observations/prizes.csv into prize frequencies. See observations/README.md.
import { readFileSync } from 'node:fs';

const FILE = new URL('../observations/prizes.csv', import.meta.url);
const TIERS = ['mini', 'minor', 'maxi', 'major', 'grand'];
const MIN_ROWS = 100;

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cell = '';
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === ',' && !quoted) {
        cells.push(cell);
        cell = '';
      } else cell += ch;
    }
    cells.push(cell);
    rows.push(cells.map((c) => c.trim()));
  }
  const [header = [], ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])));
}

/** The prize as a tier name or a multiple of the total bet; undefined when it can't be worked out. */
function prizeOf(row) {
  if (TIERS.includes(row.value.toLowerCase())) return row.value.toLowerCase();
  if (row.mult !== '') return Number(row.mult);
  const value = Number(row.value);
  const denom = Number(row.denom);
  const bet = Number(row.bet_credits);
  if (!Number.isFinite(value) || row.value === '' || !(bet > 0)) return undefined;
  if (row.unit === 'credits') return value / bet;
  if (row.unit === 'dollars' && denom > 0) return value / (denom * bet);
  return undefined;
}

const round = (n) => Math.round(n * 1000) / 1000;

function tally(title, rows) {
  const counts = new Map();
  let skipped = 0;
  for (const row of rows) {
    const p = prizeOf(row);
    if (p === undefined) {
      skipped++;
      continue;
    }
    const key = typeof p === 'number' ? round(p) : p;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  console.log(`\n${title}: ${total} rows${skipped ? ` (${skipped} skipped: bet or unit unknown)` : ''}`);
  if (total === 0) return;
  if (total < MIN_ROWS)
    console.log(`  Only ${total} rows; under ${MIN_ROWS}, so these shares are a rough guide at best.`);
  const order = (k) => (typeof k === 'number' ? k : 1e6 + TIERS.indexOf(k));
  const entries = [...counts.entries()].sort((a, b) => order(a[0]) - order(b[0]));
  for (const [k, n] of entries) {
    const label = typeof k === 'number' ? `${k}x` : k;
    console.log(`  ${label.padEnd(8)} ${String(n).padStart(5)}  ${((100 * n) / total).toFixed(1).padStart(5)}%`);
  }
  console.log('  Weights (per 100):');
  for (const [k, n] of entries) {
    const w = round((100 * n) / total);
    console.log(typeof k === 'number' ? `    [cash(${k}), ${w}],` : `    [jackpot('${k}'), ${w}],`);
  }
}

const rows = parseCsv(readFileSync(FILE, 'utf8'));
const byBet = process.argv.includes('--by-bet');
const groups = [
  ['Reel gems', (r) => r.kind === 'gem'],
  ['Bonus coins and diamonds', (r) => r.kind === 'coin' || r.kind === 'diamond'],
];

const seen = rows.filter((r) => r.kind.startsWith('seen-'));
if (seen.length > 0) {
  const labels = seen.map((r) => (r.mult !== '' ? `${r.mult}x` : r.value));
  console.log(`Values seen but not counted (no sample): ${[...new Set(labels)].join(', ')}`);
}

for (const [title, keep] of groups) {
  const kept = rows.filter(keep);
  tally(title, kept);
  if (byBet) {
    const keys = [...new Set(kept.filter((r) => r.denom && r.bet_credits).map((r) => `${r.denom}|${r.bet_credits}`))];
    for (const key of keys) {
      const [d, b] = key.split('|');
      tally(
        `  ${title} at denom ${d}, bet ${b} credits`,
        kept.filter((r) => r.denom === d && r.bet_credits === b),
      );
    }
  }
}
