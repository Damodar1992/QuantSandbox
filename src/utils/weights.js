/**
 * Clamp a weight value and set via setter so that value + othersSum <= 100.
 * @param {function(number): void} setter - React setState for the weight
 * @param {number|string} value - Raw input value
 * @param {number} othersSum - Sum of other weights (0–100)
 */
export function setWeightCapped(setter, value, othersSum) {
  const n = Math.max(0, Math.min(100, Number(value)));
  setter(Math.min(n, 100 - othersSum));
}
