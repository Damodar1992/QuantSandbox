import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { usePagination } from "../../hooks/usePagination";
import { TablePagination } from "../common/TablePagination";
import {
  canBreakRelation,
  canDeleteTag,
  countLinkedObjects,
  formatTagDate,
  formatTagObjectTypeLabel,
  getRelationsForTag,
  getVisibleTags,
  breakRelation,
  deleteTagGlobally,
} from "../../features/tags/utils/tagStore";
import { AppInput, AppSelect } from "../common";
import { DeleteTagModal } from "./DeleteTagModal";
import { BreakRelationModal } from "./BreakRelationModal";

export const TagsPage = memo(function TagsPage({
  currentUserRole,
  currentUserId,
  tagsRegistry,
  setTagsRegistry,
  tagRelations,
  setTagRelations,
  hyperoptResultsRows,
  setHyperoptResultsRows,
  strategies = [],
  setStrategies,
  pageIndicators = [],
  setPageIndicators,
  miniBacktestResults = [],
  setMiniBacktestResults,
  onTagIdsRemoved,
  onCountChange,
}) {
  const [expandedTagIds, setExpandedTagIds] = useState(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [breakTarget, setBreakTarget] = useState(null);
  const [breakError, setBreakError] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterOwner, setFilterOwner] = useState("All");

  const visibleTags = useMemo(
    () =>
      getVisibleTags(tagsRegistry, currentUserRole, currentUserId).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [tagsRegistry, currentUserRole, currentUserId],
  );

  const ownerOptions = useMemo(() => {
    const owners = new Set(visibleTags.map((tag) => tag.ownerLogin).filter(Boolean));
    return Array.from(owners).sort((a, b) => a.localeCompare(b));
  }, [visibleTags]);

  const filteredTags = useMemo(() => {
    const nameQuery = filterName.trim().toLowerCase();
    return visibleTags.filter((tag) => {
      if (filterOwner !== "All" && tag.ownerLogin !== filterOwner) return false;
      if (nameQuery && !tag.name.toLowerCase().includes(nameQuery)) return false;
      return true;
    });
  }, [visibleTags, filterName, filterOwner]);

  const level1Pagination = usePagination(filteredTags, 10);

  useEffect(() => {
    onCountChange?.({
      shown: filteredTags.length,
      total: visibleTags.length,
    });
  }, [filteredTags.length, visibleTags.length, onCountChange]);

  useEffect(() => {
    level1Pagination.resetPage();
  }, [filterName, filterOwner, level1Pagination.resetPage]);

  const toggleExpanded = useCallback((tagId) => {
    setExpandedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const result = deleteTagGlobally({
      tagId: deleteTarget.id,
      tagsRegistry,
      tagRelations,
      hyperoptResultsRows,
      strategies,
      pageIndicators,
      miniBacktestResults,
      role: currentUserRole,
      userId: currentUserId,
    });
    if (!result.ok) {
      setDeleteError(result.error || "Failed to delete tag");
      return;
    }
    setTagsRegistry(result.tagsRegistry);
    setTagRelations(result.tagRelations);
    setHyperoptResultsRows(result.hyperoptResultsRows);
    setStrategies?.(result.strategies);
    setPageIndicators?.(result.pageIndicators);
    setMiniBacktestResults?.(result.miniBacktestResults);
    onTagIdsRemoved?.([deleteTarget.id]);
    setDeleteTarget(null);
    setDeleteError("");
    setExpandedTagIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });
  }, [
    deleteTarget,
    tagsRegistry,
    tagRelations,
    hyperoptResultsRows,
    strategies,
    pageIndicators,
    miniBacktestResults,
    currentUserRole,
    currentUserId,
    setTagsRegistry,
    setTagRelations,
    setHyperoptResultsRows,
    setStrategies,
    setPageIndicators,
    setMiniBacktestResults,
    onTagIdsRemoved,
  ]);

  const handleConfirmBreak = useCallback(() => {
    if (!breakTarget) return;
    const result = breakRelation({
      relationId: breakTarget.id,
      tagsRegistry,
      tagRelations,
      hyperoptResultsRows,
      strategies,
      pageIndicators,
      miniBacktestResults,
      role: currentUserRole,
      userId: currentUserId,
    });
    if (!result.ok) {
      setBreakError(result.error || "Failed to break relation");
      return;
    }
    setTagRelations(result.tagRelations);
    setHyperoptResultsRows(result.hyperoptResultsRows);
    setStrategies?.(result.strategies);
    setPageIndicators?.(result.pageIndicators);
    setMiniBacktestResults?.(result.miniBacktestResults);
    setBreakTarget(null);
    setBreakError("");
  }, [
    breakTarget,
    tagsRegistry,
    tagRelations,
    hyperoptResultsRows,
    strategies,
    pageIndicators,
    miniBacktestResults,
    currentUserRole,
    currentUserId,
    setTagRelations,
    setHyperoptResultsRows,
    setStrategies,
    setPageIndicators,
    setMiniBacktestResults,
  ]);

  const breakTagName = breakTarget
    ? tagsRegistry.find((t) => t.id === breakTarget.tagId)?.name
    : "";

  return (
    <>
      <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
        <div
          className={cx(
            "flex flex-nowrap items-center justify-end gap-2 px-4 py-3",
            ui.panelMuted,
            "border-0 border-b",
            ui.divider,
          )}
        >
          <AppInput
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              wrapperClassName="!w-32 shrink-0"
              className="h-8 text-[12px]"
              placeholder="Search..."
              aria-label="Search tags by name"
            />
            <AppSelect
              value={filterOwner}
              onValueChange={setFilterOwner}
              options={[
                { value: "All", label: "All owners" },
                ...ownerOptions.map((owner) => ({ value: owner, label: owner })),
              ]}
              className="w-[120px] shrink-0"
              triggerClassName="h-8 text-[12px]"
              aria-label="Filter tags by owner"
            />
        </div>

        {visibleTags.length === 0 ? (
          <div className="px-4 py-12 text-center text-[12px] text-[#8c8c8c]">No tags yet</div>
        ) : filteredTags.length === 0 ? (
          <div className="px-4 py-12 text-center text-[12px] text-[#8c8c8c]">No tags match your filters</div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                  <tr>
                    <th className="px-4 py-3 border-b border-[#303030] font-medium w-8" />
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Name</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Owner</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Creation date</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Linked objects</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {level1Pagination.sliceItems.map((tag) => (
                    <TagRowGroup
                      key={tag.id}
                      tag={tag}
                      expanded={expandedTagIds.has(tag.id)}
                      onToggle={() => toggleExpanded(tag.id)}
                      tagRelations={tagRelations}
                      currentUserRole={currentUserRole}
                      currentUserId={currentUserId}
                      onDelete={() => {
                        setDeleteError("");
                        setDeleteTarget(tag);
                      }}
                      onBreakRelation={(rel) => {
                        setBreakError("");
                        setBreakTarget(rel);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={level1Pagination.page}
              totalPages={level1Pagination.totalPages}
              totalItems={level1Pagination.totalItems}
              pageSize={level1Pagination.pageSize}
              onPrev={level1Pagination.goToPrev}
              onNext={level1Pagination.goToNext}
              onPageSizeChange={(size) => {
                level1Pagination.setPageSize(size);
                level1Pagination.resetPage();
              }}
            />
          </>
        )}
      </div>

      <DeleteTagModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        tag={deleteTarget}
        tagRelations={tagRelations}
        onConfirm={handleConfirmDelete}
        error={deleteError}
      />

      <BreakRelationModal
        open={Boolean(breakTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setBreakTarget(null);
            setBreakError("");
          }
        }}
        relation={breakTarget}
        tagName={breakTagName}
        onConfirm={handleConfirmBreak}
        error={breakError}
      />
    </>
  );
});

const TagRowGroup = memo(function TagRowGroup({
  tag,
  expanded,
  onToggle,
  tagRelations,
  currentUserRole,
  currentUserId,
  onDelete,
  onBreakRelation,
}) {
  const linkedCount = countLinkedObjects(tagRelations, tag.id);
  const relations = getRelationsForTag(tagRelations, tag.id);
  const level2Pagination = usePagination(relations, 10);
  const canDelete = canDeleteTag(currentUserRole, currentUserId, tag);

  return (
    <>
      <tr className="bg-[#141414] hover:bg-[#1f1f1f] transition-colors">
        <td className="px-4 py-2 border-b border-[#303030] align-middle">
          <button
            type="button"
            onClick={onToggle}
            className="text-[#8c8c8c] hover:text-[#d9d9d9] p-0.5 rounded"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? "▼" : "▶"}
          </button>
        </td>
        <td className="px-2 py-2 border-b border-[#303030] text-[#d9d9d9] font-medium">{tag.name}</td>
        <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{tag.ownerLogin}</td>
        <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{formatTagDate(tag.createdAt)}</td>
        <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{linkedCount}</td>
        <td className="px-2 py-2 border-b border-[#303030]">
          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete}
            title={canDelete ? "Delete tag globally" : "You can only delete your own tags"}
            className={cx(
              "text-[11px] px-2 py-1 rounded border transition-colors",
              canDelete
                ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
                : "border-[#303030] text-[#595959] cursor-not-allowed",
            )}
          >
            Delete globally
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[#101010]">
          <td colSpan={6} className="px-0 py-0 border-b border-[#303030]">
            {relations.length === 0 ? (
              <div className="px-8 py-6 text-center text-[11px] text-[#8c8c8c]">No linked objects</div>
            ) : (
              <div className="px-4 py-2">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="text-[#8c8c8c]">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Object type</th>
                      <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">
                        Object ID / reference
                      </th>
                      <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Assignment date</th>
                      <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {level2Pagination.sliceItems.map((rel) => {
                      const canBreak = canBreakRelation(currentUserRole, currentUserId, tag);
                      return (
                        <tr key={rel.id} className="hover:bg-[#1a1a1a]">
                          <td className="px-3 py-2 border-b border-[#303030] text-[#d9d9d9]">
                            {formatTagObjectTypeLabel(rel.objectType)}
                          </td>
                          <td className="px-3 py-2 border-b border-[#303030] text-[#a6a6a6]">
                            {rel.objectRef}
                            <span className="text-[#8c8c8c]"> · {rel.objectId}</span>
                          </td>
                          <td className="px-3 py-2 border-b border-[#303030] text-[#a6a6a6]">
                            {formatTagDate(rel.assignedAt)}
                          </td>
                          <td className="px-3 py-2 border-b border-[#303030]">
                            <button
                              type="button"
                              onClick={() => onBreakRelation(rel)}
                              disabled={!canBreak}
                              title={
                                canBreak
                                  ? "Break relation"
                                  : "You can only break relations for your own tags"
                              }
                              className={cx(
                                "text-[11px] px-2 py-1 rounded border transition-colors",
                                canBreak
                                  ? "border-[#303030] text-[#d9d9d9] hover:bg-[#1f1f1f]"
                                  : "border-[#303030] text-[#595959] cursor-not-allowed",
                              )}
                            >
                              Break relation
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <TablePagination
                  page={level2Pagination.page}
                  totalPages={level2Pagination.totalPages}
                  totalItems={level2Pagination.totalItems}
                  pageSize={level2Pagination.pageSize}
                  onPrev={level2Pagination.goToPrev}
                  onNext={level2Pagination.goToNext}
                />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
});
