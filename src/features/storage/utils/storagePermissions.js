/**
 * Storage permissions — stubbed.
 *
 * Roles that can manage storage: Admin.
 * Quant users can only view their own strategies' data.
 */

/**
 * Returns true if the given role can access the Storage section at all.
 */
export function canManageStorage(role) {
  return role === "Admin" || role === "Quant";
}

/**
 * Filters strategies to those visible to the user.
 * - Admin: all strategies.
 * - Quant: only owned strategies.
 */
export function visibleStrategies(strategies, role, userId) {
  if (role === "Admin") return strategies;
  return strategies.filter((s) => s.ownerId === userId);
}

/**
 * Returns true if the user can delete RAW data for a specific strategy.
 * - Admin: always.
 * - Quant: only own strategies.
 */
export function canDeleteForStrategy(strategy, role, userId) {
  if (role === "Admin") return true;
  return strategy.ownerId === userId;
}
