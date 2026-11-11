import gregFace from '../assets/faces/greg.png';

/**
 * Greg: his face, with a white edge and a red glow. With no `size` he fills his box; a
 * `size` (any CSS length, e.g. "1.2em" in a line of text) is set as a style, because the
 * width and height attributes only take whole pixels ("1.2em" would read as 1px).
 */
export function Greg({ size, title = 'Greg' }: { size?: number | string; title?: string }) {
  return size === undefined ? (
    <img src={gregFace} width="100%" height="100%" alt={title} className="greg-art" />
  ) : (
    <img src={gregFace} style={{ width: size, height: size }} alt={title} className="greg-art" />
  );
}
