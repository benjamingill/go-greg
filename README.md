# Go Greg

A slot machine simulator modelled on Aristocrat's _Spooky Link: Go Ghost_, with its own names and art.

- [src/SPEC.md](src/SPEC.md): how the game works (rules, numbers, screens and flow).
- [src/spooky-link-go-ghost.md](src/spooky-link-go-ghost.md): the cabinet's rules, transcribed from its help screens. The game follows these.
- [src/TODO.md](src/TODO.md): what's left to match the real machine, and what we've decided not to build.
- [observations/](observations/README.md): prize values seen on the real machine, and the tally that turns them into prize weights.

## Development

```sh
npm install
npm run dev        # dev server
npm test           # unit tests, including the return (RTP) check
npm run typecheck
npm run lint       # Biome: lint, formatting, import order
npm run lint:fix   # apply safe fixes and formatting
npm run build
npm run tally      # tally observations/prizes.csv into prize weights
```

## CI and deploy

Pull requests run lint, typecheck, tests and a build. Pushes to `main` run the same checks and deploy to GitHub Pages.

## License

MIT
