/**
 * Simulated async delete state machine for Storage RAW data.
 *
 * States: idle → preparing → deleting → done
 * done.result: "completed" | "partiallyCompleted" | "failed"
 *
 * Randomly fails 0-2 hyperopts to demonstrate partial-failure UI.
 */

/**
 * Simulates deletion of selected hyperopts.
 *
 * @param {string[]} hyperoptIds - ids to delete
 * @param {Object} callbacks
 * @param {Function} callbacks.onPreparing   - ()
 * @param {Function} callbacks.onDeleting    - (processingIds: Set)
 * @param {Function} callbacks.onDone        - (result: DeleteResult)
 */
export function simulateDelete(hyperoptIds, { onPreparing, onDeleting, onDone }) {
  if (hyperoptIds.length === 0) return;

  onPreparing?.();

  const preparingMs = 900 + Math.random() * 600;
  const deletingMs = 1200 + Math.random() * 1000;

  setTimeout(() => {
    const processingSet = new Set(hyperoptIds);
    onDeleting?.(processingSet);

    setTimeout(() => {
      // randomly pick 0-2 to fail (capped at total count)
      const failCount = Math.min(hyperoptIds.length, Math.floor(Math.random() * 3));
      const shuffled = [...hyperoptIds].sort(() => Math.random() - 0.5);
      const failed = new Set(shuffled.slice(0, failCount));
      const succeeded = new Set(hyperoptIds.filter((id) => !failed.has(id)));

      let status;
      if (failed.size === 0) status = "completed";
      else if (succeeded.size === 0) status = "failed";
      else status = "partiallyCompleted";

      onDone?.({
        status,
        succeededIds: [...succeeded],
        failedIds: [...failed],
        errors: [...failed].map((id) => ({ hyperoptId: id, reason: "I/O error while removing index files." })),
      });
    }, deletingMs);
  }, preparingMs);
}

/**
 * Builds an audit log entry.
 */
export function buildAuditEntry({
  user,
  startedAt,
  scope,           // { strategyId, strategyName }[]
  eligibleIds,
  succeededIds,
  failedIds,
  sizeBefore,
  released,
  status,
  errors,
  finishedAt,
}) {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user,
    startedAt,
    finishedAt,
    scope,
    eligibleCount: eligibleIds.length,
    succeededCount: succeededIds.length,
    failedCount: failedIds.length,
    sizeBefore,
    released,
    status,
    errors,
  };
}
