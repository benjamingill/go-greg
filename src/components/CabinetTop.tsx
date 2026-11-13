import moundBlue from '../assets/mound-blue.png';
import moundGreen from '../assets/mound-green.png';
import moundRed from '../assets/mound-red.png';
import { jackpotValue } from '../engine/jackpots';
import type { Tier } from '../engine/prizes';
import type { Extras, GemColor } from '../engine/symbols';
import { THEME } from '../themes';
import { BannerCrest, TIER_NAMES } from './art';
import { Backdrop } from './Backdrop';

const MOUNDS: Record<GemColor, string> = { red: moundRed, green: moundGreen, blue: moundBlue };

/** Each extra's namesake, shown above its label. */
const FACES: Record<keyof Extras, string> = {
  moSpins: THEME.faces.scott,
  goGreg: THEME.faces.greg,
  moSymbols: THEME.faces.mike,
};

/** A mound of gems of one colour, like the machine's gem piles. */
function GemHeap({ color, pulse }: { color: GemColor; pulse: string | undefined }) {
  return (
    <span className="gem-heap">
      <img src={MOUNDS[color]} alt="" className="heap-img" />
      {/* A brighter copy that flashes over it; a new `pulse` key remounts it, which plays the flash again. */}
      {pulse && <img key={pulse} src={MOUNDS[color]} alt="" className="heap-img heap-flash" />}
    </span>
  );
}

/** A crate heaped with gold coins, behind a banner badge that runs across its front. */
function CoinCrate({ flash }: { flash?: string | undefined }) {
  // A new `flash` key remounts the crate, which plays its flash again.
  return <img key={flash ?? 'still'} src={THEME.crate} alt="" className={`coin-crate${flash ? ' flash' : ''}`} />;
}

/** All five jackpots on one line, the Grand in the middle. */
const PLAQUES: readonly { tier: Tier; size: 'big' | 'mid' | 'small' }[] = [
  { tier: 'minor', size: 'small' },
  { tier: 'major', size: 'mid' },
  { tier: 'grand', size: 'big' },
  { tier: 'maxi', size: 'mid' },
  { tier: 'mini', size: 'small' },
];

/** "$2,000" for whole dollars, "$62.50" otherwise. Whole amounts drop the ".00" to save space. */
const dollars = (n: number) => {
  const cents = Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: cents, maximumFractionDigits: cents })}`;
};

/** A jackpot's plaque: its fixed amount at the denomination (it doesn't change with the bet). */
function Plaque({ tier, denom, size }: { tier: Tier; denom: number; size: 'big' | 'mid' | 'small' }) {
  return (
    <div className={`plaque plaque-${size} tier-${tier}`}>
      <span className="plaque-name">{TIER_NAMES[tier].toUpperCase()}</span>
      <span className="plaque-amount">{dollars(jackpotValue(tier, denom))}</span>
    </div>
  );
}

const FEATURES: readonly { color: GemColor; extra: keyof Extras; label: string }[] = [
  { color: 'green', extra: 'moSpins', label: "Mo' Spins" },
  { color: 'red', extra: 'goGreg', label: THEME.goName },
  { color: 'blue', extra: 'moSymbols', label: "Mo' Symbols" },
];

/** The banner across the top during a bonus: the faces and names of the extras in play, then the running total. */
export function BonusHero({ extras, total }: { extras: Extras; total: string }) {
  // Go Greg's board is 8 rows tall, which leaves no room for the faces: just the names on their backdrops.
  const faces = !extras.goGreg;
  return (
    <div className="bonus-hero">
      <div className="hero-cards">
        {FEATURES.filter((f) => extras[f.extra]).map((f) => (
          <div key={f.extra} className={`hero-card hero-${f.color}`}>
            {faces && <img src={FACES[f.extra]} alt="" className="hero-face" />}
            <span className="hero-label" data-text={f.label}>
              {f.label}
            </span>
          </div>
        ))}
      </div>
      <div className="hero-credits">
        {/* A new total remounts it, which plays its pop as a value lands. */}
        <strong key={total}>{total}</strong>
      </div>
    </div>
  );
}

/**
 * The top of the cabinet: a row of jackpot plaques, and a heap of gems for each
 * Greg Bonus extra. `lit` marks the extras in play during a bonus; otherwise all three glow.
 */
export function CabinetTop({
  denom,
  lit,
  bonus,
  landed,
  scatterFlash,
  wildFlash,
  spinsLeft,
}: {
  /** The denomination: the jackpot plaques show its fixed amounts. */
  denom: number;
  lit: Extras | null;
  /** A bonus is on show: only the plaques stay up here (the bonus banner sits below, with the board). */
  bonus: boolean;
  /** Gem colours that have landed this spin (see `landedGems`); their heaps pulse. */
  landed: Partial<Record<GemColor, string>>;
  /** Changes each time a FREE GAMES symbol lands this spin (see `landedScatters`); the Free Games crate flashes. */
  scatterFlash: string | undefined;
  /** Changes each time a WILD lands this spin; the Jackpot crate flashes. */
  wildFlash: string | undefined;
  /** In Free Games, the free spins left: shown in the middle of the bar in place of the crest. */
  spinsLeft: number | null;
}) {
  return (
    <div className="cabinet-top">
      {!bonus && <Backdrop />}
      <div className="plaques">
        {PLAQUES.map((p) => (
          <Plaque key={p.tier} tier={p.tier} denom={denom} size={p.size} />
        ))}
      </div>
      {!bonus && (
        <div className="features">
          {FEATURES.map((f) => {
            const state = lit ? (lit[f.extra] ? ' on' : ' off') : '';
            return (
              <div key={f.extra} className={`feature feature-${f.color}${state}`}>
                <GemHeap color={f.color} pulse={landed[f.color]} />
                <img src={FACES[f.extra]} alt="" className="feature-face" />
                <span className="feature-label">{f.label}</span>
              </div>
            );
          })}
          {/* A solid bar across the top of the reels, in front of the heaps, like the machine's:
            a coin crate on each end, with its label across the crate. */}
          <div className="trigger-strip">
            <span className="strip-end">
              <CoinCrate flash={scatterFlash} />
              <span key={scatterFlash ?? 'still'} className={`strip-label${scatterFlash ? ' flash' : ''}`}>
                Free Games
              </span>
            </span>
            {spinsLeft === null ? (
              <BannerCrest />
            ) : (
              <div className="free-left">
                <strong>{spinsLeft}</strong>
                <span>
                  Spins
                  <br />
                  left
                </span>
              </div>
            )}
            <span className="strip-end">
              <CoinCrate flash={wildFlash} />
              <span key={wildFlash ?? 'still'} className={`strip-label${wildFlash ? ' flash' : ''}`}>
                Jackpot
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
