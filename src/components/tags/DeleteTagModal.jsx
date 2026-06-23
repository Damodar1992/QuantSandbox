import React, { memo } from "react";
import { AppDialog } from "../common/AppDialog";
import { AppButton } from "../common/AppButton";
import { getRelationsForTag } from "../../features/tags/utils/tagStore";

export const DeleteTagModal = memo(function DeleteTagModal({
  open,
  onOpenChange,
  tag,
  tagRelations,
  onConfirm,
  error,
}) {
  const relations = tag ? getRelationsForTag(tagRelations, tag.id) : [];

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete tag globally"
      description="This will remove the tag and all of its object relations. This action cannot be undone."
      className="max-w-md"
    >
      <div className="space-y-4 text-[12px]">
        {tag && (
          <div className="rounded-md border border-[#303030] bg-[#0f0f0f] px-3 py-2">
            <div className="font-medium text-[#d9d9d9]">{tag.name}</div>
            <div className="mt-0.5 text-[11px] text-[#8c8c8c]">
              Owner: {tag.ownerLogin} · {relations.length} linked object
              {relations.length === 1 ? "" : "s"}
            </div>
          </div>
        )}

        {relations.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-[#d9d9d9]">Relations to be removed</div>
            <ul className="max-h-40 overflow-auto rounded-md border border-[#303030] bg-[#141414] divide-y divide-[#303030]">
              {relations.map((rel) => (
                <li key={rel.id} className="px-3 py-2 text-[11px] text-[#a6a6a6]">
                  <span className="text-[#d9d9d9]">{rel.objectType}</span>
                  {" · "}
                  {rel.objectRef}
                  <span className="text-[#8c8c8c]"> ({rel.objectId})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <AppButton type="button" variant="outline" size="sm" onClick={() => onOpenChange?.(false)}>
            Cancel
          </AppButton>
          <AppButton type="button" variant="destructive" size="sm" onClick={() => onConfirm?.()}>
            Delete globally
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
});
