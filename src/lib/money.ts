/**
 * The API stores money as integers in minor units (paise). The UI works in
 * rupees (`RupeeAmount`). Convert only at the service boundary.
 */

export const minorToRupees = (minor: number): number => minor / 100;

/** Rounds to the nearest paisa, so 8499.999 → 849900. */
export const rupeesToMinor = (rupees: number): number => Math.round(rupees * 100);
