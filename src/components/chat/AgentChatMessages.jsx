import React, { memo, useEffect, useRef } from "react";
import { cx, ui } from "../../constants/ui";
import { CHAT_AGENTS } from "../../constants/chat";

function formatTime(at) {
  if (!at) return "";
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const AgentChatMessages = memo(function AgentChatMessages({ messages, agentId }) {
  const endRef = useRef(null);
  const agentLabel = CHAT_AGENTS.find((a) => a.id === agentId)?.label ?? "Assistant";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!messages.length) {
    return (
      <div className={cx("flex flex-1 items-center justify-center p-6 text-center text-[12px]", ui.textMuted)}>
        Ask about this strategy…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
      {messages.map((m) => {
        const isUser = m.role === "user";
        return (
          <div key={m.id} className={cx("flex", isUser ? "justify-end" : "justify-start")}>
            <div
              className={cx(
                "max-w-[85%] rounded-lg px-3 py-2 text-[12px] leading-relaxed",
                isUser
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-[#e8fff4]"
                  : "bg-[#1f1f1f] border border-[#303030] text-[#d9d9d9]",
              )}
            >
              {!isUser && (
                <div className="text-[10px] text-[#8c8c8c] mb-1">{agentLabel}</div>
              )}
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
              <div className={cx("mt-1 text-[9px]", isUser ? "text-emerald-200/60" : "text-[#595959]")}>
                {formatTime(m.at)}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
});
