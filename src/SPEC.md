# Go Greg – game spec

How the Go Greg slot machine works: rules, numbers, screens and flow. It follows the rules of Aristocrat's _Spooky Link: Go Ghost_ with its own names and art.

---

## 1. Money and betting

| Item             | Value                                      |
| ---------------- | ------------------------------------------ |
| Starting balance | $1,000 (can be reset from the help screen) |
| Denominations    | 1¢, 2¢, 5¢, 10¢, $1, $2                    |
| Default          | 1¢, 100 credits ($1.00)                    |
| Bet              | denomination × credits                     |

**Bet buttons**: five, following Aristocrat's ×1/×2/×3/×5/×10 pattern, on a base that depends on the denomination:

| Denom           | BET × 1 | BET × 2 | BET × 3 | BET × 5 | BET × 10 | Dollars        |
| --------------- | ------- | ------- | ------- | ------- | -------- | -------------- |
| 1¢, 2¢          | 100     | 200     | 300     | 500     | 1,000    | $1–$10, $2–$20 |
| 5¢, 10¢, $1, $2 | 50      | 100     | 150     | 250     | 500      | 5¢: $2.50–$25  |

✓ The 1¢ deck reads BET × 1 / 100 CREDITS up to × 10 / 1000. Every bet seen at 5¢, 10¢ and $1 (50, 100, 150, 250 and 500 credits at $1) fits the 50-credit base. 2¢ is from two bets ($2.00 and $4.00), which fit the 100-credit base; $2 is a guess.

- Changing the denomination keeps the bet button: ×3 at 1¢ (300 credits) becomes ×3 at 5¢ (150 credits).
- The bet and denomination can't change during a spin, a feature, or Free Games.
- Line pays are multiples of the **line bet** (the bet ÷ lines played). Everything else (Free Games prizes, the Greg Bonus, gems, jackpots) is a multiple of the **total bet**.
- A spin costs the bet; free spins cost nothing.

---

## 2. Base game

### Reels

- 5 reels × 3 rows. **50 paylines** at 1¢ and 2¢, **25** at 5¢ and 10¢, and **5** at $1 and $2 (a game with n lines uses the first n). The status line shows "_n_ LINES" when it has nothing else to show.
- Each square is drawn independently by weight (no physical reel strips).
- **Greg** and **Free Games** can appear at most once per reel.

### Symbols

| Symbol      | Shown as                                             | Where       | Notes                               |
| ----------- | ---------------------------------------------------- | ----------- | ----------------------------------- |
| Salad       | salad bowl picture                                   | all reels   |                                     |
| Donut       | frosted donut with sprinkles picture                 | all reels   |                                     |
| Steak       | T-bone steak picture                                 | all reels   |                                     |
| Breadsticks | breadsticks basket picture                           | all reels   |                                     |
| Spaghetti   | spaghetti and meatballs picture                      | all reels   |                                     |
| A, K, Q, J  | letters                                              | all reels   | low paying                          |
| WILD        | the word "WILD"                                      | all reels   | substitutes for paying symbols only |
| FREE GAMES  | the words "FREE GAMES"                               | all reels   | scatter                             |
| Greg        | drawn character                                      | reel 1 only | starts the Greg Bonus with a gem    |
| Gem         | coloured cut gem with a credit value or jackpot name | all reels   | green, red or blue, equally likely  |

### Reel weights (chance per square = weight ÷ reel total)

Weights are roughly percent of squares. The paying symbols, WILD and gem match 397 real base-game spins (research/go-ghost): royals show more than pictures, J most of all, and each picture stands in for one of the machine's five (cufflinks, chandelier, mirror, book, mustache man, about 7.9% each). FREE GAMES and Greg are unchanged guesses.

| Symbol      | Reel 1 | Reels 2–5 | Reels 2–5 when Greg is on reel 1 |
| ----------- | ------ | --------- | -------------------------------- |
| Salad       | 7.9    | 7.9       | 7.9                              |
| Donut       | 7.9    | 7.9       | 7.9                              |
| Steak       | 7.9    | 7.9       | 7.9                              |
| Breadsticks | 7.9    | 7.9       | 7.9                              |
| Spaghetti   | 7.9    | 7.9       | 7.9                              |
| A           | 10.9   | 10.9      | 10.9                             |
| K           | 10.5   | 10.5      | 10.5                             |
| Q           | 10.9   | 10.9      | 10.9                             |
| J           | 17.2   | 17.2      | 17.2                             |
| WILD        | 4.9    | 4.9       | 4.9                              |
| FREE GAMES  | 2.55   | 2.55      | 2.55                             |
| Greg        | 0.85   | –         | –                                |
| Gem         | 4.4    | 4.4       | 11.8                             |

