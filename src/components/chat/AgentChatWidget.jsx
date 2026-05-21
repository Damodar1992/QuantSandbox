import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx, ui } from "../../constants/ui";
import {
  BUILDER_STAGE_LABELS,
  CHAT_AGENTS,
  createEmptyChat,
  createInitialChatsForSession,
} from "../../constants/chat";
import { ChatIcon } from "../shared/Icons";
import { AgentChatPanel } from "./AgentChatPanel";

function genMsgId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const AgentChatWidget = memo(function AgentChatWidget({
  strategyName,
  versionLabel,
  activeStage = 1,
  detailTab = "Strategy Builder",
  sessionKey,
}) {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [chatDropdownOpen, setChatDropdownOpen] = useState(false);
  const [chatsBySession, setChatsBySession] = useState({});
  const [activeChatId, setActiveChatId] = useState(null);
  const replyTimerRef = useRef(null);

  const chats = useMemo(() => {
    if (!sessionKey) return [];
    return chatsBySession[sessionKey] ?? [];
  }, [chatsBySession, sessionKey]);

  useEffect(() => {
    if (!sessionKey) return;
    setActiveChatId(null);
    setChatsBySession((prev) => {
      if (prev[sessionKey]) return prev;
      const initial = createInitialChatsForSession();
      return { ...prev, [sessionKey]: initial };
    });
  }, [sessionKey]);

  useEffect(() => {
    if (chats.length && !activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  useEffect(() => {
    if (!sessionKey) return;
    const list = chatsBySession[sessionKey];
    if (list?.length && activeChatId && !list.some((c) => c.id === activeChatId)) {
      setActiveChatId(list[0].id);
    }
  }, [sessionKey, chatsBySession, activeChatId]);

  useEffect(() => () => clearTimeout(replyTimerRef.current), []);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0];
  const agentId = activeChat?.agentId ?? "auto";

  const updateChats = useCallback(
    (updater) => {
      if (!sessionKey) return;
      setChatsBySession((prev) => ({
        ...prev,
        [sessionKey]: updater(prev[sessionKey] ?? []),
      }));
    },
    [sessionKey],
  );

  const handleAgentChange = useCallback(
    (nextAgentId) => {
      if (!activeChatId) return;
      updateChats((list) =>
        list.map((c) => (c.id === activeChatId ? { ...c, agentId: nextAgentId } : c)),
      );
    },
    [activeChatId, updateChats],
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !activeChatId) return;

    const userMsg = { id: genMsgId(), role: "user", text, at: Date.now() };
    setDraft("");
    setPendingFiles([]);

    updateChats((list) =>
      list.map((c) => {
        if (c.id !== activeChatId) return c;
        return { ...c, messages: [...c.messages, userMsg] };
      }),
    );

    const agentLabel = CHAT_AGENTS.find((a) => a.id === agentId)?.label ?? "Auto";
    const stageLabel = BUILDER_STAGE_LABELS[activeStage] ?? `Stage ${activeStage}`;

    clearTimeout(replyTimerRef.current);
    replyTimerRef.current = setTimeout(() => {
      const replyText = [
        `Mock reply from ${agentLabel} · ${strategyName} ${versionLabel}`,
        `Tab: ${detailTab} · ${stageLabel}`,
        debugMode ? "(Debug mode on — no extra logic in mock)" : "",
        text.startsWith("/")
          ? `Command "${text}" is not executed in this mock. See Info for available commands.`
          : "This is a placeholder response for the strategy builder UI.",
      ]
        .filter(Boolean)
        .join("\n");

      const botMsg = { id: genMsgId(), role: "bot", text: replyText, at: Date.now() };
      updateChats((list) =>
        list.map((c) => {
          if (c.id !== activeChatId) return c;
          return { ...c, messages: [...c.messages, botMsg] };
        }),
      );
    }, 600);
  }, [
    draft,
    activeChatId,
    agentId,
    strategyName,
    versionLabel,
    activeStage,
    detailTab,
    debugMode,
    updateChats,
  ]);

  const handleNewChat = useCallback(() => {
    const next = createEmptyChat(chats.length + 1, agentId);
    updateChats((list) => [...list, next]);
    setActiveChatId(next.id);
  }, [chats.length, agentId, updateChats]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "fixed right-4 top-1/2 z-40 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full",
          "bg-emerald-500 text-[#0f0f0f] hover:bg-emerald-400 transition-colors",
          ui.shadow,
          open && "ring-2 ring-emerald-400/50",
        )}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
        aria-expanded={open}
      >
        <ChatIcon className="h-5 w-5" />
      </button>

      <AgentChatPanel
        open={open}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((v) => !v)}
        onClose={() => {
          setOpen(false);
          setFullscreen(false);
        }}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        activeChat={activeChat}
        agentId={agentId}
        onAgentChange={handleAgentChange}
        debugMode={debugMode}
        onDebugToggle={() => setDebugMode((v) => !v)}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        pendingFiles={pendingFiles}
        onFileSelect={(name) => setPendingFiles((prev) => (prev.includes(name) ? prev : [...prev, name]))}
        onRemoveFile={(name) => setPendingFiles((prev) => prev.filter((n) => n !== name))}
        chatDropdownOpen={chatDropdownOpen}
        onChatDropdownToggle={setChatDropdownOpen}
      />
    </>
  );
});
