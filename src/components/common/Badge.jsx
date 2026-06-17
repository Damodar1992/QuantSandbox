import React, { memo } from "react";
import { AppBadge } from "./AppBadge";

/** @deprecated Use AppBadge instead. */
export const Badge = memo(({ status, type = "status" }) => (
  <AppBadge status={status} type={type} />
));
