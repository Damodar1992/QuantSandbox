import React, { memo, useRef } from "react";
import { cx, ui } from "../../constants/ui";
import { CHAT_AGENTS } from "../../constants/chat";
import { PaperclipIcon, InfoIcon, BugIcon } from "../shared/Icons";
import { AgentChatCommandsPopover } from "./AgentChatCommandsPopover";

export const AgentChatInputBar = memo(function AgentChatInputBar({
  draft,
  onDraftChange,
  onSend,
  agentId,
  onAgentChange,
  debugMode,
  onDebugToggle,
  showCommands,
  onToggleCommands,
  onCloseCommands,
  pendingFiles,
  onFileSelect,
  onRemoveFile,
}) {
  const fileRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend?.();
    }
  };

  return (
    <div className="shrink-0 border-t border-[#303030] bg-[#141414] p-2 space-y-2">
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {pendingFiles.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#a6a6a6]"
            >
              {name}
              <button
                type="button"
                onClick={() => onRemoveFile?.(name)}
                className="text-[#8c8c8c] hover:text-red-400"
                aria-label={`Remove ${name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="Message…"
        className={cx(
          ui.input,
          "min-h-[52px] resize-none text-[12px] w-full",
        )}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect?.(file.name);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cx(ui.btn, "h-8 px-2")}
          title="Upload file"
          aria-label="Upload file"
        >
          <PaperclipIcon />
        </button>

        <select
          value={agentId}
          onChange={(e) => onAgentChange(e.target.value)}
          className={cx(ui.select, "h-8 text-[11px] min-w-[100px]")}
          aria-label="Agent"
        >
          {CHAT_AGENTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onDebugToggle}
          className={cx(
            ui.btn,
            "h-8 px-2",
            debugMode && "bg-amber-500/20 text-amber-300 border-amber-500/40",
          )}
          title="Debug mode (mock)"
          aria-label="Debug mode"
          aria-pressed={debugMode}
        >
          <BugIcon />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={onToggleCommands}
            className={cx(ui.btn, "h-8 px-2", showCommands && "bg-[#252525]")}
            title="Commands"
            aria-label="Show commands"
            aria-expanded={showCommands}
          >
            <InfoIcon />
          </button>
          {showCommands && <AgentChatCommandsPopover onClose={onCloseCommands} />}
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!draft.trim()}
          className={cx(ui.btnPrimary, "h-8 px-3 ml-auto disabled:opacity-50 disabled:cursor-not-allowed")}
        >
          Send
        </button>
      </div>
    </div>
  );
});
