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
  size = 38,
  className = "",
  showText = true,
}: LogoProps) {
  // DOCTECH Official Brand Palette:
  // Primary Blue: #3368A0 | Healthcare Teal: #36ADA3 | Dark Blue: #285783

  const isLight = mode === "light";
  const isDark = mode === "dark";
  const isReverse = mode === "reverse";

  // Segment Color Classes:
  // In Light mode: DOCTECH BLUE #3368A0
  // In Dark mode: Pure White #FFFFFF
  // In Auto mode: #3368A0 in light, white in dark
  let segmentColorClass = "text-[#3368A0] dark:text-white";
  let textColorClass = "text-[#3368A0] dark:text-white";

  if (isLight) {
    segmentColorClass = "text-[#3368A0]";
    textColorClass = "text-[#3368A0]";
  } else if (isDark || isReverse) {
    segmentColorClass = "text-white";
    textColorClass = "text-white";
  }

  const renderSymbol = (symbolSize: number) => (
    <svg
      width={symbolSize}
      height={symbolSize}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200"
    >
      {/* 1. Healthcare Teal Top-Left Node */}
      <circle cx="30" cy="22" r="16" fill="#36ADA3" />

      {/* 2. Healthcare Teal Connector Line */}
      <rect x="42" y="19" width="22" height="6" rx="3" fill="#36ADA3" />

      {/* 3. Top-Right Arc Segment (Thick bold curve) */}
      <path
        d="M60 10H92C114.091 10 132 27.9086 132 50V56C132 60.4183 128.418 64 124 64H112C107.582 64 104 60.4183 104 56V44C104 37.3726 98.6274 32 92 32H60C55.5817 32 52 28.4183 52 24V18C52 13.5817 55.5817 10 60 10Z"
        fill="currentColor"
        className={segmentColorClass}
      />

      {/* 4. Bottom-Right Arc Segment */}
      <path
        d="M104 84C104 79.5817 107.582 76 112 76H124C128.418 76 132 79.5817 132 84V90C132 112.091 114.091 130 92 130H60C55.5817 130 52 126.418 52 122V116C52 111.582 55.5817 108 60 108H92C98.6274 108 104 102.627 104 96V84Z"
        fill="currentColor"
        className={segmentColorClass}
      />

      {/* 5. Left Main Stem & Bottom-Left Corner */}
      <path
        d="M14 48C14 43.5817 17.5817 40 22 40H34C38.4183 40 42 43.5817 42 48V100C42 104.418 45.5817 108 50 108H60C64.4183 108 68 111.582 68 116V122C68 126.418 64.4183 130 60 130H42C26.536 130 14 117.464 14 102V48Z"
        fill="currentColor"
        className={segmentColorClass}
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