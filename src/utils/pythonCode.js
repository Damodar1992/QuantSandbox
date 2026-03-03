export function generatePythonCode(indicators) {
  if (indicators.length === 0) {
    return "# No indicators added yet\n# Add indicators from the library to generate code";
  }

  const lines = [];
  lines.push("def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:");
  lines.push("    # Auto-generated from Indicators Builder");
  lines.push("    # This code generates ALL combinations of parameters for hyperoptimization");
  lines.push("");

  indicators.forEach(ind => {
    if (!ind.enabled) {
      lines.push(`    # ${ind.name} (disabled)`);
      return;
    }

    const src = ind.source.toLowerCase();
    const displayName = ind.displayName || (ind.type === "RSI" ? "rsi" : ind.type === "EMA" ? "ema" : ind.type === "MACD" ? "macd" : ind.type === "BBANDS" ? "bb" : ind.type === "GC_DW" ? "gc" : ind.type.toLowerCase());

    lines.push(`    # ${ind.name} - ${ind.type} (displayName: ${displayName})`);

    const hasRanges = ind.params.some(p => p.min !== p.max);

    if (hasRanges) {
      lines.push(`    # Generating all combinations for optimization:`);
      ind.params.forEach(p => {
        if (p.min !== p.max) {
          const count = Math.floor((p.max - p.min) / p.step) + 1;
          lines.push(`    #   ${p.key}: ${p.min} to ${p.max}, step ${p.step} (${count} values)`);
        }
      });
    }

    switch (ind.type) {
      case "GC_DW": {
        const gcParams = ind.params.reduce((acc, p) => ({ ...acc, [p.key]: p }), {});
        const hasGcRanges = Object.values(gcParams).some(p => p.min !== p.max);

        if (hasGcRanges) {
          lines.push(`    for length in range(${gcParams.length.min}, ${gcParams.length.max + 1}, ${gcParams.length.step}):`);
          lines.push(`        for poles in range(${gcParams.poles.min}, ${gcParams.poles.max + 1}, ${gcParams.poles.step}):`);
          lines.push(`            mult = ${gcParams.mult.default}  # Fixed for now`);
          lines.push(`            gc_mid, gc_upper, gc_lower = gaussian_channel(dataframe['${src}'], length=length, poles=poles, mult=mult)`);
          lines.push(`            dataframe[f'${displayName}_mid_l{length}_p{poles}'] = gc_mid`);
          lines.push(`            dataframe[f'${displayName}_upper_l{length}_p{poles}'] = gc_upper`);
          lines.push(`            dataframe[f'${displayName}_lower_l{length}_p{poles}'] = gc_lower`);
        } else {
          lines.push(`    gc_mid, gc_upper, gc_lower = gaussian_channel(dataframe['${src}'], length=${gcParams.length.default}, poles=${gcParams.poles.default}, mult=${gcParams.mult.default})`);
          lines.push(`    dataframe['${displayName}_mid'] = gc_mid`);
          lines.push(`    dataframe['${displayName}_upper'] = gc_upper`);
          lines.push(`    dataframe['${displayName}_lower'] = gc_lower`);
        }
        break;
      }
      case "EMA": {
        const emaParam = ind.params.find(p => p.key === "timeperiod");
        if (emaParam.min !== emaParam.max) {
          lines.push(`    for period in range(${emaParam.min}, ${emaParam.max + 1}, ${emaParam.step}):`);
          lines.push(`        dataframe[f'${displayName}_${src}_{period}'] = ta.EMA(dataframe['${src}'], timeperiod=period)`);
        } else {
          lines.push(`    dataframe['${displayName}_${src}_${emaParam.default}'] = ta.EMA(dataframe['${src}'], timeperiod=${emaParam.default})`);
        }
        break;
      }
      case "RSI": {
        const rsiParam = ind.params.find(p => p.key === "timeperiod");
        if (rsiParam.min !== rsiParam.max) {
          lines.push(`    for period in range(${rsiParam.min}, ${rsiParam.max + 1}, ${rsiParam.step}):`);
          lines.push(`        dataframe[f'${displayName}_${src}_{period}'] = ta.RSI(dataframe['${src}'], timeperiod=period)`);
        } else {
          lines.push(`    dataframe['${displayName}_${src}_${rsiParam.default}'] = ta.RSI(dataframe['${src}'], timeperiod=${rsiParam.default})`);
        }
        break;
      }
      case "MACD": {
        const macdParams = ind.params.reduce((acc, p) => ({ ...acc, [p.key]: p }), {});
        const hasMacdRanges = Object.values(macdParams).some(p => p.min !== p.max);

        if (hasMacdRanges) {
          lines.push(`    for fast in range(${macdParams.fastperiod.min}, ${macdParams.fastperiod.max + 1}, ${macdParams.fastperiod.step}):`);
          lines.push(`        for slow in range(${macdParams.slowperiod.min}, ${macdParams.slowperiod.max + 1}, ${macdParams.slowperiod.step}):`);
          lines.push(`            for signal in range(${macdParams.signalperiod.min}, ${macdParams.signalperiod.max + 1}, ${macdParams.signalperiod.step}):`);
          lines.push(`                macd, macd_signal, macd_hist = ta.MACD(dataframe['${src}'], fastperiod=fast, slowperiod=slow, signalperiod=signal)`);
          lines.push(`                dataframe[f'${displayName}_${src}_f{fast}_s{slow}_sig{signal}'] = macd`);
          lines.push(`                dataframe[f'${displayName}_signal_${src}_f{fast}_s{slow}_sig{signal}'] = macd_signal`);
          lines.push(`                dataframe[f'${displayName}_hist_${src}_f{fast}_s{slow}_sig{signal}'] = macd_hist`);
        } else {
          lines.push(`    macd, signal, hist = ta.MACD(dataframe['${src}'], fastperiod=${macdParams.fastperiod.default}, slowperiod=${macdParams.slowperiod.default}, signalperiod=${macdParams.signalperiod.default})`);
          lines.push(`    dataframe['${displayName}_${src}'] = macd`);
          lines.push(`    dataframe['${displayName}_signal_${src}'] = signal`);
          lines.push(`    dataframe['${displayName}_hist_${src}'] = hist`);
        }
        break;
      }
      case "BBANDS": {
        const bbParams = ind.params.reduce((acc, p) => ({ ...acc, [p.key]: p }), {});
        const hasBbRanges = bbParams.timeperiod.min !== bbParams.timeperiod.max;

        if (hasBbRanges) {
          lines.push(`    for period in range(${bbParams.timeperiod.min}, ${bbParams.timeperiod.max + 1}, ${bbParams.timeperiod.step}):`);
          lines.push(`        upper, middle, lower = ta.BBANDS(dataframe['${src}'], timeperiod=period, nbdevup=${bbParams.nbdevup.default}, nbdevdn=${bbParams.nbdevdn.default}, matype=${bbParams.matype.default})`);
          lines.push(`        dataframe[f'${displayName}_upper_${src}_{period}'] = upper`);
          lines.push(`        dataframe[f'${displayName}_middle_${src}_{period}'] = middle`);
          lines.push(`        dataframe[f'${displayName}_lower_${src}_{period}'] = lower`);
          lines.push(`        dataframe[f'${displayName}_width_${src}_{period}'] = (upper - lower) / middle`);
        } else {
          lines.push(`    upper, middle, lower = ta.BBANDS(dataframe['${src}'], timeperiod=${bbParams.timeperiod.default}, nbdevup=${bbParams.nbdevup.default}, nbdevdn=${bbParams.nbdevdn.default}, matype=${bbParams.matype.default})`);
          lines.push(`    dataframe['${displayName}_upper_${src}'] = upper`);
          lines.push(`    dataframe['${displayName}_middle_${src}'] = middle`);
          lines.push(`    dataframe['${displayName}_lower_${src}'] = lower`);
          lines.push(`    dataframe['${displayName}_width_${src}'] = (upper - lower) / middle`);
        }
        break;
      }
      case "CUSTOM_FORMULA":
        if (ind.customFormula) {
          lines.push(`    # Custom Formula: ${displayName}`);
          const formulaLines = ind.customFormula.split("\n").filter(line => line.trim());
          formulaLines.forEach(line => {
            lines.push(`    ${line}`);
          });
        } else {
          lines.push(`    # Custom Formula: ${displayName} (no formula provided)`);
        }
        break;
    }

    lines.push("");
  });

  lines.push("    return dataframe");
  return lines.join("\n");
}
