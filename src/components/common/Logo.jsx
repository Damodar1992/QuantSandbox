import React, { memo } from "react";
import logoImg from "../../assets/quant-sandbox-logo.png";

export const Logo = memo(({ className = "h-9 w-auto max-w-[180px]" }) => {
  return <img src={logoImg} alt="QuantSandbox logo" className={className} />;
});
