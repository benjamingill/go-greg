import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './slots.css';
import { formatMoney, isFiniteNumber, isRecord, load, roundCents, save } from '.';
import { Cup, creditLabel, SYMBOL_NAMES, SymbolIcon, valueText } from './components/art';
import { BonusBoard } from './components/BonusBoard';
import { BonusSplash } from './components/BonusSplash';
import { BonusHero, CabinetTop } from './components/CabinetTop';
import { ControlPanel, type SpinAction, SpinButton } from './components/ControlPanel';
import { DevCheats } from './components/DevCheats';
import { FreeGamesSplash } from './components/FreeGamesSplash';
import { HelpScreen } from './components/InfoPanels';
import { PickGame } from './components/PickGame';
import { Reels } from './components/Reels';
import { cellValue, claimedCount, grewOnMove, totalSoFar, walkLength } from './engine/bonus';
import {
  baseBet,
  betCredits,
  betOf,
  canSpin,
  createMachine,
  DENOMS,
  type FreeGames,
  inFreeGames,
  type Machine,
  type SpinResult,
  START_BANKROLL,
  setCredits,
  setDenom,
  spin,
} from './engine/machine';
import { linesFor, PAYLINES, REELS } from './engine/paylines';
import { emptyPicks, pickCoin, pickDone, type Revealed } from './engine/pick';
import { drawGrid, type LineWin } from './engine/spin';
import type { GemColor } from './engine/symbols';
import { tossCoins } from './toss';

const MACHINE_KEY = 'slots:machine-v1';
const METERS_KEY = 'slots:meters-in-credits-v1';

const rng = Math.random;

/** How long the reels spin before the first one stops, and the gap between stops (ms). */
const SPIN_MS = 450;
const STOP_GAP_MS = 450;
/** How long the stopped reels stay on screen before a feature's banner or splash. */
const REVEAL_HOLD_MS = 250;
/** The gap between stops once Greg is on reel 1, so each reveal gets a build-up. */
const GREG_STOP_GAP_MS = 1600;
const FEATURE_INTRO_MS = 1400;
/** Greg walks one square per step. */
const GREG_STEP_MS = 250;
/** The pause after the squares land before Greg sets off for the first diamond. */
const GREG_FIRST_MS = 400;
/**
 * After Greg reaches a diamond: it bursts as its value flies up to the banner total
 * (which takes it in as it lands), then a copy of the diamond flies to the diamond
 * column, then he sets off for the next (timings in slots.css: the claimed diamond,
 * .value-flight, .diamond-flight and .diamond-slot.arriving).
 */
const GREG_CLAIM_MS = 1300;
/**
 * Extra time when a diamond grows Greg: its slot fills, the full set holds for a
 * moment (see .diamond-slot.completing), then he grows and settles.
 */
const GREG_GROW_MS = 1100;
const LINE_CYCLE_MS = 1200;
/** A win this many times the bet lights up the WIN meter. */
const BIG_WIN = 20;

function parseFreeGames(v: unknown): FreeGames | null {
  if (!isRecord(v)) return null;
  const { left, played, won } = v;
  if (![left, played, won].every(isFiniteNumber)) return null;
  return { left: Math.max(0, Math.floor(left as number)), played: played as number, won: won as number };
}

function parseMachine(v: unknown): Machine | undefined {
  if (!isRecord(v) || !isFiniteNumber(v.bankroll)) return undefined;
  const defaults = createMachine();
  const denom = DENOMS.find((d) => d === v.denom) ?? defaults.denom;
  const credits = betCredits(denom).find((c) => c === v.credits) ?? baseBet(denom);
  return { bankroll: v.bankroll, denom, credits, freeGames: parseFreeGames(v.freeGames) };
}

/**
 * What the screen is showing for the last spin. The engine settles a spin in
 * full straight away (features included), and the screen then plays it out:
 * reels spin, a feature intro, the Greg Bonus spins, the jackpot pick game,
 * then the Free Games splash if the spin started Free Games.
 */
