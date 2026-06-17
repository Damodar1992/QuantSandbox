import { resolveUiVariant } from "./uiVariant";

/** Primary accent: violet on prod, emerald on legacy. */
const legacyAccent = {
  text: "text-emerald-400",
  textMuted: "text-emerald-300",
  textStrong: "text-emerald-200",
  textDim: "text-emerald-100",
  bg: "bg-emerald-500/10",
  bgMedium: "bg-emerald-500/20",
  border: "border-emerald-500/40",
  borderL: "border-l-emerald-500",
  ring: "focus:ring-emerald-500/50",
  ringInset: "focus:ring-emerald-500/50 focus:ring-inset",
  accent: "accent-emerald-500",
  btn: "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700",
  btnSolid: "bg-emerald-500 hover:bg-emerald-400",
  progress: "bg-emerald-500",
  tabActive: "bg-emerald-500 text-[#0f0f0f]",
  highlight: "bg-emerald-500/25 text-emerald-400",
  navActive: "bg-emerald-500/10 text-emerald-200 border-emerald-500/40",
  dot: "bg-emerald-500",
  borderLHover: "hover:border-l-emerald-400",
};

const prodAccent = {
  text: "text-violet-300",
  textMuted: "text-[#ddd6fe]",
  textStrong: "text-[#ddd6fe]",
  textDim: "text-[#c4b5fd]",
  bg: "bg-[rgba(168,96,240,0.16)]",
  bgMedium: "bg-[rgba(168,96,240,0.2)]",
  border: "border-violet-500/40",
  borderL: "border-l-violet-500",
  ring: "focus:ring-violet-500/40",
  ringInset: "focus:ring-violet-500/40 focus:ring-inset",
  accent: "accent-violet-500",
  btn: "bg-violet-700 hover:bg-violet-600 active:bg-violet-800",
  btnSolid: "bg-violet-700 hover:bg-violet-600",
  progress: "bg-violet-600",
  tabActive: "bg-violet-700 text-[#faf7fd]",
  highlight: "bg-[rgba(168,96,240,0.25)] text-violet-300",
  navActive: "bg-[rgba(168,96,240,0.16)] text-[#ddd6fe] border-violet-500/40",
  dot: "bg-violet-500",
  borderLHover: "hover:border-l-violet-400",
};

/** Success/status: green on both themes. */
export const successAccent = {
  text: "text-[var(--crm-success)]",
  bg: "bg-[var(--crm-success-bg)]",
  border: "border-emerald-500/30",
  borderL: "border-l-emerald-500",
  badge: "bg-[var(--crm-success-bg)] text-[var(--crm-success)] border border-emerald-500/30",
};

/** Surfaces and typography beyond ui.* facade. */
const legacySurface = {
  page: "bg-[#0f0f0f]",
  panel: "bg-[#141414]",
  panelMuted: "bg-[#1a1a1a]",
  input: "bg-[#0f0f0f]",
  border: "border-[#303030]",
  text: "text-[#d9d9d9]",
  textHeading: "text-[#d9d9d9]",
  textBright: "text-[#f5f5f5]",
  placeholder: "placeholder:text-[#595959]",
  link: "text-emerald-400 hover:text-emerald-300",
  stickyBar: "bg-[#1a1a1a]/95 supports-[backdrop-filter]:bg-[#1a1a1a]/80",
};

const prodSurface = {
  page: "bg-[#0f0d1e]",
  panel: "bg-[#170f29]",
  panelMuted: "bg-[#19102b]",
  input: "bg-[#170f29]",
  border: "border-[rgba(60,40,80,0.35)]",
  text: "text-[#faf7fd]",
  textHeading: "text-[#faf7fd]",
  textBright: "text-[#faf7fd]",
  placeholder: "placeholder:text-[#6e6682]",
  link: "text-violet-300 hover:text-[#ddd6fe]",
  stickyBar: "bg-[#19102b]/95 supports-[backdrop-filter]:bg-[#19102b]/80",
};

export function getCrmAccent() {
  return resolveUiVariant() === "prod" ? prodAccent : legacyAccent;
}

export function getCrmSurface() {
  return resolveUiVariant() === "prod" ? prodSurface : legacySurface;
}

export const crmAccent = getCrmAccent();
export const crmSurface = getCrmSurface();
