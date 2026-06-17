import { resolveUiVariant } from "./uiVariant";
import { uiLegacy } from "./ui.legacy";
import { uiProd } from "./ui.prod";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

/** @returns {typeof uiLegacy} */
export function getUiTokens() {
  return resolveUiVariant() === "prod" ? uiProd : uiLegacy;
}

/** Resolved at module load; reload page after `setUiVariant()` to refresh. */
export const ui = getUiTokens();
