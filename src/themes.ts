/**
 * Themes: the same game with different art. Pick one with ?theme=<name> in the address
 * (for example ?theme=kittens); with none, or a name that isn't here, the game looks as
 * it always has. A theme is read once, when the page loads.
 */
import backdrop from './assets/backdrop.jpg';
import breadsticks from './assets/breadsticks.png';
import coffee from './assets/coffee.png';
import coinCrate from './assets/coin-crate.png';
import donut from './assets/donut.png';
import ben from './assets/faces/ben.png';
import greg from './assets/faces/greg.png';
import mike from './assets/faces/mike.png';
import scott from './assets/faces/scott.png';
import salad from './assets/salad.png';
import spaghetti from './assets/spaghetti.png';
import steak from './assets/steak.png';
import yard from './assets/themes/kittens/backdrop.jpg';
import kittenBen from './assets/themes/kittens/ben.png';
import bowl from './assets/themes/kittens/bowl.svg';
import box from './assets/themes/kittens/box.svg';
import fish from './assets/themes/kittens/fish.svg';
import kittenGreg from './assets/themes/kittens/greg.png';
import litterBox from './assets/themes/kittens/litter-box.png';
import kittenMike from './assets/themes/kittens/mike.png';
import mouse from './assets/themes/kittens/mouse.svg';
import paw from './assets/themes/kittens/paw.svg';
import kittenScott from './assets/themes/kittens/scott.png';
import yarn from './assets/themes/kittens/yarn.svg';

/** Everyone with a face in the game: Greg, the extras' namesakes, and Ben on the help page. */
export type Person = 'greg' | 'scott' | 'mike' | 'ben';

/** The five picture symbols (the engine's names for them; a theme draws and names them its own way). */
export type Picture = 'salad' | 'donut' | 'steak' | 'breadsticks' | 'spaghetti';

export interface Theme {
  /** The game's title and the red extra's name ("Go Greg"). */
  goName: string;
  /** Each person's face picture, everywhere it's shown. */
  faces: Record<Person, string>;
  /** Each picture symbol's art and name (the name shows on the paytable and in the status line). */
  pictures: Record<Picture, { src: string; name: string }>;
  /** The WILD's picture (with "WILD" written over it), which is also the jackpot game's picks, and its name. */
  wild: { src: string; name: string };
  /** The chest of coins on each end of the banner bar (Free Games and Jackpot). */
  crate: string;
  /** The picture behind the jackpots, faces and gem heaps. */
  backdrop: string;
}

const THEMES = {
  default: {
    goName: 'Go Greg',
    faces: { greg, scott, mike, ben },
    pictures: {
      salad: { src: salad, name: 'Salad' },
      donut: { src: donut, name: 'Donut' },
      steak: { src: steak, name: 'Steak' },
      breadsticks: { src: breadsticks, name: 'Breadsticks' },
      spaghetti: { src: spaghetti, name: 'Spaghetti' },
    },
    wild: { src: coffee, name: 'coffee cup' },
    crate: coinCrate,
    backdrop,
  },
  /** Cartoon kittens for the faces, Go Kittens for Go Greg, kitten things for the pictures, a paw print for the WILD and the jackpot game's picks, a litter box of coins for the crates, and a sunny yard with a giant ball of yarn behind it all: Greg an orange tabby, Scott a grey tabby in glasses, Mike a tuxedo, Ben a calico. */
  kittens: {
    goName: 'Go Kittens',
    faces: { greg: kittenGreg, scott: kittenScott, mike: kittenMike, ben: kittenBen },
    pictures: {
      salad: { src: yarn, name: 'Yarn' },
      donut: { src: fish, name: 'Fish' },
      steak: { src: mouse, name: 'Toy mouse' },
      breadsticks: { src: bowl, name: 'Food bowl' },
      spaghetti: { src: box, name: 'Box' },
    },
    wild: { src: paw, name: 'paw print' },
    crate: litterBox,
    backdrop: yard,
  },
} satisfies Record<string, Theme>;

/** The theme named by ?theme= in the address, or the default. */
function fromAddress(): Theme {
  if (typeof window === 'undefined') return THEMES.default;
  const name = new URLSearchParams(window.location.search).get('theme')?.toLowerCase() ?? '';
  return Object.hasOwn(THEMES, name) ? THEMES[name as keyof typeof THEMES] : THEMES.default;
}

export const THEME: Theme = fromAddress();

/** The theme's name ("default", "kittens"), set on <html> as data-theme for its CSS (see slots.css). */
export const THEME_NAME =
  (Object.keys(THEMES) as (keyof typeof THEMES)[]).find((k) => THEMES[k] === THEME) ?? 'default';