type Stage = 'spinning' | 'intro' | 'bonus' | 'pick' | 'freeIntro' | 'done';
interface Show {
  /** Counts up with each spin. */
  id: number;
  result: SpinResult;
  stage: Stage;
  /** Reels that have stopped. */
  stopped: number;
  /** The Greg Bonus spin that has landed. */
  frame: number;
  /** The Greg Bonus squares are spinning towards the next frame. */
  rolling: boolean;
  /** While rolling, how many board columns have stopped (left to right, like the reels). */
  landedCols: number;
  /** How many of this frame's Greg moves have started. */
  moved: number;
  /** Squares Greg has walked on the move under way (he claims its diamond on arrival). */
  step: number;
  /** Claimed diamonds (this frame) whose value has flown up and reached the banner. */
  banked: number;
  /** Collected coins (by square, this frame) whose value and spins have landed. */
  coinsIn: number[];
  picks: Revealed;
}

/** Winnings the screen hasn't revealed yet, so the balance doesn't jump ahead of the show. */
function unrevealed(show: Show | null): number {
  if (!show) return 0;
  const r = show.result;
  switch (show.stage) {
    case 'spinning':
      return r.total;
    case 'intro':
    case 'bonus':
      return r.bonusWin + r.jackpotWin;
    case 'pick':
      return r.jackpotWin;
    case 'freeIntro':
    case 'done':
      return 0;
  }
}

/** A paid spin that awards Free Games shows the Free Games splash once its other features are over. */
const afterFeatures = (r: SpinResult): Stage => (r.paid && r.reels.freeGames > 0 ? 'freeIntro' : 'done');
const afterBonus = (r: SpinResult): Stage => (r.pick ? 'pick' : afterFeatures(r));

