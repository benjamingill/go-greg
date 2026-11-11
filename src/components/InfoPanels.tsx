import { type ReactNode, useState } from 'react';
import ben from '../assets/faces/ben.png';
import greg from '../assets/faces/greg.png';
import mike from '../assets/faces/mike.png';
import scott from '../assets/faces/scott.png';
import { growthSteps } from '../engine/bonus';
import { BONUS_START_SPINS, FREE_GAMES, SCATTER_PAYS } from '../engine/config';
import { jackpotValue } from '../engine/jackpots';
import { linesFor, PAYLINES, REELS, ROWS } from '../engine/paylines';
import { TIERS } from '../engine/prizes';
import { type GemColor, PAYING, PAYTABLE, WILD_PAYS } from '../engine/symbols';
import { GemPicture, SYMBOL_ART, SYMBOL_NAMES, SymbolIcon, TIER_NAMES } from './art';
import { Greg } from './Greg';

/** "25×", "0.5×", "2,000×". */
const times = (mult: number) => `${mult.toLocaleString('en-US')}×`;

function PaytablePage() {
  return (
    <>
      <table className="pay-table">
        <thead>
          <tr>
            <th aria-label="Symbol" />
            <th>5</th>
            <th>4</th>
            <th>3</th>
          </tr>
        </thead>
        <tbody>
          {PAYING.map((s) => (
            <tr key={s}>
              <th scope="row">
                <span className="pay-sym">
                  {s.length === 1 ? <span className={`letter letter-${s}`}>{s}</span> : SYMBOL_ART[s]}
                </span>
                {s.length > 1 && <span className="pay-name">{SYMBOL_NAMES[s]}</span>}
              </th>
              {[...PAYTABLE[s]].reverse().map((p, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: columns are 5, 4 and 3 of a kind.
                <td key={i}>{times(p)}</td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row">
              <span className="pay-sym">
                <SymbolIcon sym="wild" />
              </span>
            </th>
            {[...WILD_PAYS].reverse().map((p, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: columns are 5, 4 and 3 of a kind.
              <td key={i}>{times(p)}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <ul className="help-rules">
        <li>
          Wild substitutes for all symbols except{' '}
          <span className="inline-greg">
            <Greg size="1.2em" />
          </span>
          , <Gems colors={['green', 'red', 'blue']} /> and <SymbolIcon sym="scatter" />.
        </li>
        <li>
          All wins begin with the leftmost reel and pay left to right on adjacent reels, except Free Games and gem
          prizes. All symbols pay as per the paytable regardless of the background.
        </li>
        <li>Greg may appear on reel 1 only.</li>
      </ul>
      <p className="help-note">Line pays are multiples of the line bet (the bet ÷ lines played).</p>
    </>
  );
}

const EXTRA_NAMES = { green: "Mo' Spins", red: 'Go Greg', blue: "Mo' Symbols" } as const;

const COMBOS: readonly (readonly GemColor[])[] = [
  ['green'],
  ['red'],
  ['blue'],
  ['green', 'red'],
  ['red', 'blue'],
  ['green', 'blue'],
  ['green', 'red', 'blue'],
];

function Gems({ colors }: { colors: readonly GemColor[] }) {
  return (
    <>
      {colors.map((c) => (
        <GemPicture key={c} color={c} className="mini-gem" />
      ))}
    </>
  );
}

function BonusPage() {
  return (
    <>
      <p className="help-row">
        <span className="inline-greg">
          <Greg size="1.6em" />
        </span>
        Greg with one or more gems awards the extras for the colours of those gems:
      </p>
      <ul className="help-gems">
        {COMBOS.map((colors) => (
          <li key={colors.join()}>
            <Gems colors={colors} /> <strong>{colors.map((c) => EXTRA_NAMES[c]).join(' + ')}</strong>
          </li>
        ))}
      </ul>
      <ul className="help-rules">
        <li>
          One or more gems of a colour in a spin without Greg may randomly start that colour's extra. Extras that start
          together combine in the same way.
        </li>
        <li>
          Every gem has a prize shown on it: (0.5–100) × the total bet, or a jackpot. At most one Grand may appear on
          the gems in a spin.
        </li>
        <li>
          At the start of the bonus, every gem on the screen turns into a diamond with the same prize, in the same
          position.
        </li>
        <li>A 2×2 Greg appears and moves to all positions containing a diamond.</li>
        <li>
          During the bonus all positions spin individually. {BONUS_START_SPINS} spins are awarded initially. Bonus reels
          are in play.
        </li>
        <li>The bet is the same as the game that started the bonus.</li>
      </ul>
    </>
  );
}

function GrowthTable({ rows }: { rows: number }) {
  const steps = growthSteps(rows);
  return (
    <table className="pay-table grow-table">
      <thead>
        <tr>
          <th>💎 collected</th>
          <th>Greg</th>
          <th>Spins</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((g, i) => (
          <tr key={g.at}>
            <td>{i === 0 ? g.at : `${g.at - (steps[i - 1]?.at ?? 0)} more`}</td>
            <td>
              {g.size.h}×{g.size.w}
            </td>
            <td>+{rows > 5 ? (g.spinsGoGreg ?? g.spins) : g.spins}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BonusPlayPage() {
  return (
    <>
      <ul className="help-rules">
        <li>
          After each bonus spin, the prizes on coins that land behind Greg are collected before Greg moves to the
          diamonds.
        </li>
        <li>Prizes on each diamond are also collected when Greg moves to it.</li>
        <li>Diamonds never land behind Greg, of any size.</li>
        <li>The bonus ends when all spins are completed. All collected coin and diamond prizes are awarded.</li>
        <li>Possible coin and diamond prizes: (0.5–100) × the total bet, Minor or Mini.</li>
        <li>The odds of credit prizes in the bonus differ from those on the reels.</li>
        <li>
          Greg starts at 2×2. As diamonds are collected he grows, and more spins are awarded. Once he fills the board,
          no more diamonds can appear.
        </li>
      </ul>
      <h3 className="help-subhead">5×5 board</h3>
      <GrowthTable rows={5} />
      <h3 className="help-subhead">8×5 board (Go Greg)</h3>
      <GrowthTable rows={8} />
    </>
  );
}

function ExtrasPage() {
  return (
    <ul className="help-gems">
      <li>
        <GemPicture color="green" className="mini-gem" /> <strong>{EXTRA_NAMES.green}</strong>: the prize on a coin or
        diamond may be +1 Spin. One more spin is awarded when it is collected. The bonus is played on a 5×5 board unless
        Go Greg is also in play.
      </li>
      <li>
        <GemPicture color="red" className="mini-gem" /> <strong>{EXTRA_NAMES.red}</strong>: the bonus is played on an
        8×5 board. After any spin, additional prizes of (1–50) × the total bet may be added to 1 or more diamonds or
        coins (behind Greg). With Mo' Spins too, an additional prize may instead be +1 Spin or +2 Spins, and 1, 2 or 3
        more spins are awarded when a coin or diamond showing +1, +2 or +3 Spins is collected.
      </li>
      <li>
        <GemPicture color="blue" className="mini-gem" /> <strong>{EXTRA_NAMES.blue}</strong>: at the start of any spin,
        5 positions (8 with Go Greg) are randomly selected, and on each of them either 2 coins or 2 diamonds may appear.
      </li>
    </ul>
  );
}

function FreeGamesPage() {
  return (
    <>
      <p className="help-row">
        <span className="pay-sym">
          <SymbolIcon sym="scatter" />
        </span>{' '}
        Any 3, 4 or 5 trigger the Free Games feature and award {FREE_GAMES} free games along with{' '}
        {SCATTER_PAYS.map(times).join(', ')} the total bet credit prize respectively.
      </p>
      <ul className="help-rules">
        <li>
          Any Free Games symbol may also trigger the Free Games feature and award {FREE_GAMES} free games along with{' '}
          {times(SCATTER_PAYS[0])} the total bet credit prize.
        </li>
        <li>
          Free Games symbol is scatter. The Free Games feature can be triggered again during the Free Games feature.
        </li>
        <li>Bonus reels are in play during the feature.</li>
        <li>The bet is the same as the game that triggered the feature.</li>
        <li>The Greg Bonus and the jackpot feature can start during Free Games too.</li>
      </ul>
    </>
  );
}

/** "$41,049", "$2,957.19": whole dollars drop the cents. */
const jackpotDollars = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

function JackpotsPage({ denom }: PageProps) {
  return (
    <>
      <ul className="help-rules">
        <li>Any Wild may randomly trigger the jackpot feature.</li>
        <li>
          Touch any coffee cup to reveal Grand, Major, Maxi, Minor or Mini. Match 3 to win the corresponding prize.
        </li>
        <li>Outcomes of the jackpot feature are not influenced by player input.</li>
        <li>
          Jackpots can also be won from gems, and Minor and Mini from bonus coins and diamonds. Jackpot amounts are
          shown in currency.
        </li>
      </ul>
      <div className="help-jackpots">
        {[...TIERS].reverse().map((t) => (
          <div key={t} className={`plaque plaque-small tier-${t}`}>
            <span className="plaque-name">{TIER_NAMES[t].toUpperCase()}</span>
            <span className="plaque-amount">{jackpotDollars(jackpotValue(t, denom))}</span>
          </div>
        ))}
      </div>
      <p className="help-note">
        Jackpots are fixed amounts at each denomination and are not multiplied by the bet multiplier. An increase in
        wager increases the odds of winning jackpots proportionally.
      </p>
    </>
  );
}

function GameRulesPage() {
  return (
    <ul className="help-rules">
      <li>
        All wins are shown in credits, except jackpots. Touch the CREDIT, BET or WIN meter to show currency or credits.
      </li>
      <li>50 lines at 1¢ and 2¢; 25 at 5¢ and 10¢; 5 at $1 and $2. Choose your bet multiplier.</li>
      <li>The bet buttons and the Spin button immediately commence play.</li>
      <li>All wins on played lines only, except jackpot feature prizes, Free Games prizes and Greg Bonus prizes.</li>
      <li>Wins on different lines are added. Highest win only on each line.</li>
      <li>Line wins are multiplied by the bet multiplier.</li>
      <li>Free Games prizes, Greg Bonus prizes and jackpots are added to line wins.</li>
      <li>The prize on a gem does not influence the chance of triggering any feature.</li>
      <li>The coins in the Free Games and Jackpot crates do not influence the chance of triggering any feature.</li>
      <li>
        Malfunction voids all pays and plays. Player is responsible to confirm credits registered before game start.
      </li>
    </ul>
  );
}

/** Every square of the 5 × 3 reel area, for the payline diagrams. */
const GRID_CELLS = Array.from({ length: REELS * ROWS }, (_, i) => ({
  id: `cell-${i}`,
  reel: i % REELS,
  row: Math.floor(i / REELS),
}));

/**
 * One payline on a small 5 × 3 grid: a dot per square, the line drawn through its squares.
 * A line known only part way (fewer than 5 rows) shows "?" on the reels not seen.
 */
function LineDiagram({ rows, n }: { rows: readonly number[]; n: number }) {
  const x = (reel: number) => 10 + reel * 20;
  const y = (row: number) => 10 + row * 20;
  return (
    <svg viewBox="0 0 100 60" className="line-diagram" role="img" aria-label={`Line ${n}`}>
      <title>{`Line ${n}`}</title>
      {GRID_CELLS.map((c) => (
        <rect key={c.id} x={x(c.reel) - 8} y={y(c.row) - 8} width="16" height="16" rx="3" className="line-cell" />
      ))}
      {rows.map((row, reel) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: one square per reel.
        <rect key={reel} x={x(reel) - 8} y={y(row) - 8} width="16" height="16" rx="3" className="line-hit" />
      ))}
      <polyline points={rows.map((row, reel) => `${x(reel)},${y(row)}`).join(' ')} className="line-path" />
      {Array.from({ length: REELS - rows.length }, (_, k) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: one mark per unseen reel.
        <text key={k} x={x(rows.length + k)} y={y(1) + 5} className="line-unknown">
          ?
        </text>
      ))}
    </svg>
  );
}

function PaylinesPage() {
  const few = linesFor(1);
  return (
    <>
      <ol className="payline-grid">
        {PAYLINES.map((rows, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines are numbered by position.
          <li key={i} className={i < few ? 'first' : ''}>
            <span className="line-num">{i + 1}</span>
            <LineDiagram rows={rows} n={i + 1} />
          </li>
        ))}
      </ol>
      <p className="help-note">
        All {PAYLINES.length} lines play at 1¢ and 2¢. Lines 1–25 play at 5¢ and 10¢, and lines 1–{few} (outlined) at $1
        and $2.
      </p>
    </>
  );
}

/** The crew below Greg on the last page, left to right. */
const CREW = [
  { face: scott, name: 'Scott', label: "Mo' Scott" },
  { face: ben, name: 'Ben', label: "Mo' Ben" },
  { face: mike, name: 'Mike', label: "Mo' Mike" },
] as const;

/** The last page: Greg with "Go Greg" under him, then Scott, Ben and Mike in a row, each with their name. */
function CrewPage() {
  return (
    <div className="help-crew">
      <div className="help-person">
        <img src={greg} alt="Greg" className="help-face" />
        <div className="help-name">Go Greg</div>
      </div>
      <div className="help-crew-row">
        {CREW.map((c) => (
          <div key={c.name} className="help-person">
            <img src={c.face} alt={c.name} className="help-face" />
            <div className="help-name small">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PageProps {
  /** The denomination, for the jackpot amounts. */
  denom: number;
}

const PAGES: readonly { title: string; body: (props: PageProps) => ReactNode }[] = [
  { title: 'Paytable', body: PaytablePage },
  { title: 'Paylines', body: PaylinesPage },
  { title: 'Greg Bonus', body: BonusPage },
  { title: 'Greg Bonus: Play', body: BonusPlayPage },
  { title: 'Bonus Extras', body: ExtrasPage },
  { title: 'Free Games', body: FreeGamesPage },
  { title: 'Jackpots', body: JackpotsPage },
  { title: 'Game Rules', body: GameRulesPage },
  { title: '', body: CrewPage },
];

/** The machine's help screen: pages flipped with ◀ ▶, then Return to the game. */
export function HelpScreen({ denom, footer, onReturn }: { denom: number; footer?: ReactNode; onReturn: () => void }) {
  const [page, setPage] = useState(0);
  const current = PAGES[page] ?? PAGES[0];
  if (!current) return null;
  const Body = current.body;

  return (
    <div className="help-screen">
      {current.title && <h2 className="help-title">{current.title}</h2>}
      <div className="help-body">
        <Body denom={denom} />
      </div>
      <div className="help-nav">
        <button
          type="button"
          className="yellow-btn help-arrow"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          ◀
        </button>
        <span className="help-dots" role="img" aria-label={`Page ${page + 1} of ${PAGES.length}`}>
          {PAGES.map((p, i) => (
            <span key={p.title || 'last'} className={i === page ? 'on' : ''} />
          ))}
        </span>
        <button
          type="button"
          className="yellow-btn help-arrow"
          aria-label="Next page"
          disabled={page === PAGES.length - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          ▶
        </button>
      </div>
      <div className="help-actions">
        {footer}
        <button type="button" className="yellow-btn help-return" onClick={onReturn}>
          Return
        </button>
      </div>
    </div>
  );
}
