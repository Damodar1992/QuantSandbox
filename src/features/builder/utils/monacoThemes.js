import { isProdUi } from "../../../constants/uiVariant";

/** Prod Python editor palette aligned with quants.grogutrade.dev reference. */
export function registerMonacoThemes(monaco) {
  const prod = isProdUi();
  const accent = prod ? "A78BFA" : "10B981";
  const editorBg = prod ? "#110e1f" : "#0f0f0f";
  const editorFg = prod ? "#f0eaf8" : "#d9d9d9";
  const gutterBg = prod ? "#0f0d1e" : "#0f0f0f";
  const lineHighlight = prod ? "#1a1430" : "#1f1f1f";
  const lineNumber = prod ? "#6e6682" : "#595959";

  monaco.editor.defineTheme("tradingDark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: prod ? "7A7394" : "6A9955", fontStyle: "italic" },
      { token: "keyword", foreground: prod ? "D946EF" : "C586C0", fontStyle: prod ? "bold" : undefined },
      { token: "keyword.control", foreground: accent, fontStyle: "bold" },
      { token: "constant.language", foreground: "569CD6" },
      { token: "number", foreground: prod ? "C4B5FD" : "B5CEA8" },
      { token: "operator", foreground: prod ? "F0EAF8" : "D4D4D4" },
      { token: "string", foreground: prod ? "FB923C" : "CE9178" },
    ],
    colors: {
      "editor.background": editorBg,
      "editor.foreground": editorFg,
      "editorLineNumber.foreground": lineNumber,
      "editorLineNumber.activeForeground": prod ? "#b8aecc" : "#858585",
      "editor.lineHighlightBackground": lineHighlight,
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": prod ? "#6d28d966" : "#264f78",
      "editorCursor.foreground": prod ? "#A78BFA" : "#10B981",
      "editorGutter.background": gutterBg,
    },
  });

  monaco.editor.defineTheme("pythonProdDark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7A7394", fontStyle: "italic" },
      { token: "string", foreground: "FB923C" },
      { token: "string.python", foreground: "FB923C" },
      { token: "string.escape", foreground: "FDBA74" },
      { token: "keyword", foreground: "D946EF", fontStyle: "bold" },
      { token: "keyword.control", foreground: "D946EF", fontStyle: "bold" },
      { token: "keyword.flow", foreground: "D946EF" },
      { token: "number", foreground: "C4B5FD" },
      { token: "number.float", foreground: "C4B5FD" },
      { token: "operator", foreground: "F0EAF8" },
      { token: "delimiter", foreground: "C8BFD9" },
      { token: "delimiter.parenthesis", foreground: "C8BFD9" },
      { token: "identifier", foreground: "F5F0FF" },
      { token: "type", foreground: "E9D5FF" },
      { token: "type.identifier", foreground: "E9D5FF" },
      { token: "tag", foreground: "E9D5FF" },
      { token: "function", foreground: "F5F0FF" },
      { token: "support.function", foreground: "E9D5FF" },
      { token: "entity.name.function", foreground: "F5F0FF" },
      { token: "variable", foreground: "F5F0FF" },
      { token: "variable.parameter", foreground: "F5F0FF" },
      { token: "variable.language", foreground: "E9D5FF" },
      { token: "meta.function", foreground: "F5F0FF" },
      { token: "constant.language", foreground: "C4B5FD" },
      { token: "regexp", foreground: "F87171" },
    ],
    colors: {
      "editor.background": "#110e1f",
      "editor.foreground": "#f0eaf8",
      "editorLineNumber.foreground": "#6e6682",
      "editorLineNumber.activeForeground": "#b8aecc",
      "editorGutter.background": "#0f0d1e",
      "editor.lineHighlightBackground": "#1a1430",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#6d28d966",
      "editor.inactiveSelectionBackground": "#4c1d9544",
      "editorCursor.foreground": "#a78bfa",
      "editorWidget.background": "#170f29",
      "editorIndentGuide.background": "#2a2040",
      "editorIndentGuide.activeBackground": "#4c3870",
      "editorBracketMatch.background": "#6d28d933",
      "editorBracketMatch.border": "#a78bfa88",
    },
  });
}

export function getMonacoThemeId() {
  return isProdUi() ? "pythonProdDark" : "vs-dark";
}
