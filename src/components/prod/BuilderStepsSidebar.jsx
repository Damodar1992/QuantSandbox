import React, { memo } from "react";
import { BuilderStagePills } from "@/features/builder/layout/BuilderStagePills";

export const BuilderStepsSidebar = memo(function BuilderStepsSidebar(props) {
  return <BuilderStagePills {...props} />;
});
