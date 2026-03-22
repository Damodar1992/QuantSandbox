import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { cx, ui } from "../../../constants/ui";
import { TableBasedEditor } from "./TableBasedEditor";
import { getDefaultDisplayName } from "../utils/indicatorHelpers";
export const FormulaEditor = memo(({ value, onChange, indicators, mode = "signal" }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [editorMode, setEditorMode] = useState('python'); // 'python' | 'table'
  const [tableRules, setTableRules] = useState([]);
  const [pythonCodeManuallyEdited, setPythonCodeManuallyEdited] = useState(false);
  const [generatedPythonCode, setGeneratedPythonCode] = useState('');
  
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
    
    indicators.forEach(ind => {
      if (!ind.enabled) return;
      
      const src = ind.source.toLowerCase();
      const displayName = ind.displayName || getDefaultDisplayName(ind.type);
      
      // Add simple indicator variables without parameter details
      if (ind.type === "RSI") {
        vars.add(`${displayName}_${src}`);
      } else if (ind.type === "EMA") {
        vars.add(`${displayName}_${src}`);
      } else if (ind.type === "MACD") {
        vars.add(`${displayName}`);
        vars.add(`${displayName}_signal`);
        vars.add(`${displayName}_hist`);
      } else if (ind.type === "BBANDS") {
        vars.add(`${displayName}_upper`);
        vars.add(`${displayName}_middle`);
        vars.add(`${displayName}_lower`);
        vars.add(`${displayName}_width`);
      } else if (ind.type === "GC_DW") {
        vars.add(`${displayName}_mid`);
        vars.add(`${displayName}_upper`);
        vars.add(`${displayName}_lower`);
      } else if (ind.type === "CUSTOM_FORMULA") {
        // For custom formulas, add a generic variable
        vars.add(`${displayName}`);
      }
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
    
    // Define theme
    monaco.editor.defineTheme('tradingDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'keyword.control', foreground: '10B981', fontStyle: 'bold' },
        { token: 'constant.language', foreground: '569CD6' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#0f0f0f',
        'editor.foreground': '#d9d9d9',
        'editorLineNumber.foreground': '#595959',
        'editor.lineHighlightBackground': '#1f1f1f',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#10B981',
      }
    });
    
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
      renderLineHighlight: 'all',
      renderWhitespace: 'none',
      automaticLayout: true,
    });
    
    // Set dark theme for Python editor
    monaco.editor.setTheme('vs-dark');
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
  // mode: "signal" | "entry" — для Entry оставляем старый шаблон populate_entry_trend
  const generatePythonSignalCode = useCallback((rules, mode = "signal") => {
    const isEntryMode = mode === "entry";

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
  
  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className={cx("flex items-center justify-between px-3 py-2", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="flex-1">
          <div className="text-[12px] font-medium text-[#d9d9d9]">
            {mode === "entry" ? "Entry formulas" : "Signal Formulas"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex border border-[#303030] rounded overflow-hidden">
            <button
              onClick={() => handleModeSwitch('python')}
              className={cx(
                "h-7 px-3 text-[10px] transition-colors",
                editorMode === 'python' 
                  ? "bg-emerald-500/20 text-emerald-300 font-medium" 
                  : "bg-[#1a1a1a] text-[#8c8c8c] hover:text-[#d9d9d9]"
              )}
              title="Python Code Editor"
            >
              🐍 Python
            </button>
            <button
              onClick={() => handleModeSwitch('table')}
              className={cx(
                "h-7 px-3 text-[10px] transition-colors border-l border-[#303030] inline-flex items-center gap-1.5",
                editorMode === 'table' 
                  ? "bg-emerald-500/20 text-emerald-300 font-medium" 
                  : "bg-[#1a1a1a] text-[#8c8c8c] hover:text-[#d9d9d9]"
              )}
              title="Builder"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Builder
            </button>
          </div>
          
          {editorMode === 'python' && (
            <>
              {pythonCodeManuallyEdited && (
                <button 
                  onClick={handleResetPythonCode}
                  className={cx(ui.btn, "h-7 px-2 text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30")}
                  title="Reset to auto-generated code"
                >
                  Reset
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {editorMode === 'python' ? (
        <>
          {pythonCodeManuallyEdited && (
            <div className={cx("mx-3 mt-3 p-2 rounded border border-amber-500/30 bg-amber-500/10 text-[11px]", ui.textMuted)}>
              ⚠️ <strong>Warning:</strong> This code has been manually edited. Changes made in Table mode will overwrite your manual edits. 
              Click <button onClick={handleResetPythonCode} className="text-amber-300 underline hover:text-amber-200">Reset</button> to restore auto-generated code.
            </div>
          )}
          <div className="relative" style={{ height: '400px' }}>
            <Editor
              height="400px"
              defaultLanguage="python"
              language="python"
              theme="vs-dark"
              value={value}
              onChange={(newValue) => handlePythonCodeChange(newValue || '')}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 13,
                lineHeight: 20,
                fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight: 'all',
                renderWhitespace: 'none',
                automaticLayout: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                renderValidationDecorations: 'on',
                tabSize: 4,
                insertSpaces: true,
              }}
            />
          </div>
          
          <div className={cx("px-3 py-2 border-0 border-t", ui.divider, "flex justify-end")}>
            <button type="button" className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}>
              Validate
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="p-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <TableBasedEditor 
              rules={tableRules}
              onChange={handleTableRulesChange}
              groupedVars={groupedVars}
            />
          </div>
          
          <div className={cx("px-3 py-2 text-[10px]", ui.textMuted, "border-0 border-t", ui.divider)}>
            💡 <strong>Tips:</strong> Click "Add New Rule" to create trading conditions • 
            Combine multiple conditions with <code className="text-amber-300">AND</code>/<code className="text-amber-300">OR</code> • 
            Switch to Code mode to see generated formula
          </div>
        </>
      )}
    </div>
  );
});