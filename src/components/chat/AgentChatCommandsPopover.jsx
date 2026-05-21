import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { CHAT_BOT_COMMANDS } from "../../constants/chat";

export const AgentChatCommandsPopover = memo(function AgentChatCommandsPopover({ onClose }) {
  return (
    <div
      className={cx(
        "absolute bottom-full right-0 mb-2 w-[280px] rounded-lg border border-[#303030] bg-[#1a1a1a] shadow-xl z-10 overflow-hidden",
      )}
      role="dialog"
      aria-label="Bot commands"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#303030] bg-[#141414]">
        <span className="text-[11px] font-medium text-[#d9d9d9]">Available commands</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[#8c8c8c] hover:text-[#d9d9d9] text-[14px] leading-none p-0.5"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <ul className="max-h-48 overflow-y-auto p-2 space-y-1">
        {CHAT_BOT_COMMANDS.map((c) => (
          <li key={c.command} className="px-2 py-1.5 rounded hover:bg-[#252525]">
            <div className="font-mono text-[11px] text-emerald-300">{c.command}</div>
            <div className={cx("text-[10px] mt-0.5", ui.textMuted)}>{c.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
});
