import React, { memo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { useOutsideClose } from "../../hooks/useOutsideClose";
import { ExpandIcon, CollapseIcon, CloseIcon } from "../shared/Icons";
import { AgentChatMessages } from "./AgentChatMessages";
import { AgentChatInputBar } from "./AgentChatInputBar";

export const AgentChatPanel = memo(function AgentChatPanel({
  open,
  fullscreen,
  onToggleFullscreen,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  activeChat,
  agentId,
  onAgentChange,
  debugMode,
  onDebugToggle,
  draft,
  onDraftChange,
  onSend,
  pendingFiles,
  onFileSelect,
  onRemoveFile,
  chatDropdownOpen,
  onChatDropdownToggle,
}) {
  const [showCommands, setShowCommands] = useState(false);
  const dropdownRef = useOutsideClose(chatDropdownOpen, () => onChatDropdownToggle(false));

  if (!open) return null;

  const panelClass = fullscreen
    ? "fixed inset-4 z-[45] flex overflow-hidden"
    : "fixed right-4 bottom-4 z-40 flex w-[380px] max-w-[calc(100vw-2rem)] h-[min(560px,85vh)]";

  return (
    <div className={cx(panelClass, ui.radius, ui.panel, ui.shadow, "border border-[#303030]")}>
      {fullscreen && (
        <aside className="w-[240px] shrink-0 flex flex-col border-r border-[#303030] bg-[#0f0f0f]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#303030]">
            <span className="text-[11px] font-medium text-[#d9d9d9]">Chats</span>
            <button
              type="button"
              onClick={onNewChat}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40"
            >
              + New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectChat(c.id)}
                className={cx(
                  "w-full text-left px-2 py-2 rounded-md text-[11px] truncate border border-transparent",
                  activeChatId === c.id
                    ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
                    : "text-[#a6a6a6] hover:bg-[#1a1a1a]",
                )}
              >
                {c.title}
              </button>
            ))}
          </div>
        </aside>
      )}

      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <header className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-[#303030] bg-[#1a1a1a]">
          {!fullscreen && (
            <div ref={dropdownRef} className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onChatDropdownToggle(!chatDropdownOpen)}
                className={cx(ui.input, "h-8 text-[11px] w-full text-left flex items-center justify-between gap-1")}
              >
                <span className="truncate">{activeChat?.title ?? "Chat"}</span>
                <span className="text-[10px] shrink-0">{chatDropdownOpen ? "▲" : "▼"}</span>
              </button>
              {chatDropdownOpen && (
                <div className="absolute z-20 mt-1 left-0 right-0 rounded-md border border-[#303030] bg-[#1a1a1a] shadow-lg max-h-40 overflow-y-auto">
                  {chats.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectChat(c.id);
                        onChatDropdownToggle(false);
                      }}
                      className={cx(
                        "block w-full px-3 py-2 text-left text-[11px] hover:bg-[#252525] border-b border-[#303030]/50 last:border-0",
                        activeChatId === c.id && "text-emerald-300",
                      )}
                    >
                      {c.title}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      onNewChat();
                      onChatDropdownToggle(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-[11px] text-emerald-400 hover:bg-[#252525]"
                  >
                    + New chat
                  </button>
                </div>
              )}
            </div>
          )}
          {fullscreen && (
            <span className="flex-1 text-[12px] font-medium text-[#d9d9d9] truncate">
              {activeChat?.title ?? "Chat"}
            </span>
          )}

          <button
            type="button"
            onClick={onToggleFullscreen}
            className={cx(ui.btn, "h-8 w-8 p-0 shrink-0")}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <CollapseIcon /> : <ExpandIcon />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cx(ui.btn, "h-8 w-8 p-0 shrink-0")}
            aria-label="Close chat"
          >
            <CloseIcon />
          </button>
        </header>

        <AgentChatMessages messages={activeChat?.messages ?? []} agentId={agentId} />

        <AgentChatInputBar
          draft={draft}
          onDraftChange={onDraftChange}
          onSend={onSend}
          agentId={agentId}
          onAgentChange={onAgentChange}
          debugMode={debugMode}
          onDebugToggle={onDebugToggle}
          showCommands={showCommands}
          onToggleCommands={() => setShowCommands((v) => !v)}
          onCloseCommands={() => setShowCommands(false)}
          pendingFiles={pendingFiles}
          onFileSelect={onFileSelect}
          onRemoveFile={onRemoveFile}
        />
      </div>
    </div>
  );
});
