import React, { memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const AppSelect = memo(function AppSelect({
  label,
  value,
  onValueChange,
  placeholder = "Select…",
  options = [],
  className,
  triggerClassName,
  size = "sm",
  disabled = false,
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {label ? <Label className="text-xs text-muted-foreground">{label}</Label> : null}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger size={size} className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});
