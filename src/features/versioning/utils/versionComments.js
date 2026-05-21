/**
 * @param {{ label: string, tagNames?: string[], comment?: string }} params
 */
export function buildVersionHoverTooltip({ label, tagNames = [], comment = "" }) {
  const lines = [label];
  if (tagNames.length > 0) {
    lines.push(`Tags: ${tagNames.join(", ")}`);
  }
  const trimmed = comment?.trim();
  if (trimmed) {
    lines.push(trimmed);
  }
  return lines.join("\n");
}

export function hasVersionComment(commentsByVersionId, versionId) {
  if (!versionId) return false;
  return Boolean(commentsByVersionId?.[versionId]?.trim());
}
