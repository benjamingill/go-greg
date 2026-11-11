/**
 * Testing switches: each forces its special game on every paid spin. Only the
 * local dev build shows the checkboxes that turn them on.
 */
export const cheats = { bonus: false, freeGames: false, jackpot: false };

export type Cheat = keyof typeof cheats;
