# Go Ghost screenshot data

Observed spins of the Go Ghost slot, transcribed from screenshots in `~/Documents/go-ghost-screenshots`.

- `spins.csv` — one row per screenshot
- `analyze.py` — run `python3 research/go-ghost/analyze.py` to regenerate `summary.md`
- `summary.md` — per-reel symbol frequencies, stacking, wilds, gems, scatters, feature log

## spins.csv columns

| Column      | Meaning                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| idx         | Screenshot number in filename (time) order                                                             |
| time        | Screenshot time (24h, from filename)                                                                   |
| session     | A = 3:22–3:45 PM, B = 4:44–5:22 PM                                                                     |
| denom, bet  | Denomination and total bet in dollars. Credits bet = bet ÷ denom                                       |
| credit, win | Values on the meter (win is often captured mid-count; not reliable)                                    |
| screen      | `base`, `free` (free game spin), `spinning` (blurred, skip), `ghost_award`, `jackpot_pick`, `fg_award` |
| R1T … R5B   | Symbol at reel 1–5, row Top/Middle/Bottom. `?` = covered/unreadable                                    |
| gems        | `;`-separated `CELL:colour:value`, e.g. `R3M:red:250` or `R4B:blue:MINOR`                              |
| notes       | Free text: overlays, bet changes, feature triggers, credit jumps                                       |

Symbol codes: `J Q K A`, `CUF` cufflinks, `CHN` chandelier, `MIR` hand mirror, `BOOK`, `MAN` mustache man,
`WILD`, `GEM`, `FG` Free Games scatter, `GHOST`.

## Adding more screenshots

Append rows with the next `idx`, then re-run `analyze.py`. Use `screen=spinning` for blurred frames so they're
excluded from the reel statistics. Run `npx biome check --write research` afterwards so lint passes.

Add each new reel gem to `observations/prizes.csv` too and run `npm run tally` for the gem prize weights.
