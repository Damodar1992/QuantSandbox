import React, { memo } from "react";

export const MoreIcon = memo(({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="5" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="19" r="1.6" fill="currentColor" />
  </svg>
));

export const EyeIcon = memo(({ className = "h-3.5 w-3.5" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.9" />
  </svg>
));

const menuIconPaths = {
  Strategies: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15l4-4 3 3 5-7" />
      <circle cx="7" cy="15" r="1.4" />
      <circle cx="11" cy="11" r="1.4" />
      <circle cx="14" cy="14" r="1.4" />
      <circle cx="19" cy="7" r="1.4" />
    </>
  ),
  Backtesting: (
    <>
      <path d="M12 6v6l4 2" />
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 5v4h-4" />
    </>
  ),
  Users: (
    <>
      <path d="M20 21a7 7 0 0 0-14 0" />
      <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
    </>
  ),
  Indicators: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15l4-4 3 3 5-7" />
      <circle cx="7" cy="15" r="1.4" />
      <circle cx="11" cy="11" r="1.4" />
      <circle cx="14" cy="14" r="1.4" />
    </>
  ),
  Settings: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </>
  ),
};

export const MenuIcon = memo(({ name, active }) => {
  const stroke = active ? "#34d399" : "#a6a6a6";
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <g {...common}>{menuIconPaths[name] ?? menuIconPaths.Users}</g>
    </svg>
  );
});
