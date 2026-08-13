/** Shared shell for tall tabbed info dialogs — fixed height so tab switches don't jump. */
export const BT_INFO_DIALOG_CLASS =
  "flex !h-[min(90vh,820px)] max-h-[calc(100dvh-4rem)] max-w-[1080px] flex-col !overflow-hidden !top-[5vh] !-translate-y-0";

/** Backtesting info — fills the viewport so wide metric tables have room. */
export const BT_INFO_DIALOG_FULLSCREEN_CLASS =
  "flex !inset-0 !top-0 !left-0 !h-dvh !w-screen !max-h-none !max-w-none !translate-x-0 !translate-y-0 flex-col !overflow-hidden !rounded-none";
