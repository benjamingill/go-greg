import type { ReactNode } from 'react';
import breadsticks from '../assets/breadsticks.png';
import coffee from '../assets/coffee.png';
import donut from '../assets/donut.png';
import gemBlue from '../assets/gem-blue.png';
import gemGreen from '../assets/gem-green.png';
import gemRed from '../assets/gem-red.png';
import salad from '../assets/salad.png';
import spaghetti from '../assets/spaghetti.png';
import steak from '../assets/steak.png';
import { type Prize, prizeMult, type Tier } from '../engine/prizes';
import type { Cell } from '../engine/spin';
import type { GemColor, Sym } from '../engine/symbols';
import { Greg } from './Greg';

/**
 * Art for the symbols that use an emoji or picture, sized to the text (1em).
 * Greg and gems are drawn; Wild and Free Games are just words.
 */
export const SYMBOL_ART: Record<Exclude<Sym, 'greg' | 'gem' | 'scatter' | 'wild'>, ReactNode> = {
  salad: <img src={salad} className="sym-img" alt="" />,
  donut: <img src={donut} className="sym-img" alt="" />,
  steak: <img src={steak} className="sym-img" alt="" />,
  breadsticks: <img src={breadsticks} className="sym-img" alt="" />,
  spaghetti: <img src={spaghetti} className="sym-img" alt="" />,
  A: 'A',
  K: 'K',
  Q: 'Q',
  J: 'J',
};

/** Symbols shown as words, one line each. */
const WORDS: Record<'scatter', readonly string[]> = {
  scatter: ['FREE', 'GAMES'],
};

export const SYMBOL_NAMES: Record<Sym, string> = {
  salad: 'Salad',
  donut: 'Donut',
  steak: 'Steak',
  breadsticks: 'Breadsticks',
  spaghetti: 'Spaghetti',
  A: 'A',
  K: 'K',
  Q: 'Q',
  J: 'J',
  wild: 'Wild',
  scatter: 'Free Games',
  greg: 'Greg',
  gem: 'Gem',
};

export const TIER_NAMES: Record<Tier, string> = {
  mini: 'Mini',
  minor: 'Minor',
  maxi: 'Maxi',
  major: 'Major',
  grand: 'Grand',
};

/** A prize multiple as credits at a bet of `credits`: "50", "1,200", "12.5". */
export const creditLabel = (mult: number, credits: number) =>
  Number((mult * credits).toFixed(2)).toLocaleString('en-US');

/** A prize multiple as dollars at a bet of `bet`: "$200", "$0.50", "$1,200". */
export const moneyLabel = (mult: number, bet: number) => {
  const dollars = Number((mult * bet).toFixed(2));
  return `$${Number.isInteger(dollars) ? dollars.toLocaleString('en-US') : dollars.toFixed(2)}`;
};

/** A prize multiple as it is written on a gem, coin or diamond: credits, or dollars when the meters are in currency. */
export const valueText = (mult: number, credits: number, bet: number, inCredits: boolean) =>
  inCredits ? creditLabel(mult, credits) : moneyLabel(mult, bet);

/** The value of cash (see `valueText`), the name for a jackpot ("MINOR"). */
export const prizeLabel = (p: Prize, credits: number, bet: number, inCredits: boolean) =>
  p.kind === 'jackpot'
    ? TIER_NAMES[p.tier].toUpperCase()
    : p.kind === 'spin'
      ? '+1 SPIN'
      : valueText(prizeMult(p), credits, bet, inCredits);

/** The WILD: the coffee cup with "WILD" written over it. `inline` is the small version used in text. */
function WildSymbol({ inline = false }: { inline?: boolean }) {
  return (
    <span className={`wild-symbol${inline ? ' inline' : ''}`} role="img" aria-label={SYMBOL_NAMES.wild}>
      <img src={coffee} className="sym-img" alt="" />
      <span className="wild-word">WILD</span>
    </span>
  );
}

/** Free Games, shown as its words. `inline` is the small version used in text. */
function WordSymbol({ sym, inline = false }: { sym: 'scatter'; inline?: boolean }) {
  return (
    <span className={`word-symbol${inline ? ' inline' : ''}`} role="img" aria-label={SYMBOL_NAMES[sym]}>
      {WORDS[sym].map((w) => (
        <span key={w}>{w}</span>
      ))}
    </span>
  );
}

/** A symbol on its own (paytable, messages): its emoji, or its words. */
export function SymbolIcon({ sym }: { sym: Exclude<Sym, 'greg' | 'gem'> }) {
  if (sym === 'wild') return <WildSymbol inline />;
  if (sym === 'scatter') return <WordSymbol sym={sym} inline />;
  return <>{SYMBOL_ART[sym]}</>;
}

/** The gem pictures, by colour. */
const GEM_PICTURES: Record<GemColor, string> = { red: gemRed, blue: gemBlue, green: gemGreen };