Reel 1 is drawn first. If Greg lands on it, reels 2–5 use the last column, so gems are more likely when Greg is showing.

**Free Games reels** are the same except WILD is **19.6** on every reel (about 17% of squares, as seen on the machine, against 4.9% on paid spins).

### Paylines

The row each line uses on reels 1–5 (Top, Mid, Bot), numbered as on the machine's win-lines screen (read from a photo of it by sampling each cell's colour).

| Line | Reel 1 | Reel 2 | Reel 3 | Reel 4 | Reel 5 |
| ---- | ------ | ------ | ------ | ------ | ------ |
| 1    | Mid    | Mid    | Mid    | Mid    | Mid    |
| 2    | Top    | Top    | Top    | Top    | Top    |
| 3    | Bot    | Bot    | Bot    | Bot    | Bot    |
| 4    | Top    | Mid    | Bot    | Mid    | Top    |
| 5    | Bot    | Mid    | Top    | Mid    | Bot    |
| 6    | Top    | Top    | Mid    | Bot    | Bot    |
| 7    | Bot    | Bot    | Mid    | Top    | Top    |
| 8    | Mid    | Top    | Mid    | Bot    | Mid    |
| 9    | Mid    | Bot    | Mid    | Top    | Mid    |
| 10   | Top    | Mid    | Mid    | Mid    | Top    |
| 11   | Bot    | Mid    | Mid    | Mid    | Bot    |
| 12   | Mid    | Top    | Top    | Mid    | Bot    |
| 13   | Mid    | Bot    | Bot    | Mid    | Top    |
| 14   | Mid    | Mid    | Top    | Mid    | Bot    |
| 15   | Mid    | Mid    | Bot    | Mid    | Top    |
| 16   | Top    | Top    | Mid    | Bot    | Mid    |
| 17   | Bot    | Bot    | Mid    | Top    | Mid    |
| 18   | Mid    | Top    | Mid    | Bot    | Bot    |
| 19   | Mid    | Bot    | Mid    | Top    | Top    |
| 20   | Top    | Top    | Top    | Mid    | Bot    |
| 21   | Bot    | Bot    | Bot    | Mid    | Top    |
| 22   | Top    | Mid    | Bot    | Bot    | Bot    |
| 23   | Bot    | Mid    | Top    | Top    | Top    |
| 24   | Top    | Mid    | Top    | Mid    | Top    |
| 25   | Bot    | Mid    | Bot    | Mid    | Bot    |
| 26   | Top    | Mid    | Mid    | Mid    | Bot    |
| 27   | Bot    | Mid    | Mid    | Mid    | Top    |
| 28   | Mid    | Top    | Top    | Top    | Mid    |
| 29   | Mid    | Bot    | Bot    | Bot    | Mid    |
| 30   | Top    | Mid    | Top    | Mid    | Bot    |
| 31   | Bot    | Mid    | Bot    | Mid    | Top    |
| 32   | Top    | Mid    | Bot    | Bot    | Mid    |
| 33   | Bot    | Mid    | Top    | Top    | Mid    |
| 34   | Top    | Mid    | Bot    | Mid    | Mid    |
| 35   | Bot    | Mid    | Top    | Mid    | Mid    |
| 36   | Mid    | Bot    | Mid    | Bot    | Mid    |
| 37   | Mid    | Top    | Mid    | Top    | Mid    |
| 38   | Top    | Mid    | Bot    | Mid    | Bot    |
| 39   | Bot    | Mid    | Top    | Mid    | Top    |
| 40   | Top    | Top    | Mid    | Top    | Top    |
| 41   | Bot    | Bot    | Mid    | Bot    | Bot    |
| 42   | Top    | Top    | Mid    | Mid    | Bot    |
| 43   | Bot    | Bot    | Mid    | Mid    | Top    |
| 44   | Top    | Mid    | Mid    | Bot    | Bot    |
| 45   | Bot    | Mid    | Mid    | Top    | Top    |
| 46   | Mid    | Mid    | Top    | Mid    | Mid    |
| 47   | Mid    | Mid    | Bot    | Mid    | Mid    |
| 48   | Mid    | Top    | Mid    | Mid    | Bot    |
| 49   | Mid    | Bot    | Mid    | Mid    | Top    |
| 50   | Top    | Mid    | Mid    | Bot    | Mid    |

### Paytable (multiples of the line bet)

✓ = proven from a real Go Ghost machine. On the machine, all five pictures pay alike for 3 and 4 of a kind (all five proven for 3), and A, K, Q and J pay alike (a ✓ on a royal means that symbol was proven). The five-picture (75×) and WILD (10×, 40×, 100×) pays come from the cabinet's help screen (spooky-link-go-ghost.md), which lists pays in credits at 2 credits per line, so each figure there is twice the line-bet multiple.

