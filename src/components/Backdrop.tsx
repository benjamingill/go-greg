import { THEME } from '../themes';

/**
 * The scene behind the jackpots, faces and gem heaps: the theme's backdrop picture (by
 * default, like the machine's night sky between dark walls with gold coins piled up). It
 * spans the full width at its own shape (see .features-scene).
 */
export function Backdrop() {
  return <img src={THEME.backdrop} alt="" className="features-scene" />;
}
