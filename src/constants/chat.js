export const CHAT_AGENTS = [
  { id: "auto", label: "Auto" },
  { id: "agent1", label: "Agent 1" },
  { id: "agent2", label: "Agent 2" },
];

export const CHAT_BOT_COMMANDS = [
  { command: "/help", description: "Show available commands" },
  { command: "/analyze", description: "Analyze current strategy stage and metrics" },
  { command: "/optimize", description: "Suggest hyperopt parameters to tune" },
  { command: "/status", description: "Show pipeline and queue status (mock)" },
  { command: "/explain", description: "Explain selected indicators or formulas" },
  { command: "/reset", description: "Clear chat history (mock)" },
];

const now = Date.now();

function msg(id, role, text, offsetMs = 0) {
  return { id, role, text, at: now - offsetMs };
}

/** Initial mock threads per strategy version session */
export function createInitialChatsForSession() {
  return [
    {
      id: "chat-1",
      title: "Hyperopt hints",
      agentId: "auto",
      messages: [
        msg("m1", "bot", "Hi! I can help with strategy builder, hyperopt, and risk settings. Use /help for commands.", 120000),
        msg("m2", "user", "What should I check on Signal stage?", 90000),
        msg(
          "m3",
          "bot",
          "Review indicator ranges and total combinations. Run a small fold first before full sweep.",
          60000,
        ),
      ],
    },
    {
      id: "chat-2",
      title: "Risk review",
      agentId: "agent1",
      messages: [
        msg("r1", "bot", "Agent 1 ready. Ask about stoploss ranges or heatmap axes.", 300000),
        msg("r2", "user", "How is drawdown used on Risk heatmap?", 240000),
        msg(
          "r3",
          "bot",
          "On Risk stage the heatmap uses Profit factor and Drawdown on X/Y (mock). Pick cells to save favorites for Final.",
          180000,
        ),
      ],
    },
  ];
}

export function createEmptyChat(index, agentId = "auto") {
  return {
    id: `chat-${Date.now()}-${index}`,
    title: `Chat ${index}`,
    agentId,
    messages: [],
  };
}

export const BUILDER_STAGE_LABELS = {
  1: "Signal",
  2: "Entry",
  3: "Exit",
  4: "Risk",
  5: "Final",
};