/** `active`: false while another game is showing, so keyboard shortcuts don't reach this one. */
export function SlotsGame({ active }: { active: boolean }) {
  const [machine, setMachine] = useState(() => load(MACHINE_KEY, parseMachine, createMachine()));
  const [show, setShow] = useState<Show | null>(null);
  const [idleGrid] = useState(() => drawGrid(rng));
  /** Which winning line is shown; -1 shows every winning square at once. */
  const [lineIndex, setLineIndex] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  /** Testing only: holds the game where it is until Play. */
  const [paused, setPaused] = useState(false);

  useEffect(() => save(MACHINE_KEY, machine), [machine]);
  /** The meters show credits (the machine's default) or dollars. */
  const [inCredits, setInCredits] = useState(() =>
    load(METERS_KEY, (v) => (typeof v === 'boolean' ? v : undefined), true),
  );
  useEffect(() => save(METERS_KEY, inCredits), [inCredits]);

  const busy = show !== null && show.stage !== 'done';
  const free = inFreeGames(machine);
  const result = show?.result ?? null;
  const bet = result?.bet ?? betOf(machine);

  /** Plays a spin. Only call it when nothing is showing, or from the Free Games splash. */
  const spinFrom = useCallback((from: Machine) => {
    const out = spin(from, rng);
    if (!out) return;
    setMachine(out.machine);
    setShow((s) => ({
      id: (s?.id ?? 0) + 1,
      result: out.result,
      stage: 'spinning',
      stopped: 0,
      frame: 0,
      rolling: false,
      landedCols: 0,
      moved: 0,
      step: 0,
      banked: 0,
      coinsIn: [],
      picks: emptyPicks(),
    }));
    setLineIndex(-1);
  }, []);
  const spinNow = useCallback(() => spinFrom(machine), [machine, spinFrom]);
  /** A claimed diamond's value has reached the banner: it counts from now on. */
  const onBanked = useCallback((frame: number, moves: number) => {
    setShow((s) => (s && s.frame === frame && s.banked < moves ? { ...s, banked: moves } : s));
  }, []);
  /** A collected coin's value and spins have reached the banner and SPINS LEFT: they count from now on. */
  const onCoinIn = useCallback((frame: number, cell: number) => {
    setShow((s) => (s && s.frame === frame && !s.coinsIn.includes(cell) ? { ...s, coinsIn: [...s.coinsIn, cell] } : s));
  }, []);
  /** A bet button sets the bet and plays at once (it's only enabled when nothing is showing). */
  const betAndSpin = (credits: number) => {
    const next = setCredits(machine, credits);
    setMachine(next);
    spinFrom(next);
  };
  const doSpin = useCallback(() => {
    if (!busy) spinNow();
  }, [busy, spinNow]);

  /** Spin while busy: stops the reels early, or spins the Greg Bonus squares (and lands them early). */
  const skip = useCallback(() => {
    setShow((s) => {
      if (!s) return s;
      if (s.stage === 'spinning') return { ...s, stopped: REELS };
      // The bonus splash waits for Spin.
      if (s.stage === 'intro' && s.result.bonus) return { ...s, stage: 'bonus' };
      if (s.stage === 'bonus' && s.result.bonus) {
        if (s.rolling)
          return { ...s, rolling: false, landedCols: 0, frame: s.frame + 1, moved: 0, step: 0, banked: 0, coinsIn: [] };
        const moves = s.result.bonus.frames[s.frame]?.moves.length ?? 0;
        if (claimedCount(s.result.bonus, s.frame, s.moved, s.step) < moves)
          return { ...s, moved: moves, step: Number.MAX_SAFE_INTEGER };
        if (s.frame < s.result.bonus.frames.length - 1) return { ...s, rolling: true, landedCols: 0 };
      }
      return s;
    });
  }, []);

  const collectBonus = () => setShow((s) => (s ? { ...s, stage: afterBonus(s.result) } : s));
  const collectPick = () => setShow((s) => (s ? { ...s, stage: afterFeatures(s.result) } : s));
  const pick = (i: number) =>
    setShow((s) => (s?.result.pick ? { ...s, picks: pickCoin(s.result.pick, s.picks, i) } : s));

  // Stop the reels one by one, then move on to any features.
  useEffect(() => {
    if (paused || show?.stage !== 'spinning') return;
    if (show.stopped >= REELS) {
      const r = show.result;
      const nextStage = r.bonus || r.pick ? 'intro' : afterFeatures(r);
      if (nextStage === 'done') {
        setShow({ ...show, stage: nextStage });
        return;
      }
      // Leave the last reel on screen for a moment before the feature's banner or splash.
      const t = setTimeout(
        () => setShow((s) => (s?.stage === 'spinning' ? { ...s, stage: nextStage } : s)),
        REVEAL_HOLD_MS,
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setShow((s) => (s ? { ...s, stopped: s.stopped + 1 } : s)),
      show.stopped === 0
        ? SPIN_MS
        : show.result.reels.grid[0]?.some((c) => c.sym === 'greg')
          ? GREG_STOP_GAP_MS
          : STOP_GAP_MS,
    );
    return () => clearTimeout(t);
  }, [show, paused]);

  // The jackpot game's intro banner moves on by itself; the Greg Bonus splash waits for Spin.
  const bonusIntro = show?.stage === 'intro' && show.result.bonus !== null;
  /** The Greg Bonus is on show (its splash, then its spins). */
  const bonusScreen = (show?.stage === 'bonus' || bonusIntro) && !!result?.bonus;
  const jackpotIntro = show?.stage === 'intro' && !bonusIntro;
  useEffect(() => {
    if (paused || !jackpotIntro) return;
    const t = setTimeout(() => setShow((s) => (s ? { ...s, stage: 'pick' } : s)), FEATURE_INTRO_MS);
    return () => clearTimeout(t);
  }, [jackpotIntro, paused]);

  // The Greg Bonus plays one spin per press of Spin: the squares spin, then the
  // columns stop one by one, left to right, with the same timing as the reels.
  const bonusFrames = result?.bonus?.frames.length ?? 0;
  const bonusCols = result?.bonus?.cols ?? 0;
  useEffect(() => {
    if (paused || show?.stage !== 'bonus' || !show.rolling) return;
    const t = setTimeout(
      () =>
        setShow((s) => {
          if (!s?.rolling) return s;
          if (s.landedCols + 1 < bonusCols) return { ...s, landedCols: s.landedCols + 1 };
          return { ...s, rolling: false, landedCols: 0, frame: s.frame + 1, moved: 0, step: 0, banked: 0, coinsIn: [] };
        }),
      show.landedCols === 0 ? SPIN_MS : STOP_GAP_MS,
    );
    return () => clearTimeout(t);
  }, [show?.stage, show?.rolling, show?.landedCols, bonusCols, paused]);

  // Once the squares land, Greg moves to each diamond in turn.
  const movesNow = show?.stage === 'bonus' ? (result?.bonus?.frames[show.frame]?.moves.length ?? 0) : 0;
  useEffect(() => {
    if (paused || show?.stage !== 'bonus' || show.rolling || !result?.bonus) return;
    const run = result.bonus;
    // One square at a time; then the claim plays out before he sets off for the next diamond.
    const walking = show.moved > 0 && show.step < walkLength(run, show.frame, show.moved - 1);
    if (!walking && show.moved >= movesNow) return;
    const grew = show.moved > 0 && grewOnMove(run, show.frame, show.moved - 1);
    const t = setTimeout(
      () => setShow((s) => (s ? (walking ? { ...s, step: s.step + 1 } : { ...s, moved: s.moved + 1, step: 0 }) : s)),
      walking ? GREG_STEP_MS : show.moved === 0 ? GREG_FIRST_MS : GREG_CLAIM_MS + (grew ? GREG_GROW_MS : 0),
    );
    return () => clearTimeout(t);
  }, [show?.stage, show?.rolling, show?.moved, show?.step, show?.frame, movesNow, paused, result?.bonus]);

  // Like the machine: first light every winning square at once, then cycle through the lines.
  const wins = show?.stage === 'spinning' ? [] : (result?.reels.lineWins ?? []);
  useEffect(() => {
    if (paused || wins.length === 0) return;
    const t = setInterval(() => setLineIndex((i) => i + 1), LINE_CYCLE_MS);
    return () => clearInterval(t);
  }, [wins.length, paused]);
  const shownWin = wins.length > 0 && lineIndex >= 0 ? wins[lineIndex % wins.length] : undefined;
  const highlight = useMemo(() => {
    const set = new Set<string>();
    for (const w of shownWin ? [shownWin] : lineIndex < 0 ? wins : []) {
      const rows = PAYLINES[w.line] ?? [];
      for (let reel = 0; reel < w.count; reel++) set.add(`${reel}-${rows[reel]}`);
    }
    return set;
  }, [shownWin, lineIndex, wins]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active || menuOpen) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName) || e.metaKey || e.ctrlKey) return;
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (!busy) doSpin();
      else if (bonusOver) collectBonus();
      else if (show?.stage === 'pick' && result?.pick && pickDone(result.pick, show.picks)) collectPick();
      else if (show?.stage === 'freeIntro') spinNow();
      else skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const balance = machine.bankroll - unrevealed(show);
  const canChangeBet = !busy && !free;
  const fg = machine.freeGames;
  // Free Games have purple reels and a spins-left counter, through the last free spin's result.
  // Not on the spin that awards them: that one plays on the normal reels, then shows the Free Games sign.
  const freeLook = result !== null && !result.paid;

  const bonusOver =
    show?.stage === 'bonus' &&
    show.frame >= bonusFrames - 1 &&
    result?.bonus != null &&
    claimedCount(result.bonus, show.frame, show.moved, show.step) >= movesNow;
  const pickOver = show?.stage === 'pick' && result?.pick != null && pickDone(result.pick, show.picks);
  const action: SpinAction =
    show?.stage === 'freeIntro'
      ? { label: 'Spin', onClick: spinNow }
      : bonusOver
        ? { label: 'Collect', onClick: collectBonus }
        : pickOver
          ? { label: 'Collect', onClick: collectPick }
          : show?.stage === 'pick'
            ? { label: 'Spin', onClick: () => {}, disabled: true }
            : busy
              ? // Mid-spin, Spin stops the reels early. In the Greg Bonus it plays the next spin.
                { label: 'Spin', onClick: skip, disabled: jackpotIntro }
              : {
                  label: free ? 'Free spin' : 'Spin',
                  onClick: doSpin,
                  disabled: !canSpin(machine),
                };

  // Idle, a bet button sets its bet and plays. Otherwise it does what Spin does (stops the
  // reels early, plays the next bonus spin, collects, starts a free spin), and is disabled when Spin is.
  const onBet = (credits: number) => (canChangeBet ? betAndSpin(credits) : action.onClick());
  const betDisabled = !canChangeBet && action.disabled === true;

  // On a screen too short for everything, shorten the reels (their squares stop being
  // square) just enough that nothing is pushed off the bottom. Measured again whenever the
  // screen or any part of the machine changes size (pictures loading, the bonus board).
  const rootRef = useRef<HTMLDivElement>(null);
  // Which chests and gem heaps have been hit by their orbs this spin (each holds a key that changes per spin).
  const [chestFlash, setChestFlash] = useState<{
    id: number;
    scatter?: string;
    wild?: string;
    gems?: Partial<Record<GemColor, string>>;
  } | null>(null);
  const showRef = useRef(show);
  showRef.current = show;
  const spinId = show?.id;
  const settled = (show?.stopped ?? 0) >= REELS;
  // Once every reel has stopped, a gold coin is tossed from each FREE GAMES symbol into the Free
  // Games chest, and from each WILD into the Jackpot chest; a chest pulses as its coins land.
  useEffect(() => {
    const root = rootRef.current;
    const current = showRef.current;
    if (!root || !current || !settled || spinId === undefined) return;
    const grid = current.result.reels.grid;
    const stops: (() => void)[] = [];
    for (const [sym, chestIndex] of [
      ['scatter', 0],
      ['wild', 1],
    ] as const) {
      const cells: Element[] = [];
      let count = 0;
      grid.forEach((reel, r) => {
        reel.forEach((cell, row) => {
          if (cell.sym !== sym) return;
          count++;
          const el = root.querySelectorAll('.reels > .reel')[r]?.querySelectorAll(':scope > .reel-cell')[row];
          if (el) cells.push(el);
        });
      });
      if (count === 0) continue;
      const key = `${spinId}-${count}`;
      const pulse = () => setChestFlash((f) => ({ ...(f?.id === spinId ? f : null), id: spinId, [sym]: key }));
      const chest = root.querySelectorAll('.trigger-strip .strip-end')[chestIndex]?.querySelector('.coin-crate');
      if (chest && cells.length > 0) stops.push(tossCoins(cells, chest, pulse));
      else pulse();
    }
    // Each gem tosses orbs in its colour into the heap of that colour.
    for (const color of ['green', 'red', 'blue'] as const) {
      const cells: Element[] = [];
      let count = 0;
      grid.forEach((reel, r) => {
        reel.forEach((cell, row) => {
          if (cell.gem?.color !== color) return;
          count++;
          const el = root.querySelectorAll('.reels > .reel')[r]?.querySelectorAll(':scope > .reel-cell')[row];
          if (el) cells.push(el);
        });
      });
      if (count === 0) continue;
      const key = `${spinId}-${count}`;
      const pulse = () =>
        setChestFlash((f) => {
          const base = f?.id === spinId ? f : { id: spinId };
          return { ...base, gems: { ...base.gems, [color]: key } };
        });
      const heap = root.querySelector(`.feature-${color} .gem-heap`);
      if (heap && cells.length > 0) stops.push(tossCoins(cells, heap, pulse, { color, aimY: 0.35 }));
      else pulse();
    }
    return () => {
      for (const stop of stops) stop();
    };
  }, [spinId, settled]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fitReels = () => {
      root.style.setProperty('--reels-fit-h', 'none');
      // How far the buttons at the bottom run past the bottom of the machine.
      const overflow = () => {
        const cabinet = root.querySelector<HTMLElement>('.cabinet');
        const last = cabinet?.lastElementChild;
        if (!cabinet || !last) return 0;
        const room =
          cabinet.getBoundingClientRect().bottom - Number.parseFloat(getComputedStyle(cabinet).paddingBottom);
        return last.getBoundingClientRect().bottom - room;
      };
      for (let i = 0; i < 3; i++) {
        const reels = root.querySelector<HTMLElement>('.reels');
        const over = overflow();
        if (!reels || over <= 0.5) return;
        const height = reels.getBoundingClientRect().height;
        root.style.setProperty('--reels-fit-h', `${Math.max(90, height - over)}px`);
      }
    };
    fitReels();
    const watch = new ResizeObserver(fitReels);
    watch.observe(root);
    for (const part of root.querySelectorAll('.cabinet-top, .play-row, .control-panel')) watch.observe(part);
    return () => watch.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={`slots${show?.stage === 'bonus' || bonusIntro ? ' tall' : ''}${paused ? ' paused' : ''}`}
    >
      {/* The cabinet logo is the visible title; this heading is for screen readers. */}
      <h1 className="visually-hidden">Go Greg</h1>

      <div className="slots-body">
        <main className="cabinet">
          <CabinetTop
            denom={machine.denom}
            landed={(chestFlash?.id === show?.id && chestFlash?.gems) || {}}
            scatterFlash={chestFlash?.id === show?.id ? chestFlash?.scatter : undefined}
            wildFlash={chestFlash?.id === show?.id ? chestFlash?.wild : undefined}
            bonus={bonusScreen}
            lit={(show?.stage === 'intro' || show?.stage === 'bonus') && result?.bonus ? result.bonus.extras : null}
            spinsLeft={freeLook ? (fg?.left ?? 0) : null}
          />
          {/* During the Greg Bonus the banner and the board are one screen, so its splash covers both. */}
          <div className={bonusScreen ? 'bonus-screen' : 'play-area'}>
            {bonusScreen && result?.bonus && (
              <BonusHero
                extras={result.bonus.extras}
                total={valueText(show?.stage === 'bonus' ? bonusShown(show) : 0, result.credits, bet, inCredits)}
              />
            )}
            <div className="play-row">
              <div className="play-center">
                {(show?.stage === 'bonus' || bonusIntro) && result?.bonus ? (
                  <div className="bonus-stage">
                    <BonusBoard
                      run={result.bonus}
                      frame={show.frame}
                      rolling={show.rolling}
                      landedCols={show.landedCols}
                      moved={show.moved}
                      step={show.step}
                      banked={bankedMoves(show)}
                      onBanked={onBanked}
                      coinsIn={show.coinsIn}
                      onCoinIn={onCoinIn}
                      bet={bet}
                      credits={result.credits}
                      inCredits={inCredits}
                    />
                  </div>
                ) : show?.stage === 'pick' && result?.pick ? (
                  <div className="reels-frame">
                    <div className="reels-backdrop" aria-hidden="true" />
                    <PickGame game={result.pick} revealed={show.picks} amount={result.jackpotWin} onPick={pick} />
                  </div>
                ) : (
                  <div className={`reels-frame${freeLook ? ' free' : ''}`}>
                    {/* The red panel behind the reels, banner-wide. */}
                    <div className="reels-backdrop" aria-hidden="true" />
                    <Reels
                      grid={result?.reels.grid ?? idleGrid}
                      credits={result?.credits ?? machine.credits}
                      bet={bet}
                      inCredits={inCredits}
                      stopped={show?.stopped ?? REELS}
                      highlight={highlight}
                    />
                  </div>
                )}
                {show?.stage === 'freeIntro' && <FreeGamesSplash games={show.result.reels.freeGames} />}
              </div>
            </div>
            {bonusIntro && result?.bonus && <BonusSplash extras={result.bonus.extras} />}
          </div>
          <ControlPanel
            spin={<SpinButton action={action} />}
            status={
              <Message
                show={show}
                freeGames={fg}
                line={shownWin}
                lines={canChangeBet ? linesFor(machine.denom) : (result?.lines ?? linesFor(machine.denom))}
              />
            }
            balance={balance}
            win={winSoFar(show)}
            bigWin={show?.stage === 'done' && result !== null && result.total >= result.bet * BIG_WIN}
            denom={machine.denom}
            credits={machine.credits}
            canChangeBet={canChangeBet}
            inCredits={inCredits}
            onToggleMeters={() => setInCredits((c) => !c)}
            bonusReels={show?.stage === 'bonus' || freeLook}
            featureComplete={
              // After the Greg Bonus or jackpot game, or the last free game, until the next spin.
              show?.stage === 'done' &&
              result !== null &&
              (result.bonus !== null || result.pick !== null || (!result.paid && fg?.left === 0))
            }
            onBet={onBet}
            betDisabled={betDisabled}
            onDenom={(d) => setMachine((m) => setDenom(m, d))}
            onMenu={() => setMenuOpen(true)}
          />
        </main>
      </div>

      {import.meta.env.DEV && (
        <DevCheats
          paused={paused}
          onPause={() => setPaused((p) => !p)}
          onReset={() => {
            // Ends anything showing (its timers stop with it) and starts a fresh machine.
            setShow(null);
            setLineIndex(-1);
            setPaused(false);
            setMenuOpen(false);
            setMachine(createMachine());
          }}
        />
      )}

      {menuOpen && (
        <>
          <div className="modal-backdrop" />
          <div className="menu-modal" role="dialog" aria-modal="true" aria-label="Help">
            <HelpScreen
              denom={machine.denom}
              onReturn={() => setMenuOpen(false)}
              footer={
                <button
                  type="button"
                  className="link"
                  disabled={busy || free}
                  onClick={() => setMachine((m) => ({ ...m, bankroll: START_BANKROLL, freeGames: null }))}
                >
                  Reset balance to $1,000
                </button>
              }
            />
          </div>
        </>
      )}
    </div>
  );
}

