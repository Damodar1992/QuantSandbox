import React, { memo, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { cx, ui } from "../../../constants/ui";

const EDITOR_HEIGHT = 400;

const BASE_OPTIONS = {
  fontSize: 13,
  lineHeight: 20,
  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: "all",
  renderWhitespace: "none",
  automaticLayout: true,
  wordWrap: "on",
  lineNumbers: "on",
  glyphMargin: false,
  folding: true,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 3,
  renderValidationDecorations: "on",
  tabSize: 4,
  insertSpaces: true,
};

export const MonacoPythonEditor = memo(function MonacoPythonEditor({
  value,
  onChange,
  readOnly = false,
  height = EDITOR_HEIGHT,
  subtitle,
}) {
  const copy = useCallback(() => {
    try {
      navigator.clipboard?.writeText(value || "");
    } catch {
      // no-op
    }
  }, [value]);

  const handleMount = useCallback(
    (editor) => {
      editor.updateOptions({
        ...BASE_OPTIONS,
        readOnly,
        domReadOnly: readOnly,
        contextmenu: !readOnly,
      });
    },
    [readOnly],
  );

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className={cx("flex items-center justify-between px-3 py-2", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#a6a6a6]">python</span>
          <span className="text-[10px] text-[#8c8c8c]">
            {subtitle ?? (readOnly ? "Read-only preview" : "Monaco editor")}
          </span>
        </div>
        <button type="button" onClick={copy} className={cx(ui.btn, "px-2 py-1 text-[10px]")}>
          Copy
        </button>
      </div>
      <div style={{ height }} className="bg-[#0f0f0f]">
        <Editor
          height={`${height}px`}
          language="python"
          theme="vs-dark"
          value={value ?? ""}
          onChange={readOnly ? undefined : (v) => onChange?.(v ?? "")}
          onMount={handleMount}
          options={{
            ...BASE_OPTIONS,
            readOnly,
            domReadOnly: readOnly,
            contextmenu: !readOnly,
          }}
        />
      </div>
    </div>
  );
});
