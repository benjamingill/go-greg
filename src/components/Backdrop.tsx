import backdrop from '../assets/backdrop.jpg';

/**
 * The scene behind the faces and gem heaps, like the machine's night sky between dark
 * walls with gold coins piled up: a picture that covers the area, cropped to fit (see
 * .features-scene).
 */
export function Backdrop() {
  return <img src={backdrop} alt="" className="features-scene" />;
}