| Symbol      | 5     | 4    | 3     |
| ----------- | ----- | ---- | ----- |
| Salad       | 75 ✓  | 25 ✓ | 7.5 ✓ |
| Donut       | 75 ✓  | 25 ✓ | 7.5 ✓ |
| Steak       | 75 ✓  | 25 ✓ | 7.5 ✓ |
| Breadsticks | 75 ✓  | 25 ✓ | 7.5 ✓ |
| Spaghetti   | 75 ✓  | 25 ✓ | 7.5 ✓ |
| A           | 50    | 15 ✓ | 5 ✓   |
| K           | 50    | 15 ✓ | 5 ✓   |
| Q           | 50 ✓  | 15 ✓ | 5 ✓   |
| J           | 50 ✓  | 15 ✓ | 5 ✓   |
| WILD        | 100 ✓ | 40 ✓ | 10 ✓  |

On 25 lines that's 0.3×, 1× and 3× the total bet for pictures, and 0.2×, 0.6× and 2× for royals; on 5 lines, five times as much.

Proof (at 5¢, 25 lines, 50-credit bet, so 2 credits per line, unless noted). Some proofs below give the 25-line total-bet multiple:

- **3 × J = 0.2×**: the status line read "LINE 7 : 3 J PAYS 10" (10 credits).
- **4 × A = 0.6×**: the status line read "LINE 1 : 4 A PAYS 30" (30 credits).
- **3 × Q = 0.2×**: the status line read "LINE 4 : 3 Q PAYS 10" and "LINE 22 : 3 Q PAYS 10" (10 credits each).
- **4 × J = 0.6×**: the status line read "LINE 7 : 4 J PAYS 30" (30 credits).
- **3 × K = 0.2×**: at $2 on 5 lines (10 credits per line), "LINE 3 : 3 K PAYS 50" (5× the line bet; K, K, WILD).
- **4 × K = 0.6×**: at 10¢ on 25 lines with a $50 bet (20 credits per line), "LINE 12 : 4 K PAYS 300" and "LINE 20 : 4 K PAYS 300" (15× the line bet; WILD, WILD, WILD, K).
- **5 × Q = 2×**: at $2 on 5 lines (10 credits per line), "LINE 4 : 5 Q PAYS 500" (50× the line bet; Q, WILD, WILD, Q, Q).
- **4 × Q = 0.6×**: at $2 on 5 lines (10 credits per line), "LINE 1 : 4 Q PAYS 150" (15× the line bet; Q, WILD, Q, Q).
- **3 × A = 0.2×**: at 1¢ on 50 lines (6 credits per line), six lines each read "3 A PAYS 30" (5× the line bet, which is 0.2× the total bet on 25 lines).
- **Pictures, 3 = 0.3×, 4 = 1×**: three chandeliers, books and magnifying glasses each read "PAYS 15", and four chandeliers and books paid 25× the line bet (e.g. "LINE 24 : 4 chandeliers PAYS 50"). The machine's pictures are a man, chandelier, book, magnifying glass and cufflinks; all five pay alike. Three cufflinks: "LINE 5 : 3 cufflinks PAYS 45" at $2 on 5 lines (6 credits per line = 7.5× the line bet). Three men: "LINE 3 : 3 men PAYS 75" at $2 on 5 lines (10 credits per line = 7.5×). Four cufflinks: "LINE 5 : 4 cufflinks PAYS 500" at $1 on 5 lines (20 credits per line = 25×).
- **5 × J = 2×**: the status line read "LINE 10 : 5 J PAYS 100" (100 credits); also "LINE 4 : 5 J PAYS 300" at $2 on 5 lines (6 credits per line = 50× the line bet), "LINE 46 : 5 J PAYS 1000" at 1¢ on 50 lines (20 credits per line = 50×), and "LINE 2 : 5 J PAYS 200" at 1¢ on 50 lines with a $2 bet (4 credits per line = 50×; WILD on reel 1, then four J).

- Wins pay left to right on adjacent reels, starting from reel 1.
- Only the highest win pays on each line; wins on different lines add up.
- Wilds stand in for any paying symbol, including at the start of a line. Each line pays its best reading: a run of wilds from reel 1 also pays as WILD (10×, 40×, 100× the line bet for 3, 4, 5), so five wilds pay 100×, more than five salads.
- Gems on the base reels pay nothing by themselves. Their value is only paid if the Greg Bonus starts.

---

## 3. Free Games

