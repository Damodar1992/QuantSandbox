import React, { memo, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const AppInput = memo(function AppInput({
  label,
  id: idProp,
  className,
  labelClassName,
  wrapperClassName,
  ...props
}) {
  const autoId = useId();
  const id = idProp || autoId;

  return (
    <div className={cn("space-y-1", wrapperClassName)}>
      {label ? (
        <Label htmlFor={id} className={cn(labelClassName)}>
          {label}
        </Label>
      ) : null}
      <Input id={id} className={cn(className)} {...props} />
    </div>
  );
});
