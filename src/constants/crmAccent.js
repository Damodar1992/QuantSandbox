/** CRM accent and surface tokens (prod / violet theme). */

export const crmAccent = {
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

export const crmSurface = {
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
  return crmAccent;
}

export function getCrmSurface() {
  return crmSurface;
}
