import React, { memo } from "react";
import { ChevronDown, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppButton } from "@/components/common/AppButton";

/** Stub export menu — items are mock-only, no file is generated. */
export const ExportExcelMenu = memo(function ExportExcelMenu({ disabled }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <AppButton type="button" variant="outline" size="sm" disabled={disabled}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export Excel
          <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
        </AppButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[168px]">
        <DropdownMenuItem className="text-xs">Export Metrics</DropdownMenuItem>
        <DropdownMenuItem className="text-xs">Export RAW data</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
