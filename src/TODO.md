# Go Greg – to do

Things we want to change to match the real machine.

## Needs more from the machine

### Features

- [ ] **Bonus coin and diamond prizes.** Reel gem prizes are fitted from 257 gems in `observations/prizes.csv`, but only 3 bonus coins and diamonds are logged, so their weights are guesses. Log bonus board values from photos and refit with `npm run tally`.
- [ ] **Lone FREE GAMES symbol odds.** Ours gives each lone symbol a 0.2% chance of starting Free Games (a guess). Need the real odds. 2 symbols can do it (screenshot 388 in `research/go-ghost`).
- [ ] **Go Greg boost rules.** Ours boosts 1 or more things Greg collects (coins inside him, and the diamonds he goes for), 17% of spins; with Mo' Spins, a boost can be spins. The odds, the amounts and the spin shares are guesses.

### Jackpots

- [ ] **$2 amounts.** Guessed from $1 (see Jackpot values in SPEC.md). Need a plaque photo at $2.

### Bets

- [ ] **Bet buttons per denomination.** Ours: 100–1,000 credits at 1¢ and 2¢, 50–500 from 5¢ up (see Bets in SPEC.md). Need the decks at 2¢, 5¢, 10¢ and $2 to confirm. Two bets of 200 credits were seen (at 10¢ and at $1), which would be BET × 4 on a 50-credit base; it's not on the 1¢ deck, so it isn't added. Check for a × 4 button.

## Not doing

- **Progressive jackpots.** On the cabinet, Grand, Major and Maxi are progressives shared by a bank of machines. This is a single-player game with no shared pool, so they stay at fixed amounts read off real cabinets. Skipped: the growing meters and their reset, the ceiling overflow, Mini and Minor odds changing with paylines, and jackpot odds differing in Free Games and Ghost features.
