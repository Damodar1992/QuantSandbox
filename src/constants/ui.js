import { uiProd } from "./ui.prod";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

export function getUiTokens() {
  return uiProd;
}

export const ui = uiProd;
