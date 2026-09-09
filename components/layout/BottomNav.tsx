"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavItem } from "./MobileSidebar";

interface BottomNavProps {
  items: NavItem[];
  role: "doctor" | "secretary";
  locale: string;
  isRTL: boolean;
  pathname: string;
  activeColor: string;
}

export function BottomNav({
  items,
  role,
  locale,
  isRTL,
  pathname,
  activeColor,
}: BottomNavProps) {
  // Show only the first 5 items on mobile bottom nav
  const visibleItems = items.slice(0, 5);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 md:hidden",
        "bg-white/95 dark:bg-[#131E2E]/95 backdrop-blur-xl",
        "border-t border-slate-200/80 dark:border-slate-800",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      )}
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {visibleItems.map(({ href, labelEn, labelAr, icon: Icon }) => {
          const isActive = pathname.includes(`/${role}/${href}`);
          return (
            <Link
              key={href}
              href={`/${locale}/${role}/${href}`}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 px-2 rounded-xl transition-all",
                isActive
                  ? "scale-105"
                  : "text-slate-400 dark:text-slate-500 active:scale-95"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                  isActive && "shadow-sm"
                )}
                style={
                  isActive
                    ? { backgroundColor: activeColor + "18", color: activeColor }
                    : undefined
                }
              >
                <Icon
                  size={20}
                  className={isActive ? undefined : "text-slate-400 dark:text-slate-500"}
                  color={isActive ? activeColor : undefined}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold leading-none truncate max-w-[60px]",
                  isActive ? "" : "text-slate-400 dark:text-slate-500"
                )}
                style={isActive ? { color: activeColor } : undefined}
              >
                {isRTL ? labelAr : labelEn}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for phones with bottom notch */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/95 dark:bg-[#131E2E]/95" />
    </nav>
  );
}
