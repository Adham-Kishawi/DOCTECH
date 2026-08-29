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
  // Official DOCTECH Brand Specification
  // DOCTECH BLUE: #3368A0 (or #285783) | HEALTHCARE TEAL: #36ADA3
  const isReverse = mode === "reverse";

  // Exact reproduction of the DOCTECH Connected Workflow Symbol
  const renderSymbol = (symbolSize: number) => (
    <svg
      width={symbolSize}
      height={symbolSize}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200"
    >
      {/* 1. Top Left Healthcare Teal Node */}
      <circle cx="28" cy="20" r="14" fill="#36ADA3" />

      {/* 2. Horizontal Connector Line */}
      <rect x="36" y="17.5" width="20" height="5" rx="2.5" fill="#36ADA3" />

      {/* 3. Top-Right Arc Segment */}
      <path
        d="M52 10H82C98.5685 10 112 23.4315 112 40V44C112 47.866 108.866 51 105 51H93C89.134 51 86 47.866 86 44V34C86 28.4772 81.5228 24 76 24H52C48.134 24 45 20.866 45 17V17C45 13.134 48.134 10 52 10Z"
        fill={isReverse ? "#FFFFFF" : "currentColor"}
        className={isReverse ? "" : "text-[#3368A0] dark:text-white"}
      />

      {/* 4. Bottom-Right Arc Segment */}
      <path
        d="M86 69C86 65.134 89.134 62 93 62H105C108.866 62 112 65.134 112 69V76C112 92.5685 98.5685 106 82 106H52C48.134 106 45 102.866 45 99V99C45 95.134 48.134 92 52 92H76C81.5228 92 86 87.5228 86 82V69Z"
        fill={isReverse ? "#FFFFFF" : "currentColor"}
        className={isReverse ? "" : "text-[#3368A0] dark:text-white"}
      />

      {/* 5. Left Stem / L-Segment */}
      <path
        d="M16 42C16 38.134 19.134 35 23 35H37C40.866 35 44 38.134 44 42V88C44 91.866 40.866 95 37 95H23C19.134 95 16 91.866 16 88V42Z"
        fill={isReverse ? "#FFFFFF" : "currentColor"}
        className={isReverse ? "" : "text-[#3368A0] dark:text-white"}
      />
      <path
        d="M16 78C16 78 16 106 44 106H52C55.866 106 59 102.866 59 99V99C59 95.134 55.866 92 52 92H38C30.268 92 27 86 27 80V78H16Z"
        fill={isReverse ? "#FFFFFF" : "currentColor"}
        className={isReverse ? "" : "text-[#3368A0] dark:text-white"}
      />
    </svg>
  );

  const textColorClass = isReverse
    ? "text-white"
    : "text-[#3368A0] dark:text-white";

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

  // Horizontal Lockup (Primary Default)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderSymbol(size)}
      <div className="flex flex-col">
        <span
          className={`font-black tracking-wider leading-none ${textColorClass}`}
          style={{ fontSize: `${Math.max(16, size * 0.52)}px`, letterSpacing: "0.12em" }}
        >
          DOCTECH
        </span>
        <span className="text-[8.5px] font-bold tracking-widest text-[#36ADA3] uppercase mt-0.5">
          Clinic OS
        </span>
      </div>
    </div>
  );
}