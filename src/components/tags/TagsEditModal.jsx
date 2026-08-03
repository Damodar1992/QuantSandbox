import React, { memo } from "react";
import { AppButton } from "../common/AppButton";
import { AppDialog } from "../common/AppDialog";
import { AppInput } from "../common/AppInput";

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
  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Tags"
      className="max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-[#d9d9d9]">Tags</label>
          <div className="flex gap-2">
            <AppInput
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
              wrapperClassName="flex-1"
              className="h-8 text-[12px]"
              placeholder="Add tag, press Enter"
            />
            <AppButton
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onCommitTag}
              title="Add tag"
              aria-label="Add tag"
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
            </AppButton>
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
        <div className="flex items-center justify-end gap-2 pt-1">
          <AppButton
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onClose}
            title="Cancel"
            aria-label="Cancel"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </AppButton>
          <AppButton
            type="button"
            variant="default"
            size="icon-sm"
            onClick={onSave}
            title="Save"
            aria-label="Save"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
});