/** A gem on its own (banner strip, bonus splash, help): its picture. */
export function GemPicture({ color, className }: { color: GemColor; className?: string }) {
  return (
    <span
      className={`gem gem-${color} gem-pic${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={`${color} gem`}
    >
      <img src={GEM_PICTURES[color]} className="gem-img" alt="" />
    </span>
  );
}

/** One square on the base-game reels. Gem prizes show in credits or dollars, like the meters. */
export function SymbolView({
  cell,
  credits,
  bet,
  inCredits,
}: {
  cell: Cell;
  credits: number;
  bet: number;
  inCredits: boolean;
}) {
  if (cell.sym === 'greg') return <Greg />;
  if (cell.sym === 'wild') return <WildSymbol />;
  if (cell.sym === 'scatter') return <WordSymbol sym={cell.sym} />;
  if (cell.gem) {
    const label = prizeLabel(cell.gem.prize, credits, bet, inCredits);
    return (
      <span className={`gem gem-${cell.gem.color} gem-pic`} title={`${cell.gem.color} gem`}>
        <img src={GEM_PICTURES[cell.gem.color]} className="gem-img" alt="" />
        {/* Jackpot names are written in their own colour, whatever the gem; cash is white.
            `data-text` is drawn again over it with a gradient (see .gem-pic .gem-prize::after). */}
        <span
          className={`gem-prize${cell.gem.prize.kind === 'jackpot' ? ` jp-${cell.gem.prize.tier}` : ''}`}
          data-text={label}
        >
          {label}
        </span>
      </span>
    );
  }
  const sym = cell.sym as keyof typeof SYMBOL_ART;
  const isLetter = sym.length === 1;
  return (
    <span className={isLetter ? `letter letter-${sym}` : `emoji sym-${sym}`} title={SYMBOL_NAMES[sym]}>
      {SYMBOL_ART[sym]}
    </span>
  );
}

/** A gold coin with a "$", sized to the text (1em). Drawn here because the 🪙 emoji is silver on some systems. */
export function Coin({ decorative = false }: { decorative?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="coin-art" role="img" aria-hidden={decorative || undefined}>
      <title>Coin</title>
      <circle cx="50" cy="50" r="47" fill="#b8770a" />
      <circle cx="50" cy="47" r="44" fill="#f5c542" />
      <circle cx="50" cy="47" r="34" fill="none" stroke="#c98d10" strokeWidth="5" />
      <text
        x="50"
        y="66"
        textAnchor="middle"
        fontSize="54"
        fontWeight="900"
        fontFamily="system-ui, sans-serif"
        fill="#b07a00"
      >
        $
      </text>
      <ellipse cx="34" cy="26" rx="12" ry="5" fill="#fff6c8" opacity="0.7" transform="rotate(-30 34 26)" />
    </svg>
  );
}

/** A coffee cup: the jackpot game's pick. */
export function Cup() {
  return <img src={coffee} className="cup-art" alt="Coffee cup" />;
}

/** One diamond, drawn at (x, y) with width `w`: a flat top over a pointed bottom, with facets. */
function DiamondShape({ x, y, w }: { x: number; y: number; w: number }) {
  const h = w * 0.78;
  const t = 0.32;
  const p = (dx: number, dy: number) => `${x + dx * w},${y + dy * h}`;
  const outline = `${p(0.2, 0)} ${p(0.8, 0)} ${p(1, t)} ${p(0.5, 1)} ${p(0, t)}`;
  return (
    <g>
      <polygon points={outline} fill="#8fd3ff" />
      <polygon points={`${p(0.2, 0)} ${p(0.8, 0)} ${p(1, t)} ${p(0, t)}`} fill="#d6f1ff" />
      <polygon points={`${p(0, t)} ${p(0.5, 1)} ${p(0.32, t)}`} fill="#5fb4f0" />
      <polygon points={`${p(0.68, t)} ${p(0.5, 1)} ${p(1, t)}`} fill="#3d95dc" />
      <polygon points={outline} fill="none" stroke="#1d5f9c" strokeWidth={w * 0.03} strokeLinejoin="round" />
    </g>
  );
}

/** One coin at centre (cx, cy), radius r, matching `Coin`. */
function CoinShape({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#b8770a" />
      <circle cx={cx} cy={cy - r * 0.06} r={r * 0.94} fill="#f5c542" />
      <circle cx={cx} cy={cy - r * 0.06} r={r * 0.72} fill="none" stroke="#c98d10" strokeWidth={r * 0.1} />
    </g>
  );
}

/**
 * A Mo' Symbols double as one picture: two diamonds or coins overlapping, one
 * top-left and one bottom-right, like the machine's. The caller writes each
 * value over its half (see `.double-label` in slots.css).
 */
export function DoubleArt({ kind }: { kind: 'diamond' | 'coin' }) {
  return (
    <svg viewBox="0 0 100 100" className="double-art" aria-hidden="true">
      {kind === 'diamond' ? (
        <>
          <DiamondShape x={2} y={8} w={62} />
          <DiamondShape x={36} y={48} w={62} />
        </>
      ) : (
        <>
          <CoinShape cx={32} cy={32} r={29} />
          <CoinShape cx={68} cy={68} r={29} />
        </>
      )}
    </svg>
  );
}

/** The gold crest in the middle of the banner bar, with a swirl either side. */
export function BannerCrest() {
  return (
    <svg viewBox="0 0 200 40" className="banner-crest" aria-hidden="true">
      {/* Swirls. */}
      <g fill="none" stroke="#7a0e06" strokeWidth="3" strokeLinecap="round" opacity="0.7">
        <path d="M10 24 C22 12 36 30 52 18" />
        <path d="M190 24 C178 12 164 30 148 18" />
      </g>
      {/* Side blocks. */}
      <g fill="#f5b53a" stroke="#6a3a00" strokeWidth="1.5">
        <rect x="70" y="18" width="14" height="14" rx="3" />
        <rect x="116" y="18" width="14" height="14" rx="3" />
      </g>
      {/* The gem-shaped centre. */}
      <path
        d="M100 2 L118 20 L100 38 L82 20 Z"
        fill="#f5b53a"
        stroke="#6a3a00"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M100 9 L111 20 L100 31 L89 20 Z" fill="#ffd96a" />
      <path d="M100 9 L111 20 H89 Z" fill="#fff1b0" />
    </svg>
  );
}