/** What the WIN meter shows: only what the screen has revealed so far. */
/**
 * Greg's moves this frame whose diamond value the banner and WIN meter count: every
 * claimed one, less the latest while its value is still flying up to the banner.
 */
function bankedMoves(show: Show): number {
  const run = show.result.bonus;
  if (!run) return 0;
  const claimed = claimedCount(run, show.frame, show.moved, show.step);
  return show.rolling || show.banked >= claimed ? claimed : Math.max(0, claimed - 1);
}

/**
 * The bonus total (in bets) the banner and WIN meter show: what has flown in so far.
 * Diamonds count as their value lands (see `bankedMoves`), and this frame's coins as
 * theirs does, once the squares have all landed.
 */
function bonusShown(show: Show): number {
  const run = show.result.bonus;
  if (!run) return 0;
  const inFlight = show.rolling
    ? 0
    : (run.frames[show.frame]?.board ?? []).reduce(
        (sum, c, i) =>
          c?.kind === 'coin' && c.collected && !show.coinsIn.includes(i) ? sum + cellValue(c, run.jackpotMults) : sum,
        0,
      );
  return totalSoFar(run, show.frame, bankedMoves(show)) - inFlight;
}

function winSoFar(show: Show | null): number | null {
  if (!show) return null;
  const r = show.result;
  const base = r.lineWin + r.scatterWin;
  switch (show.stage) {
    case 'spinning':
      return null;
    case 'intro':
      return base;
    case 'bonus':
      return roundCents(base + r.bet * bonusShown(show));
    case 'pick':
      return base + r.bonusWin;
    case 'freeIntro':
    case 'done':
      return r.total;
  }
}

