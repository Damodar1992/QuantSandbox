import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { formatReleaseDate, sortReleaseNotesByDate } from "../../constants/releaseNotes";
import { ReleaseNoteMarkdown } from "./ReleaseNoteMarkdown";
import { AppButton } from "../common/AppButton";

export const ReleaseNotesPage = memo(function ReleaseNotesPage({
  notes,
  selectedId,
  onSelectId,
  onEditNote,
}) {
  const sortedNotes = useMemo(() => sortReleaseNotesByDate(notes), [notes]);
  const [internalId, setInternalId] = useState(null);

  const activeId = selectedId ?? internalId;
  const selectedNote = sortedNotes.find((n) => n.id === activeId) ?? null;

  useEffect(() => {
    if (sortedNotes.length === 0) {
      setInternalId(null);
      onSelectId?.(null);
      return;
    }
    if (!activeId || !sortedNotes.some((n) => n.id === activeId)) {
      const first = sortedNotes[0].id;
      setInternalId(first);
      onSelectId?.(first);
    }
  }, [sortedNotes, activeId, onSelectId]);

  const handleSelect = (id) => {
    setInternalId(id);
    onSelectId?.(id);
  };

  if (sortedNotes.length === 0) {
    return (
      <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
        <div className="px-4 py-16 text-center text-[12px] text-[#8c8c8c]">
          No release notes yet. Click &quot;Add notes&quot; to create one.
        </div>
      </div>
    );
  }

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden min-h-[480px] flex flex-col md:flex-row")}>
      <aside
        className={cx(
          "shrink-0 border-b md:border-b-0 md:border-r md:w-[280px]",
          ui.divider,
          "bg-[#19102b]/50",
        )}
      >
        <div className="max-h-[320px] md:max-h-[calc(100vh-220px)] overflow-y-auto p-2 space-y-1">
          {sortedNotes.map((note) => {
            const isActive = note.id === activeId;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => handleSelect(note.id)}
                className={cx(
                  "w-full text-left rounded-md border px-3 py-2.5 transition-colors",
                  isActive
                    ? "border-violet-500/50 bg-[rgba(168,96,240,0.16)]"
                    : "border-transparent hover:bg-[#1e1333] hover:border-[rgba(60,40,80,0.35)]",
                )}
              >
                <div
                  className={cx(
                    "text-[12px] font-medium truncate",
                    isActive ? "text-[#faf7fd]" : "text-[#d9d9d9]",
                  )}
                >
                  {note.title}
                </div>
                <div className={cx("text-[10px] mt-0.5", ui.textMuted)}>
                  {formatReleaseDate(note.releasedAt)}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 min-w-0 p-4 md:p-6">
        {selectedNote ? (
          <div
            className={cx(
              "rounded-lg border p-4 md:p-6 min-h-[280px]",
              ui.divider,
              "bg-[#170f29]/80",
            )}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold text-[#faf7fd]">{selectedNote.title}</h2>
                <p className={cx("text-[11px] mt-1", ui.textMuted)}>
                  Released {formatReleaseDate(selectedNote.releasedAt)}
                </p>
              </div>
              {onEditNote && (
                <AppButton
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => onEditNote(selectedNote)}
                >
                  Edit
                </AppButton>
              )}
            </div>
            <ReleaseNoteMarkdown content={selectedNote.body} />
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[280px] text-[12px] text-[#8c8c8c]">
            Select a release note
          </div>
        )}
      </div>
    </div>
  );
});
