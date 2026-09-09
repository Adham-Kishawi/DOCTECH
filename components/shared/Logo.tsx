"use client";

import React from "react";

interface LogoProps {
  variant?: "horizontal" | "vertical" | "symbol";
  mode?: "auto" | "light" | "dark" | "reverse";
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({
  variant = "horizontal",
  mode = "auto",
  size = 36,
  className = "",
  showText = true,
}: LogoProps) {
  // DOCTECH Official Brand Palette:
  // Teal: #36ADA3 | Primary Blue: #3368A0 | Dark Navy: #0B131E

  const isLight = mode === "light";
  const isDark = mode === "dark";
  const isReverse = mode === "reverse";

  // Segment Color:
  // In Light mode: DOCTECH BLUE #3368A0
  // In Dark mode: Pure White #FFFFFF
  // In Auto mode: #3368A0 in light, white in dark
  let strokeColorClass = "stroke-[#3368A0] dark:stroke-white";
  let textColorClass = "text-[#3368A0] dark:text-white";

  if (isLight) {
    strokeColorClass = "stroke-[#3368A0]";
    textColorClass = "text-[#3368A0]";
  } else if (isDark || isReverse) {
    strokeColorClass = "stroke-white";
    textColorClass = "text-white";
  }

  const renderSymbol = (symbolSize: number) => (
    <svg
      width={symbolSize}
      height={symbolSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200"
    >
      {/* 1. Teal Connector Line */}
      <line
        x1="20"
        y1="20"
        x2="48"
        y2="20"
        stroke="#36ADA3"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* 2. Top-Left Healthcare Teal Dot */}
      <circle cx="20" cy="20" r="10" fill="#36ADA3" />

      {/* 3. Top-Right Arc Segment */}
      <path
        d="M 46 20 L 66 20 A 16 16 0 0 1 82 36 L 82 38"
        fill="none"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeColorClass}
      />

      {/* 4. Bottom-Right Arc Segment */}
      <path
        d="M 82 62 L 82 64 A 16 16 0 0 1 66 80 L 56 80"
        fill="none"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeColorClass}
      />

      {/* 5. Left & Bottom-Left 'L' Stem */}
      <path
        d="M 20 38 L 20 64 A 16 16 0 0 0 36 80 L 40 80"
        fill="none"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeColorClass}
      />
    </svg>
  );

  if (variant === "symbol" || !showText) {
    return <div className={`inline-flex items-center ${className}`}>{renderSymbol(size)}</div>;
  }

  if (variant === "vertical") {
    return (
      <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
        {renderSymbol(size)}
        <span
          className={`font-black tracking-widest leading-none ${textColorClass}`}
          style={{ fontSize: `${Math.max(14, size * 0.36)}px`, letterSpacing: "0.18em" }}
        >
          DOCTECH
        </span>
      </div>
    );
  }

  // Horizontal Lockup (Default)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {renderSymbol(size)}
      <div className="flex flex-col">
        <span
          className={`font-black tracking-wider leading-none ${textColorClass}`}
          style={{ fontSize: `${Math.max(16, size * 0.52)}px`, letterSpacing: "0.12em" }}
        >
          DOCTECH
        </span>
        <span className="text-[9px] font-bold tracking-widest text-[#36ADA3] uppercase mt-0.5">
          Clinic OS
        </span>
      </div>
    </div>
  );
}