- **Trigger**: 3 or more FREE GAMES symbols anywhere awards **6 free games** ✓ plus an instant prize:

  | FREE GAMES symbols | 3    | 4   | 5   |
  | ------------------ | ---- | --- | --- |
  | Prize              | 2× ✓ | 10× | 50× |

  ✓ proven: 3 FREE GAMES symbols (on reels 1, 3 and 5) showed "SCATTER PAYS 100" at 5¢ on a 50-credit bet, then "6 FREE GAMES AWARDED". The rest are guesses.

- **Lone symbols**: the cabinet's rules say any FREE GAMES symbol may also trigger 6 free games plus the 3-symbol prize (2×) by chance. With 1 or 2 symbols on the screen, each has a **0.2%** chance (a guess; the machine's isn't known).
- Free spins play at the bet that started them, with the same paytable, on the Free Games reels (many more WILDs; see Reel weights), FREE GAMES symbols included. Free Games **retrigger**: 3 or more symbols (or a lone symbol's chance) during a free game add 6 more games and the same prize. WILDs and gems land (✓ seen on the machine) and so does Greg: the Greg Bonus can start during Free Games (✓ confirmed on the machine) the same way as on a paid spin, and Free Games carry on after it. Any WILD can start the jackpot game during Free Games too.
- **Start splash**: once the spin that awards them has finished (after any Greg Bonus or jackpot game on it), a sign covers the reels: the number of games in gold in a red medallion with a gold frame, over a red scroll with a gold border reading "FREE GAMES / AWARDED" in gold and "PRESS SPIN TO START FEATURE" under it. It waits for Spin, which starts the first free game. A retrigger during Free Games has no sign: the status line reads "6 Free Games!" and the SPINS LEFT count goes up.
- **Look**: the reels turn purple, and a "_n_ SPINS LEFT" box (number on the left) takes the place of the crest in the middle of the banner bar above the reels, through the last free game's result. The reels keep their height.
- Spin reads **Free spin** (the spins left show only in the banner). When they finish, "FEATURE COMPLETE" shows at the far right of the bar and the status line shows the lines played.

---

## 4. Greg Bonus

### Starting it

- **Greg on reel 1 + at least one gem** anywhere.
- Without Greg, each gem colour on the screen has its own **0.5%** chance to start its own extra (a guess), so a screen with several colours usually starts just one, and sometimes two or all three together.
- With Greg, each gem colour present turns on an extra. Either way the extras combine (up to all three), and every gem on the screen turns into a diamond, whichever colours started it:

| Gem   | Extra           | What it does                                                                                                                                                                                                                                                                                                                                                                          |
| ----- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green | **Mo' Spins**   | A coin or diamond's prize has a 12% chance to be **+1 Spin** instead of cash or a jackpot (✓ seen: a coin showing "+1 SPIN" where its value goes). The spin is added when Greg collects it; a +1 Spin item pays no cash.                                                                                                                                                              |
| Red   | **Go Greg**     | The board is **8 tall × 5 wide** instead of 5×5, so Greg can grow past 5×5. Each spin, 17% of the time **1 or more** of the things Greg collects (coins inside him, and the diamonds he goes for) get a **boost** (see below).                                                                                                                                                        |
| Blue  | **Mo' Symbols** | Before each spin, **5 squares** (**8** with Go Greg) are picked at random. A coin or diamond that lands on one is a **double**: it carries two prizes instead of one, counts as **two diamonds** towards Greg's growth, and shows as two smaller diamonds or coins overlapping on a diagonal (top-left and bottom-right), each with its own value (✓ seen: 750 + MINOR, 2500 + 2500). |

Go Greg boosts: on a spin that has one, one thing Greg collects is picked at random, and each other thing he collects has a 25% chance to get one too. A boost is 1–50× the bet (by weight: 1 (30), 2 (25), 3 (18), 5 (14), 10 (8), 20 (4), 50 (1)). With Mo' Spins too, a boost is 25% of the time **+1 spin** (70) or **+2 spins** (30) instead of cash, added to the item (a +1 Spin item then reads +2 or +3 SPINS; a cash item gets a "+1 spin" tag), so an item can add +1, +2 or +3 spins. The 17%, 25% and spin shares are guesses; the 17% keeps the return between 90% and 95% (see section 7).

### The board

- **5 wide × 5 tall**, or **5 wide × 8 tall** with Go Greg.
- Empty squares show a dimmed normal reel symbol, randomly chosen each spin.
- The bonus starts with **5 spins**.

### Start

1. The gems that started the bonus stay where they landed on the reels (same reel and row, taking the board's top three rows; a guess) and become **diamonds**. Their prizes are paid.
2. Greg appears **2×2** at a random spot that doesn't cover any of them.
3. Greg moves to claim each starting diamond (see _Greg's moves_). Each one fills a diamond slot, and he can grow before the first spin.

### Each spin

1. Every square spins, then the columns stop one at a time from the left. Each square independently gets:
   - a **diamond** 2.42% of the time (never on Greg's squares, and none once Greg fills the board),
   - a **coin** 2.42% of the time,
   - otherwise nothing.

   With Mo' Symbols, 5 squares (8 with Go Greg) were picked before the spin, and a coin or diamond on one of them is a double.
2. **Coins inside Greg** are collected and **blasted away**: once the squares have all landed, each one's value flies up to the banner total (the total and the WIN meter go up as it lands) and any "+1 SPIN" to SPINS LEFT. Coins outside him stay, dimmed, and pay nothing.
3. **Greg's moves**: he goes after every diamond that landed, **nearest first**. For each, he slides the shortest way across and/or up or down until it's inside him, and claims it. The diamond is blasted away: its value flies up to the banner total first (the total and the WIN meter go up as it lands), and any "+1 SPIN" flies to SPINS LEFT at the same time, then the diamond flies to the sidebar and fills the next diamond slot. All diamonds are paid. If no diamonds land, Greg stays put.
4. The moment a claimed diamond fills the slots for his current size, he **grows** (keeping his spot, shifting only to stay on the board) and gains spins, before going after the next diamond. Diamonds he claims after that fill the new size's slots.

### Growth

| Total diamonds | Greg | Extra spins                                | Board                          |
| -------------- | ---- | ------------------------------------------ | ------------------------------ |
| start          | 2×2  | –                                          | both                           |
| 5 ✓            | 3×3  | +3 ✓                                       | both                           |
| 9 ✓            | 4×4  | +2 ✓                                       | both                           |
| 12 ✓           | 5×5  | +1 on the 5×5 board, +2 ✓ on the 8×5 board | both (fills the 5×5 board)     |
| 15 ✓           | 6×5  | +1 ✓                                       | Go Greg only                   |
| 18 ✓           | 7×5  | +1 ✓                                       | Go Greg only                   |
| 21 ✓           | 8×5  | +1 ✓                                       | Go Greg only (fills the board) |

Sizes are rows × columns, as the machine labels them. ✓ = proven: on the machine's 8×5 board, 5 diamond slots led from 2X2 to 3X3, growing to 3×3 added 3 spins, at 3×3 there were 4 diamond slots to 4×4, growing to 4×4 added 2, at 4×4 there were 3 diamond slots to 5×5, growing to 5×5 added 2, at 5×5 there were 3 diamond slots to 6×5, at 6×5 and at 7×5 there were 3 diamond slots to the next size, and growing to 6×5, 7×5 and 8×5 each added 1.

### Coin and diamond prizes (bonus board)

| Prize           | Weight |
| --------------- | ------ |
| 0.5×            | 42.106 |
| 1×              | 28.709 |
| 2×              | 12.44  |
| 2.5× ✓          | 5      |
| 3×              | 5.404  |
| 5×              | 3.152  |
| 10×             | 1.801  |
| 20×             | 0.72   |
| 50×             | 0.225  |
| 100×            | 0.072  |
| Mini jackpot    | 0.7    |
| Minor jackpot ✓ | 0.2    |

✓ = seen on the machine: a diamond and a coin on its bonus board each showed "MINOR" (in the same purple as on reel gems), and a coin showed 2.5× ($250 at a $100 bet). The weights are guesses: the 2.5× weight is a guess, and the others were scaled down so the table's total weight and average prize stay as they were.

### Ending

The bonus ends when spins run out. Spin reads **Collect**. If the jackpot game also triggered on the same spin, it follows.

---

## 5. Gem prizes (base reels)

What a gem shows when it lands, by weight (per 100 gems):

| Prize | Weight | Prize | Weight |
| ----- | ------ | ----- | ------ |
| 0.5×  | 19.305 | 6×    | 1.544  |
| 1×    | 23.938 | 10×   | 2.317  |
| 1.5×  | 7.722  | Mini  | 2.703  |
| 2×    | 8.88   | Minor | 2.703  |
| 2.5×  | 3.861  | Maxi  | 0.473  |
| 3×    | 3.475  | Major | 0.095  |
| 4×    | 3.475  | Grand | 0.024  |
| 5×    | 18.919 |       |        |

Cash, Mini and Minor are from 259 reel gems seen on the machine (observations/prizes.csv, `npm run tally`). None showed more than 10×. Maxi, Major and Grand are worked out from Mini and Minor: each is as rare as it is big, so each adds the same to a gem's average value as the average of Mini and Minor (2.703 × 10 and 2.703 × 25, averaged, ÷ the jackpot's multiple). The few Maxi and Major gems seen came from big bets, where the machine raises the odds of its progressives; here jackpots are multiples of the bet, so their odds are the same at every bet.

On the reels, cash values show in **credits** (multiple × credits bet), or in dollars when the meters are switched to currency; jackpots show their name. At most one Grand shows on the gems in a spin: once one has landed, the other gems are drawn from this table without the Grand.

---

## 6. Jackpots and the jackpot game

### Jackpot values (fixed dollars at each denomination)

Like the cabinet, each jackpot is a fixed amount at each denomination and is **not multiplied by the bet multiplier**: the plaques change only when the denomination does.

| Denom | Mini   | Minor  | Maxi    | Major     | Grand     |
| ----- | ------ | ------ | ------- | --------- | --------- |
| 1¢    | $15    | $30    | $885    | $2,700    | $9,350    |
| 2¢    | $30    | $60    | $539.38 | $1,533.63 | $8,063.40 |
| 5¢    | $75    | $150   | $2,957  | $10,038   | $41,049   |
| 10¢   | $150   | $300   | $2,957  | $10,038   | $41,049   |
| $1    | $1,000 | $2,000 | $5,242  | $15,189   | $80,802   |
| $2    | $2,000 | $4,000 | $5,242  | $15,189   | $80,802   |

✓ Read off real cabinets at 100-credit bets: 1¢ (all five), 5¢ and 10¢ (all five, one shared set of progressive meters), 2¢ (all five, on a different machine from 1¢), and $1 (all five). Minor is always 2× Mini. The $2 row is a guess. On the cabinet, Grand, Major and Maxi are progressives shared by a bank of machines; here they stay at the amounts seen (there's no shared pool to build them), shared by 5¢–10¢ and $1–$2.

**Odds rise with the wager** ("an increase in wager increases the odds of winning progressives proportionally"): each jackpot's chance is in proportion to the dollar amount bet, scaled so it adds as much to the return as a prize of 10× (Mini), 25× (Minor), 100× (Maxi), 500× (Major) or 2,000× (Grand) the bet would at the odds in sections 4–6. That covers jackpot gems, Mini and Minor coins and diamonds, and the jackpot game (both how often it starts and which jackpot it's won on). When jackpots get likelier, the cash prizes make room, so at big bets (where Mini is only a few bets) more gems are jackpots and fewer are cash.

Jackpots can also be won from gems and from bonus coins/diamonds.

### Jackpot game

- **Trigger**: every WILD on the screen has its own **0.25%** chance (1 in 400) to start it.
- 15 coffee cups. Pick cups one at a time; each shows a jackpot name. The first jackpot to show **3 times** is won.
- The winner is decided when the game starts; picks only reveal it. Chance of each:

| Mini | Minor | Maxi | Major | Grand |
| ---- | ----- | ---- | ----- | ----- |
| 60%  | 28%   | 9%   | 2.5%  | 0.5%  |

- **Screen** (fills the reel area): a purple panel with a "MATCH **3** JACKPOTS TO WIN" banner (the 3 in green) over a 5 × 3 grid of coffee cups. A picked cup shows only the jackpot name, in its colour: MINI red-orange, MINOR purple, MAXI blue, MAJOR yellow-green, GRAND gold. The status line reads "TOUCH [cup] TO REVEAL".
- Once won, the banner reads "YOU'VE WON!", the three matching names stay lit, every other revealed name dims to dark blue, and unpicked cups stay as they are. The status line reads "Jackpot!", then Spin reads **Collect**.
- 1.5 s later an overlay comes up over the board: the jackpot name, big, in its colour, over a red scroll reading "JACKPOT AWARDED / [amount]" (jackpots are shown in currency, not credits, like "$1,500.00"). It stays until Collect.

---

## 7. Odds and return

|                                  | Value                                            |
| -------------------------------- | ------------------------------------------------ |
| Greg shows                       | 1 in 40 spins                                    |
| Greg comes with a gem            | 75% of the time                                  |
| A gem shows (spins without Greg) | 49%                                              |
| Greg Bonus                       | 1 in 44 paid spins (some come during Free Games) |
| Free Games                       | 1 in 229 spins                                   |

| Return from       | % of amount bet |
| ----------------- | --------------- |
| Line wins         | 31.4            |
| Greg Bonus        | 51.8            |
| Jackpot game      | 9.0             |
| Free Games prizes | 1.0             |
| **Total**         | **93.2**        |

Measured over 5 million paid spins (and the free spins they award) with the current values. The return should stay between 90% and 95%, and the RTP test checks that.

---

## 8. Screen layout

The machine fills the screen height with no scrolling.

### Cabinet top

- **Jackpot plaques**, one row: Minor, Major, **Grand** (largest, centre), Maxi, Mini. Like the machine's, each name sits on its plaque's top border (centred, half above it, outlined in black), which saves a line of height. Each shows its fixed dollar value at the current denomination (it doesn't change with the bet button); whole amounts drop ".00".
- **Three gem heaps** (mounds of gems, like the machine's gem piles under its knights): green **Mo' Spins**, red **Go Greg**, blue **Mo' Symbols**. During the bonus intro and bonus, extras in play glow and the others dim. Above each label is a head cutout for the extra (Scott for Mo' Spins, Greg for Go Greg, Mike for Mo' Symbols), outlined in white with a glow in the gem's colour. They are as tall as the screen has room for: none on a short screen, up to 80px on a tall one (the window height minus 640px, at most 80px).
- **Backdrop** behind the jackpot plaques, faces and heaps, like the machine's night sky between dark walls with gold coins piled up: a picture (`assets/backdrop.jpg`) of a starry sky between dark red stone walls, a steaming takeaway cup in the middle, green, red and blue flames, and heaps of gold coins. It spans the cabinet's full width at its own shape, pinned to the top of the cabinet. It's hidden during the Greg Bonus, with the heaps.
- **Banner bar**: a solid red bar across the top of the reels, in front of the gem heaps, with a coin crate on each end and "FREE GAMES" (left) and "JACKPOT" (right) across the crates, like the machine's (which has a gold ornament in the middle of its bar).
- During the Greg Bonus (and its start splash) the gem heaps and banner are hidden so the board can use their space.

### Centre

The reels, or the Greg Bonus screen, or the jackpot game.

### Control panel

- **Red meter bar**: MENU | CREDIT | WIN (with a one-line status message above it) | BET | denomination button.
  - "BONUS REELS IN PLAY" shows just under the denomination button during the Greg Bonus and Free Games.
  - "FEATURE COMPLETE" shows at the top-right corner of the bar (over the denomination button) once a special game is over (seen with "50 LINES" above WIN at the same time).
  - The CREDIT, WIN and BET meters show **credits** (whole numbers, no comma, like "8520") by default. Touching any of the three switches all of them to dollars with cents, and back; the choice is saved on the device. Labels sit above the black displays.
  - CREDIT doesn't include winnings the screen hasn't revealed yet.
  - WIN glows when the win is 20× the bet or more.
- **Button row**: the five bet buttons ("BET × n / credits / CREDITS"; the current one lit), then **Spin** on the right. A bet button sets that bet and plays the spin at once. While something is showing (a spin, a feature, Free Games) it keeps the bet and does what Spin does, and is disabled whenever Spin is.
- **Denomination picker**: a pop-up with six square buttons in one row. It only closes by picking one.

### Greg Bonus screen

- Header: the three extras tags (lit if in play) and a red banner with the running bonus total in credits ("_n_ CREDITS").
- Status line: "GOOD LUCK" while the squares spin and Greg moves, "PRESS SPIN TO SPIN" while it waits for a press, blank once Spin reads Collect.
- The board, then a **diamond-slot column** (empty slots between Greg's current size and the next, filling **from the bottom**), then a **size ladder** (2×2 at the bottom up to 5×5 or 8×5) with a **SPINS LEFT** box under it (big number on the left, "SPINS / LEFT" beside it).
  - SPINS LEFT drops by one as the squares start spinning, then goes up as each "+1 SPIN" is collected (a coin's once the squares have all landed, as it flies from the coin into SPINS LEFT while the coin blasts; a diamond's as it flies from the square into SPINS LEFT) and as he grows.
  - The ladder shows a big Greg at his current size, and sizes already passed stay lit with a smaller Greg.
  - Once Greg fills the board, the diamond column and ladder are replaced by an "ALL [coin] PAYS" panel; the SPINS LEFT box stays.
- Board squares are black with a slight edge, each showing a normal reel symbol in dark grey (the machine's are dark purple). Greg is drawn solid over the squares, filling his glowing gold box; coins and diamonds are drawn on top of him.
- A coin or diamond fills its square, with its value written across the middle of it.
- Jackpot names on coins, diamonds and reel gems are written in their own colour, whatever the gem: MINI red-orange, MINOR purple, MAXI blue, MAJOR yellow-green (✓ seen on gems), GRAND gold (as in the jackpot game; not seen on a gem). Cash values are white.
- Coin and diamond values show in credits, or in dollars ("$200") when the meters are switched to currency. The line-win messages stay in credits. A boosted value is written in gold instead of white, with the boost added in.

### Help screen (MENU)

Nine pages flipped with ◀ ▶, page dots, a **Return** button, and "Reset balance to $1,000". They follow the cabinet's help screens, in the game's own names, and leave out cabinet rules the game doesn't have (the progressive jackpots, and odds that change with the bet and denomination):

1. **Paytable**: pays as "×" multiples of the line bet, the WILD pays and substitution rule, the left-to-right pay rule (and its exceptions), and where Greg, coins and diamonds appear.
2. **Paylines**: the 50 lines drawn on small 5 × 3 grids, numbered, with lines 1–5 outlined and a note on how many lines play at each denomination.
3. **Greg Bonus**: the seven gem-colour combinations and the extras they award, random starts without Greg, gem prizes (at most one Grand), gems turning into diamonds, the 2×2 Greg, 5 starting spins, bonus reels.
4. **Greg Bonus: Play**: what is collected and when, the bonus prizes, and the growth tables for the 5×5 and 8×5 boards (built from the engine's growth steps).
5. **Bonus Extras**: Mo' Spins, Go Greg (with the spin prizes when combined with Mo' Spins) and Mo' Symbols.
6. **Free Games**: the 3/4/5 symbol prizes, a single symbol, retrigger, bonus reels, same bet.
7. **Jackpots**: the jackpot trigger and cups, no player influence, the five amounts at the current denomination, and that they aren't multiplied by the bet multiplier while their odds rise with the wager.
8. **Game Rules**: wins in credits except jackpots with the meter toggle, lines per denomination, bet buttons and Spin start play, played lines only, highest win per line, line wins and feature prizes added, gem prizes not affecting triggers, malfunction and the credits confirmation line.
9. **(no title)**: Greg's face with "GO GREG" under it, then Scott, Ben and Mike in a row with "MO' SCOTT", "MO' BEN" and "MO' MIKE" under them (white names outlined in orange).

The game shows state only. On-screen instructions appear only where the real machine shows them.

---

## 9. Flow and timing

1. **Spin**: the bet is taken and the whole result, features included, is settled immediately. The screen then plays it out.
2. **Reels**: all spin downward. Reel 1 stops after 450 ms, then one more every 450 ms. Pressing Spin stops them at once.
3. **Wins**: winning squares are outlined in gold (not filled). First every winning square lights up at once (status line blank) for 1.2 s, then the winning lines light up one at a time, every 1.2 s, looping. Each line shows "LINE n : count [symbol] PAYS x" in the status line, with the pay in credits.
4. **Feature intro**:
   - Greg Bonus: the bonus board shows with a splash over it: Greg with confetti, "YOU'VE WON", a plaque for each extra in play (joined by a gold "+" when there's more than one), and "PRESS SPIN TO START FEATURE". Under each name: green "FEATURING [diamond +1 SPIN] AND [coin +1 SPIN]", red "FEATURING EXTRA ROWS AND RANDOM PRIZE BOOST" (in pink, with "PRIZE BOOST" in gold), blue "FEATURING [diamonds] AND [coins]". It waits for Spin.
   - Jackpot game: "Jackpot game!" in the status line for 1.4 s.
5. **Greg Bonus**: each Spin press spins the squares; the columns stop one at a time (see _Animations_), and pressing again lands them all at once. Greg's moves play 0.5 s each; pressing Spin finishes them. Collect at the end.
6. **Jackpot game** (after the bonus if both triggered): pick coffee cups, then Collect.
7. Space or Enter does whatever Spin does (ignored while the menu is open).

### Animations

- As a reel stops, just after its landing bounce, its gems **pulse**. The gem heaps and crates wait: once the last reel stops, each FREE GAMES symbol, WILD and gem throws three glowing pieces at the player (gold doubloons with a ridged rim, or for a gem, small copies of its gem picture glowing in its colour). Each flies in a nearly straight line to just above its target, growing as it comes, then drops into it: FREE GAMES into the Free Games crate, WILDs into the Jackpot crate, gems into the heap of their colour. A crate or heap flashes as the first pieces land: it blazes white-hot and swells a touch.
- Gems on the reels **twinkle** (a small star glint every 2.6 s).
- Bonus squares all spin through dimmed reel symbols, coins and diamonds, then the columns stop one at a time from the left, with the same timing as the reels (first after 450 ms, then one every 450 ms). Pressing Spin lands them all at once.
- Coins inside Greg and claimed diamonds are **blasted away**: they flash, swell and fade.
- Greg slides between squares and grows smoothly; his box pulses when he grows.

---

## 10. Saving

The balance, denomination, bet, any Free Games in progress, and whether the meters show credits or dollars are saved on the device and restored when the game opens again. A saved bet that isn't one of the denomination's five button amounts falls back to its BET × 1.
