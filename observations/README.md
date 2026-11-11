# Prize observations

Values seen on the real Spooky Link Go Ghost machine, used to fit the game's gem and bonus prize tables.

Each row of [prizes.csv](prizes.csv) is one gem, coin or diamond you saw:

| Column        | What to put                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `denom`       | The denomination in dollars: `0.01`, `0.02`, `0.05`, `0.1`, `1` or `2`. Blank if unknown.                                                                                                                                     |
| `bet_credits` | The total bet in credits at the time (the BET meter in credits, e.g. `100`). Blank if unknown.                                                                                                                                |
| `kind`        | `gem` (on the reels), `coin` or `diamond` (bonus board), `boosted` (a Go Ghost boosted value; not counted), or `seen-gem`, `seen-coin`, `seen-diamond` (a value known to exist, but not a counted sample; listed separately). |
| `value`       | The number on it as shown, or the jackpot name: `mini`, `minor`, `maxi`, `major`, `grand`.                                                                                                                                    |
| `unit`        | `credits`, `dollars`, or `name` for a jackpot name.                                                                                                                                                                           |
| `mult`        | Only if you know the multiple of the total bet but not the bet: e.g. `1.5`. Leave blank otherwise.                                                                                                                            |
| `note`        | Anything useful. No commas.                                                                                                                                                                                                   |

A Mo' Symbols double (two values on one square) is two rows. Record every gem or coin you can see, not just the interesting ones, or the frequencies will be skewed.

## Tally

```
npm run tally                 # gems, then bonus coins and diamonds
npm run tally -- --by-bet     # also split by denomination and bet
```

It converts each row to a multiple of the bet, counts them, and prints the share of each value and a ready-to-paste weight table for `src/engine/config.ts`. It warns when there are too few rows to trust (under 100). The odds are said to change with the bet multiplier and denomination, so use `--by-bet` once there is enough data to see whether they do.
