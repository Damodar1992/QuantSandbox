/** Prod Python editor palette aligned with quants.grogutrade.dev reference. */
export function registerMonacoThemes(monaco) {
  monaco.editor.defineTheme("tradingDark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7A7394", fontStyle: "italic" },
      { token: "keyword", foreground: "D946EF", fontStyle: "bold" },
      { token: "keyword.control", foreground: "A78BFA", fontStyle: "bold" },
      { token: "constant.language", foreground: "569CD6" },
      { token: "number", foreground: "C4B5FD" },
      { token: "operator", foreground: "F0EAF8" },
      { token: "string", foreground: "FB923C" },
    ],
    colors: {
      "editor.background": "#110e1f",
      "editor.foreground": "#f0eaf8",
      "editorLineNumber.foreground": "#6e6682",
      "editorLineNumber.activeForeground": "#b8aecc",
      "editor.lineHighlightBackground": "#1a1430",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#6d28d966",
      "editorCursor.foreground": "#A78BFA",
      "editorGutter.background": "#0f0d1e",
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
  return "pythonProdDark";
}
