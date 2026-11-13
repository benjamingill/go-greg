import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { THEME_NAME } from './themes';
import './theme.css';
import './app.css';

// The theme's own colours (slots.css) hang off this.
document.documentElement.dataset.theme = THEME_NAME;

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing the #root element');

// Every image in assets, as the URLs Vite gives them (the same ones the components
// import, so the browser serves them from cache once they're used).
const images = Object.values(
  import.meta.glob<string>('./assets/**/*.png', { eager: true, query: '?url', import: 'default' }),
);

/**
 * Downloads and decodes everything the game draws (every image, and the Fredoka font), so
 * nothing pops in or flickers the first time it shows. A file that fails doesn't hold the
 * game up. Fills the loading screen's bar (in index.html) as each one is ready.
 */
function preload(): Promise<void> {
  const bar = document.getElementById('loading-progress');
  const total = images.length + 1;
  let done = 0;
  const settle = () => {
    done++;
    if (bar) bar.style.width = `${(done / total) * 100}%`;
  };
  const image = (src: string) => {
    const img = new Image();
    img.src = src;
    return img.decode().catch(() => {});
  };
  return Promise.all([
    ...images.map((src) => image(src).then(settle)),
    document.fonts
      .load('700 1em Fredoka')
      .catch(() => {})
      .then(settle),
  ]).then(() => {});
}

preload().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
