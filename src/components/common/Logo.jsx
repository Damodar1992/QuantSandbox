import React, { memo, useId } from "react";

export const Logo = memo(({ className = "h-9 w-auto max-w-[180px]" }) => {
  const id = useId().replace(/:/g, "");
  const gradId = `qGradient-${id}`;
  return (
    <svg viewBox="0 0 1200 400" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="85" y1="72" x2="355" y2="325" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3AE9C9" />
          <stop offset="100%" stopColor="#24B89A" />
        </linearGradient>
      </defs>
      <g transform="translate(53 39)">
        <path d="M 156.5 314.4 A 155 155 0 1 1 279.6 269.6" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="37" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 279.6 269.6 L 351.6 318.6" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="37" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 62 215 L 88 167 L 119 228 L 153 107 L 185 172 L 235 68" fill="transparent" stroke="#FFFFFF" strokeWidth="9.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 235 68 L 234.5 92.2 L 216.5 83.5 Z" fill="#FFFFFF" />
      </g>
      <text x="475" y="137.5" fontFamily="Arial Black, Helvetica, sans-serif" fontSize="142" fontWeight="700" fill="#FFFFFF" letterSpacing="-3.2px" textAnchor="start">Quant</text>
      <text x="475" y="269.5" fontFamily="Arial Black, Helvetica, sans-serif" fontSize="142" fontWeight="700" fill="#FFFFFF" letterSpacing="-2.6px" textAnchor="start">Sandbox</text>
    </svg>
  );
});