/** The status line above the WIN meter. It shows what's happening, and only the instructions the machine shows. */
function Message({
  show,
  freeGames,
  line,
  lines,
}: {
  show: Show | null;
  freeGames: FreeGames | null;
  line: LineWin | undefined;
  /** Lines played; shown when there's nothing else to say, like the machine's "n LINES". */
  lines: number;
}) {
  const linesLabel = <>{lines} lines</>;
  const r = show?.result;
  if (!show || !r) return linesLabel;

  switch (show.stage) {
    case 'spinning':
      return linesLabel;
    case 'intro':
      // The Greg Bonus has its own splash over the board.
      return r.bonus ? null : <span className="feature-intro">Jackpot game!</span>;
    case 'bonus': {
      // Like the machine: "GOOD LUCK" while the squares spin and Greg moves, "PRESS PLAY TO SPIN"
      // (our button is Spin) while it waits for a press. Nothing once Spin reads Collect.
      const run = r.bonus;
      const moves = run?.frames[show.frame]?.moves.length ?? 0;
      if (show.rolling || !run || claimedCount(run, show.frame, show.moved, show.step) < moves) return <>Good luck</>;
      return run && show.frame < run.frames.length - 1 ? <>Press Spin to spin</> : null;
    }
    case 'pick':
      if (!r.pick) return null;
      return pickDone(r.pick, show.picks) ? (
        <>Jackpot!</>
      ) : (
        <>
          Touch{' '}
          <span className="status-cup">
            <Cup />
          </span>{' '}
          to reveal
        </>
      );
    case 'freeIntro':
    case 'done':
      break;
  }

  if (r.reels.freeGames > 0) {
    return (
      <>
        <SymbolIcon sym="scatter" /> {r.reels.freeGames} Free Games!
        {r.scatterWin > 0 && ` +${formatMoney(r.scatterWin)}`}
      </>
    );
  }
  if (line) {
    return (
      <>
        Line {line.line + 1} : {line.count}{' '}
        <span className="status-sym" role="img" aria-label={SYMBOL_NAMES[line.sym]}>
          <SymbolIcon sym={line.sym} />
        </span>{' '}
        pays {creditLabel(line.pay, r.credits)}
      </>
    );
  }
  // When Free Games end, "FEATURE COMPLETE" shows above BET, so the status line just shows the lines.
  if (freeGames && freeGames.left > 0) {
    return (
      <>
        Free Games: {freeGames.played} of {freeGames.played + freeGames.left} played
      </>
    );
  }
  return linesLabel;
}
