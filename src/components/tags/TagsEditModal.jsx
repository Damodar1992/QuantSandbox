import React, { memo } from "react";
import { createPortal } from "react-dom";
import { cx, ui } from "../../constants/ui";

/**
 * Shared Tags edit modal (Hyperopt / MiniBT / Strategy / Indicator).
 */
export const TagsEditModal = memo(function TagsEditModal({
  open,
  draft = { tagIds: [], tagInput: "" },
  tagsRegistry = [],
  onDraftChange,
  onCommitTag,
  onClose,
  onSave,
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className={cx(
          ui.radius,
          "bg-[#141414] border border-[#303030] max-w-[480px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
          <span className="text-[14px] font-medium text-[#d9d9d9] flex items-center gap-2">
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4 shrink-0 text-emerald-400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16 8L8 0H0V8L8 16L16 8ZM4.5 6C5.32843 6 6 5.32843 6 4.5C6 3.67157 5.32843 3 4.5 3C3.67157 3 3 3.67157 3 4.5C3 5.32843 3.67157 6 4.5 6Z"
                fill="currentColor"
              />
            </svg>
            Tags
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-[#d9d9d9]">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft.tagInput}
                onChange={(e) =>
                  onDraftChange?.((prev) => ({ ...prev, tagInput: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onCommitTag?.();
                  }
                }}
                className={cx(ui.input, "h-8 flex-1 text-[12px]")}
                placeholder="Add tag, press Enter"
              />
              <button
                type="button"
                onClick={onCommitTag}
                title="Add tag"
                aria-label="Add tag"
                className={cx(ui.btn, "h-8 w-8 p-0 inline-flex items-center justify-center shrink-0")}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            {draft.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {draft.tagIds.map((tagId) => {
                  const tagName = tagsRegistry.find((tag) => tag.id === tagId)?.name || tagId;
                  return (
                    <span
                      key={tagId}
                      className="inline-flex items-center gap-1 rounded border border-[#303030] bg-[#0f0f0f] pl-2 pr-0.5 py-0.5 text-[11px] text-[#d9d9d9]"
                    >
                      {tagName}
                      <button
                        type="button"
                        onClick={() =>
                          onDraftChange?.((prev) => ({
                            ...prev,
                            tagIds: prev.tagIds.filter((id) => id !== tagId),
                          }))
                        }
                        className="p-0.5 rounded text-[#8c8c8c] hover:text-[#d9d9d9]"
                        aria-label={`Remove tag ${tagName}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          aria-hidden
                        >
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#303030] px-4 py-3 bg-[#101010]">
          <button
            type="button"
            onClick={onClose}
            className={cx(ui.btnGhost, "h-8 w-8 p-0 inline-flex items-center justify-center")}
            title="Cancel"
            aria-label="Cancel"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onSave}
            className={cx(ui.btnPrimary, "h-8 w-8 p-0 inline-flex items-center justify-center")}
            title="Save"
            aria-label="Save"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});
