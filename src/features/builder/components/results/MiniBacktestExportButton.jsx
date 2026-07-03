import React, { memo, useCallback } from "react";
import { AppButton } from "../../../../components/common/AppButton";
import { downloadMiniBacktestCsv } from "../../utils/miniBacktestExport";

export const MiniBacktestExportButton = memo(function MiniBacktestExportButton({ entry }) {
  const handleExport = useCallback(() => {
    if (entry) downloadMiniBacktestCsv(entry);
  }, [entry]);

  return (
    <AppButton type="button" variant="outline" size="sm" onClick={handleExport}>
      Export CSV
    </AppButton>
  );
});
