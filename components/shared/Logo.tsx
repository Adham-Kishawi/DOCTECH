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
  // Colors from DOCTECH Brand Guidelines PDF
  // DOCTECH BLUE: #3368A0 | HEALTHCARE TEAL: #36ADA3 | DARK BLUE: #285783
  const isReverse = mode === "reverse";

  // Symbol Vector based on Page 3 "SYMBOL ONLY - Connected Workflow"
  const renderSymbol = (symbolSize: number) => (
    <svg
      width={symbolSize}
      height={symbolSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 hover:scale-105"
    >
      {/* Top Left Teal Connected Node */}
      <circle cx="28" cy="28" r="14" fill="#36ADA3" />

      {/* Connecting Bridge Line */}
      <rect x="36" y="24" width="22" height="8" rx="4" fill="#36ADA3" />

      {/* Top Right Segment */}
      <path
        d="M54 20H72C83.0457 20 92 28.9543 92 40V44C92 47.3137 89.3137 50 86 50H78C74.6863 50 72 47.3137 72 44V36H54C50.6863 36 48 33.3137 48 30V26C48 22.6863 50.6863 20 54 20Z"
        fill={isReverse ? "#FFFFFF" : "currentColor"}
        className={isReverse ? "" : "text-[#3368A0] dark:text-white"}
      />

      {/* Bottom Right Segment */}
      <path
        d="M72 64C72 60.6863 74.6863 58 78 58H86C89.3137 58 92 60.6863 92 64V68C92 79.0457 83.0457 88 72 88H54C50.6863 88 48 85.3137 48 82V78C48 74.6863 50.6863 72 54 72H72V64Z"
        fill={isReverse ? "#FFFFFF" : "currentColor"}
        className={isReverse ? "" : "text-[#3368A0] dark:text-white"}
      />

      {/* Left Main Stem / L-segment */}
      <path
        d="M20 44C20 40.6863 22.6863 38 26 38H34C37.3137 38 40 40.6863 40 44V72H54C57.3137 72 60 74.6863 60 78V82C60 85.3137 57.3137 88 54 88H36C27.1634 88 20 80.8366 20 72V44Z"
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
          style={{ fontSize: `${Math.max(14, size * 0.38)}px`, letterSpacing: "0.15em" }}
        >
          DOCTECH
        </span>
      </div>
    );
  }

  // Horizontal Lockup (Primary Default)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {renderSymbol(size)}
      <div className="flex flex-col">
        <span
          className={`font-black tracking-wider leading-none ${textColorClass}`}
          style={{ fontSize: `${Math.max(16, size * 0.55)}px`, letterSpacing: "0.08em" }}
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