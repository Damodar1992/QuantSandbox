import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { cx, ui } from "../../../constants/ui";
import { crmAccent, successAccent } from "../../../constants/crmAccent";
import { TableBasedEditor } from "./TableBasedEditor";
import { getDefaultDisplayName, getIndicatorOutputAliases } from "../utils/indicatorHelpers";
import { IndicatorAliasesPanel } from "./IndicatorAliasesPanel";
import { registerMonacoThemes, getMonacoThemeId } from "../utils/monacoThemes";

function CodeModeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function BuilderModeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export const FormulaEditor = memo(({ value, onChange, indicators, mode = "signal", editingLocked = false }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [editorMode, setEditorMode] = useState('python'); // 'python' | 'table'
  const [tableRules, setTableRules] = useState([]);
  const [pythonCodeManuallyEdited, setPythonCodeManuallyEdited] = useState(false);
  const [generatedPythonCode, setGeneratedPythonCode] = useState('');
  const [aliasesOpen, setAliasesOpen] = useState(false);
  
  // Initialize table rules if empty
  useEffect(() => {
    if (tableRules.length === 0) {
      setTableRules([
        {
          id: Date.now(),
          conditions: [{ variable: 'Close', operator: '>', value: 'Close', logic: 'AND' }]
        }
      ]);
    }
  }, [tableRules.length]);
  
  // Generate available variables from indicators (with ranges)
  const availableVars = useMemo(() => {
    const vars = new Set(["Close", "Open", "High", "Low", "Volume", "BUY", "SELL"]);
    
    indicators.forEach((ind) => {
      if (!ind.enabled) return;
      getIndicatorOutputAliases(ind).forEach((alias) => vars.add(alias));
    });
    
    return Array.from(vars).sort();
  }, [indicators]);
  
  // Group variables hierarchically for dropdown
  const groupedVars = useMemo(() => {
    const groups = {
      'Price Data': []
    };
    
    // Create groups dynamically based on indicators
    indicators.forEach(ind => {
      if (ind.enabled && ind.displayName) {
        const groupName = ind.displayName.charAt(0).toUpperCase() + ind.displayName.slice(1);
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
      }
    });
    
    // Add a Custom group for any unmatched variables
    groups['Custom'] = [];
    
    availableVars.forEach(varName => {
      if (['Close', 'Open', 'High', 'Low', 'Volume'].includes(varName)) {
        groups['Price Data'].push(varName);
      } else {
        // Find which indicator this variable belongs to
        let found = false;
        for (const ind of indicators) {
          if (ind.enabled && ind.displayName) {
            // Check if variable matches exactly or starts with displayName_
            const matches = varName === ind.displayName || varName.startsWith(ind.displayName + '_');
            if (matches) {
              const groupName = ind.displayName.charAt(0).toUpperCase() + ind.displayName.slice(1);
              if (!groups[groupName]) {
                groups[groupName] = [];
              }
              groups[groupName].push(varName);
              found = true;
              break;
            }
          }
        }
        if (!found) {
          groups['Custom'].push(varName);
        }
      }
    });
    
    // Remove empty groups
    return Object.entries(groups).filter(([_, vars]) => vars.length > 0);
  }, [availableVars, indicators]);
  
  // Configure Monaco Editor
  const handleEditorWillMount = useCallback((monaco) => {
    monacoRef.current = monaco;
    
    // Register custom language for trading formulas
    monaco.languages.register({ id: 'tradingFormula' });
    
    // Define syntax highlighting
    monaco.languages.setMonarchTokensProvider('tradingFormula', {
      keywords: ['IF', 'THEN', 'ELIF', 'ELSE', 'END', 'AND', 'OR', 'NOT', 'BUY', 'SELL', 'TRUE', 'FALSE'],
      operators: ['>', '<', '>=', '<=', '==', '!=', '=', '+', '-', '*', '/', '%'],
      
      tokenizer: {
        root: [
          [/#.*$/, 'comment'],
          [/\b(?:IF|THEN|ELIF|ELSE|END|AND|OR|NOT)\b/, 'keyword'],
          [/\b(?:BUY|SELL)\b/, 'keyword.control'],
          [/\b(?:TRUE|FALSE)\b/, 'constant.language'],
          [/\b\d+\.?\d*\b/, 'number'],
          [/[<>=!]+/, 'operator'],
          [/[+\-*/%]/, 'operator'],
          [/[()]/, 'delimiter.parenthesis'],
        ]
      }
    });
    
    registerMonacoThemes(monaco);
    
    // Register completion provider for autocomplete
    monaco.languages.registerCompletionItemProvider('tradingFormula', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        
        const suggestions = [
          // Keywords
          ...['IF', 'THEN', 'ELIF', 'ELSE', 'END', 'AND', 'OR', 'NOT'].map(keyword => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
            documentation: `Keyword: ${keyword}`
          })),
          
          // Actions
          ...['BUY', 'SELL'].map(action => ({
            label: action,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${action} = True`,
            range: range,
            documentation: `Action: ${action}`
          })),
          
          // Variables from indicators
          ...availableVars.map(varName => ({
            label: varName,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: varName,
            range: range,
            documentation: `Variable: ${varName}`
          })),
          
          // Operators
          ...['>', '<', '>=', '<=', '==', '!='].map(op => ({
            label: op,
            kind: monaco.languages.CompletionItemKind.Operator,
            insertText: op,
            range: range,
            documentation: `Operator: ${op}`
          })),
          
          // Snippets
          {
            label: 'if-then',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'IF ${1:condition} THEN\n  ${2:action}\nEND',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            documentation: 'IF-THEN statement'
          }
        ];
        
        return { suggestions };
      }
    });
  }, [availableVars]);
  
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'line',
      renderWhitespace: 'none',
      automaticLayout: true,
      'semanticHighlighting.enabled': false,
    });
    
    monaco.editor.setTheme(getMonacoThemeId());
  }, []);
  
  // Convert code to table rules
  const parseCodeToRules = useCallback((code) => {
    const rules = [];
    const lines = (code || '').split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    
    let currentConditions = [];
    let currentAction = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('IF ')) {
        // Parse condition
        const condPart = line.replace('IF ', '').replace(' THEN', '').trim();
        const conditions = parseConditions(condPart);
        currentConditions = conditions;
        
        // Check if action is on the same line
        if (line.includes('THEN') && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.includes('BUY') || nextLine.includes('SELL')) {
            currentAction = nextLine.includes('BUY') ? 'BUY' : 'SELL';
            rules.push({
              id: Date.now() + rules.length,
              conditions: currentConditions,
              action: currentAction
            });
            currentConditions = [];
            currentAction = null;
          }
        }
      } else if (line.includes('BUY') || line.includes('SELL')) {
        currentAction = line.includes('BUY') ? 'BUY' : 'SELL';
        if (currentConditions.length > 0) {
          rules.push({
            id: Date.now() + rules.length,
            conditions: currentConditions,
            action: currentAction
          });
          currentConditions = [];
          currentAction = null;
        }
      }
    }
    
    return rules;
  }, []);
  
  // Parse conditions string
  const parseConditions = (condStr) => {
    const conditions = [];
    const parts = condStr.split(/\s+(AND|OR)\s+/);
    
    for (let i = 0; i < parts.length; i += 2) {
      const part = parts[i].trim().replace(/[()]/g, '');
      const logic = i > 0 ? parts[i - 1] : 'AND';
      
      // Parse condition: variable operator value
      const match = part.match(/(\S+)\s*([><=!]+)\s*(.+)/);
      if (match) {
        conditions.push({
          variable: match[1],
          operator: match[2],
          value: match[3],
          logic: logic
        });
      }
    }
    
    return conditions;
  };
  
  // Convert table rules to code (legacy IF-THEN format)
  const convertRulesToCode = useCallback((rules) => {
    if (!rules || rules.length === 0) {
      return '# Define your trading signals\n';
    }
    
    let code = '# Trading signals\n\n';
    
    rules.forEach((rule, index) => {
      // Build conditions
      const conditionsStr = rule.conditions.map((cond, i) => {
        const prefix = i > 0 ? ` ${cond.logic} ` : '';
        return `${prefix}${cond.variable} ${cond.operator} ${cond.value}`;
      }).join('');
      
      code += `# Rule ${index + 1}\n`;
      code += `IF ${conditionsStr} THEN\n`;
      code += `  ${rule.action} = True\n`;
      code += `END\n\n`;
    });
    
    return code;
  }, []);
  
  // Generate Python code for Freqtrade from table rules
  // mode: "signal" | "entry" | "exit" | "risk"
  const generatePythonSignalCode = useCallback((rules, mode = "signal") => {
    const isEntryMode = mode === "entry";
    const isExitMode = mode === "exit";
    const isRiskMode = mode === "risk";

    if (!rules || rules.length === 0) {
      if (isEntryMode) {
        // Старый шаблон для Entry formulas
        return `def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    """
    Populate entry trend signals.
    Add your signal conditions here.
    """
    # Initialize signal column
    dataframe.loc[:, 'signal'] = False
    
    return dataframe
`;
      }
      if (isExitMode) {
        return `def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    """
    Populate exit trend signals.
    Add your signal conditions here.
    """
    # Initialize signal column
    dataframe.loc[:, 'signal'] = False
    
    return dataframe
`;
      }
      if (isRiskMode) {
        return `def custom_stoploss(self, pair: str, trade, current_time, current_rate, current_profit, **kwargs):
    """
  Risk management: stop-loss, take-profit, position sizing (mock).
  """
    return -0.02  # 2% stop-loss

def custom_exit(self, pair: str, trade, current_time, current_rate, current_profit, **kwargs):
    """Optional take-profit / trailing rules."""
    return None
`;
      }

      // Новый шаблон для Signal
      return `def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    """
    Populate signals.
    Based on the following conditions:
    - Rule 1: Close > Close
    """
    # Initialize signal column
    dataframe.loc[:, 'signal'] = False
    
    # Rule 1
    condition1 = (dataframe['Close'] > dataframe['Close'])
    dataframe.loc[condition1, 'signal'] = True

    return dataframe
`;
    }
    
    let code;
    if (isEntryMode) {
      // Старый заголовок для Entry
      code = `def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    """
    Populate entry trend signals.
    Based on the following conditions:
`;
    } else if (isExitMode) {
      code = `def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    """
    Populate exit trend signals.
    Based on the following conditions:
`;
    } else {
      // Новый заголовок для Signal
      code = `def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    """
    Populate signals.
    Based on the following conditions:
`;
    }
    
    // Add rule descriptions
    rules.forEach((rule, index) => {
      const conditionsDesc = rule.conditions.map((cond, i) => {
        const prefix = i > 0 ? ` ${cond.logic} ` : '';
        return `${prefix}${cond.variable} ${cond.operator} ${cond.value}`;
      }).join('');
      code += `    - Rule ${index + 1}: ${conditionsDesc}\n`;
    });
    
    code += `    """
    # Initialize signal column
    dataframe.loc[:, 'signal'] = False
    
`;
    
    // Generate conditions for each rule
    rules.forEach((rule, index) => {
      code += `    # Rule ${index + 1}\n`;
      
      // Build Python condition expression with each condition on a new line
      if (rule.conditions.length === 1) {
        // Single condition - keep it on one line
        const cond = rule.conditions[0];
        
        // Handle value - could be a number or another dataframe column
        let valueExpr;
        const valueStr = String(cond.value).trim();
        
        // Check if it's a dataframe column (starts with indicator prefix or is a price column)
        if (['Close', 'Open', 'High', 'Low', 'Volume'].includes(valueStr) || 
            valueStr.startsWith('ema_') || valueStr.startsWith('rsi_') || 
            valueStr.startsWith('macd_') || valueStr.startsWith('bb_') || 
            valueStr.startsWith('gc_') || valueStr.startsWith('custom_')) {
          // It's a dataframe column
          valueExpr = `dataframe['${valueStr}']`;
        } else {
          // Check if it's a numeric value
          const numValue = parseFloat(valueStr);
          if (!isNaN(numValue) && isFinite(numValue)) {
            // It's a numeric value
            valueExpr = numValue.toString();
          } else {
            // It's a string value (shouldn't happen in normal flow, but handle it)
            valueExpr = `'${valueStr}'`;
          }
        }
        
        // Handle operator conversion
        let operator = cond.operator;
        if (operator === '=') operator = '==';
        
        code += `    condition${index + 1} = (dataframe['${cond.variable}'] ${operator} ${valueExpr})\n`;
      } else {
        // Multiple conditions - each on a new line
        code += `    condition${index + 1} = (\n`;
        
        rule.conditions.forEach((cond, i) => {
          const logicOp = cond.logic === 'OR' ? '|' : '&';
          
          // Handle value - could be a number or another dataframe column
          let valueExpr;
          const valueStr = String(cond.value).trim();
          
          // Check if it's a dataframe column (starts with indicator prefix or is a price column)
          if (['Close', 'Open', 'High', 'Low', 'Volume'].includes(valueStr) || 
              valueStr.startsWith('ema_') || valueStr.startsWith('rsi_') || 
              valueStr.startsWith('macd_') || valueStr.startsWith('bb_') || 
              valueStr.startsWith('gc_') || valueStr.startsWith('custom_')) {
            // It's a dataframe column
            valueExpr = `dataframe['${valueStr}']`;
          } else {
            // Check if it's a numeric value
            const numValue = parseFloat(valueStr);
            if (!isNaN(numValue) && isFinite(numValue)) {
              // It's a numeric value
              valueExpr = numValue.toString();
            } else {
              // It's a string value (shouldn't happen in normal flow, but handle it)
              valueExpr = `'${valueStr}'`;
            }
          }
          
          // Handle operator conversion
          let operator = cond.operator;
          if (operator === '=') operator = '==';
          
          if (i === 0) {
            // First condition
            code += `        (dataframe['${cond.variable}'] ${operator} ${valueExpr})`;
          } else {
            // Subsequent conditions with logic operator
            code += ` ${logicOp}\n        (dataframe['${cond.variable}'] ${operator} ${valueExpr})`;
          }
        });
        
        code += `\n    )\n`;
      }
      
      code += `    dataframe.loc[condition${index + 1}, 'signal'] = True\n\n`;
    });
    
    code += `    return dataframe
`;
    
    return code;
  }, []);
  
  // Generate Python code when table rules change
  useEffect(() => {
    if (tableRules.length > 0) {
      const pythonCode = generatePythonSignalCode(tableRules, mode);
      setGeneratedPythonCode(pythonCode);
      if (!pythonCodeManuallyEdited) {
        onChange(pythonCode);
      }
    }
  }, [tableRules, generatePythonSignalCode, pythonCodeManuallyEdited, onChange, mode]);
  
  // Handle mode switch
  const handleModeSwitch = useCallback((newMode) => {
    if (newMode === 'table') setAliasesOpen(false);
    if (newMode === 'table' && editorMode === 'python') {
      // Switching from Python to Table - keep table rules as is
      // (no conversion needed, table rules are source of truth)
    } else if (newMode === 'python' && editorMode === 'table') {
      // Switching from Table to Python - generate Python code from table rules
      const pythonCode = generatePythonSignalCode(tableRules, mode);
      setGeneratedPythonCode(pythonCode);
      setPythonCodeManuallyEdited(false);
      onChange(pythonCode);
    }
    setEditorMode(newMode);
  }, [editorMode, tableRules, generatePythonSignalCode, onChange, mode]);
  
  // Handle table rules update
  const handleTableRulesChange = useCallback((newRules) => {
    setTableRules(newRules);
    // Python code will be regenerated via useEffect
  }, []);
  
  // Handle Python code manual edit
  const handlePythonCodeChange = useCallback((newCode) => {
    setPythonCodeManuallyEdited(true);
    onChange(newCode);
  }, [onChange]);
  
  // Reset to generated Python code
  const handleResetPythonCode = useCallback(() => {
    setPythonCodeManuallyEdited(false);
    onChange(generatedPythonCode);
  }, [generatedPythonCode, onChange]);

  const monacoTheme = getMonacoThemeId();
  const editorReadOnly = editingLocked;

  const renderModeSwitcher = () => {
    const btnClass = (targetMode) => {
      const active = editorMode === targetMode;
      return active
        ? "bg-violet-700 text-[#faf7fd]"
        : "text-[#b8aecc] hover:text-[#faf7fd]";
    };

    return (
      <div className="inline-flex items-center rounded-lg bg-[#251937] p-0.5">
        <button
          type="button"
          onClick={() => handleModeSwitch("python")}
          className={cx(
            "inline-flex h-7 items-center gap-1.5 px-3 transition-colors text-[11px]",
            btnClass("python"),
          )}
          title="Python Code Editor"
        >
          <CodeModeIcon className="h-3.5 w-3.5 shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch("table")}
          className={cx(
            "inline-flex h-7 items-center gap-1.5 px-3 transition-colors text-[11px] border-l border-[#303030]",
            btnClass("table"),
          )}
          title="Builder"
        >
          <BuilderModeIcon className="h-3.5 w-3.5 shrink-0" />
          Builder
        </button>
      </div>
    );
  };

  const renderTips = () => (
    <div
      className={cx(
        "px-3 py-2 text-[10px] border-0 border-t",
        ui.divider,
        "border-l-4",
        successAccent.borderL,
        successAccent.bg,
        successAccent.text,
      )}
    >
      💡 <strong>Tips:</strong> Click &quot;Add New Rule&quot; to create trading conditions •{" "}
      Combine multiple conditions with{" "}
      <code className="text-[var(--crm-success)]">AND</code>/
      <code className="text-[var(--crm-success)]">OR</code> • Switch to Code mode to see generated formula
    </div>
  );

  const editorOptions = {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: "line",
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
    readOnly: editorReadOnly,
    "semanticHighlighting.enabled": false,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        {renderModeSwitcher()}
          {editorMode === "python" && pythonCodeManuallyEdited && (
            <button
              type="button"
              onClick={handleResetPythonCode}
              className="h-7 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 text-[10px] text-amber-200 hover:bg-amber-500/20"
              title="Reset to auto-generated code"
            >
              Reset
            </button>
          )}
        </div>

        {editingLocked && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-[#2a1f0a] px-3 py-2.5 text-[11px] text-amber-200">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <span>
              Hyperopt results exist. Signal editing is locked to preserve optimization integrity.
            </span>
          </div>
        )}

        {editorMode === "python" ? (
          <>
            {pythonCodeManuallyEdited && !editingLocked && (
              <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                ⚠️ <strong>Warning:</strong> This code has been manually edited. Changes made in Builder mode will overwrite your manual edits.{" "}
                <button type="button" onClick={handleResetPythonCode} className="underline hover:text-amber-100">
                  Reset
                </button>{" "}
                to restore auto-generated code.
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-[rgba(60,40,80,0.35)]">
              <div className="flex" style={{ height: 400 }}>
                  <div className="relative min-w-0 flex-1 bg-[#110e1f]" style={{ height: 400 }}>
                  <div className="pointer-events-none absolute right-2 top-2 z-10">
                    <button
                      type="button"
                      onClick={() => setAliasesOpen((v) => !v)}
                      className={cx(
                        "pointer-events-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                        aliasesOpen
                          ? cx(crmAccent.bg, crmAccent.textMuted)
                          : "text-[#b8aecc] hover:text-[#ddd6fe]",
                      )}
                      title="View indicator aliases"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M8.12 8.12 12 12M8.12 15.88 12 12M12 12h8" />
                      </svg>
                      Aliases
                    </button>
                  </div>
                  <Editor
                    height="400px"
                    defaultLanguage="python"
                    language="python"
                    theme={monacoTheme}
                    value={value}
                    onChange={(newValue) => handlePythonCodeChange(newValue || "")}
                    beforeMount={handleEditorWillMount}
                    onMount={handleEditorDidMount}
                    loading={<div className="h-full w-full bg-[#110e1f]" />}
                    options={editorOptions}
                  />
                </div>
                <IndicatorAliasesPanel
                  indicators={indicators}
                  open={aliasesOpen}
                  onClose={() => setAliasesOpen(false)}
                  className="h-[400px]"
                />
              </div>

              <div className="flex items-center justify-between border-t border-[rgba(60,40,80,0.35)] px-3 py-2.5">
                <span className={cx("inline-flex items-center gap-1.5 text-[11px] font-medium", successAccent.text)}>
                  <CheckIcon className="h-3.5 w-3.5" />
                  Validated
                </span>
                <button type="button" className={cx(ui.btnPrimary, "h-8 px-4 text-[11px]")}>
                  Validate
                </button>
              </div>
            </div>

            {renderTips("prod")}
          </>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-[rgba(60,40,80,0.35)] p-3" style={{ maxHeight: "600px", overflowY: "auto" }}>
              <TableBasedEditor
                rules={tableRules}
                onChange={handleTableRulesChange}
                groupedVars={groupedVars}
              />
            </div>
            {renderTips()}
          </>
        )}
      </div>
    );
});