import React, { memo, useMemo } from "react";
import { PAIR_OPTIONS } from "../../constants/app";
import { AppSelect } from "../common/AppSelect";

export const PairsDropdown = memo(({ value, onChange, disabled = false }) => {
  const options = useMemo(() => {
    const base = [...PAIR_OPTIONS];
    if (value && !base.includes(value)) base.unshift(value);
    return base.map((opt) => ({ value: opt, label: opt }));
  }, [value]);

  return (
    <AppSelect
      label="Pairs"
      value={value || ""}
      onValueChange={onChange}
      options={options}
      triggerClassName="h-9 text-xs"
      disabled={disabled}
    />
  );
});
