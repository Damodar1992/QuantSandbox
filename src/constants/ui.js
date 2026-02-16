// UI utility for className composition
export const cx = (...parts) => parts.filter(Boolean).join(" ");

// Theme constants - dark mode design system
export const ui = {
  page: "bg-[#0f0f0f] text-[#d9d9d9]",
  panel: "bg-[#141414] border border-[#303030]",
  panelMuted: "bg-[#1f1f1f] border border-[#303030]",
  radius: "rounded-lg",
  shadow: "shadow-[0_6px_24px_rgba(0,0,0,0.45)]",
  textMuted: "text-[#8c8c8c]",
  textSubtle: "text-[#a6a6a6]",
  divider: "border-[#303030]",
  input:
    "h-9 w-full rounded-md border border-[#303030] bg-[#0f0f0f] px-3 text-sm text-[#d9d9d9] placeholder:text-[#595959] focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
  select:
    "h-8 rounded-md border border-[#303030] bg-[#0f0f0f] px-2 text-[12px] text-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
  btn:
    "inline-flex items-center justify-center rounded-md border border-[#303030] bg-transparent px-3 py-1.5 text-[12px] text-[#d9d9d9] hover:bg-[#1f1f1f] active:translate-y-[0.5px]",
  btnPrimary:
    "inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-[12px] font-medium text-[#0f0f0f] hover:bg-emerald-400 active:translate-y-[0.5px]",
};
