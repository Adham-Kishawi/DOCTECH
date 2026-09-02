"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

export interface NavItem {
  href: string;
  labelEn: string;
  labelAr: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  role: "doctor" | "secretary";
  locale: string;
  isRTL: boolean;
  pathname: string;
  activeColor: string; // "#3368A0" for doctor, "#36ADA3" for secretary
}

export function MobileSidebar({
  isOpen,
  onClose,
  navItems,
  role,
  locale,
  isRTL,
  pathname,
  activeColor,
}: MobileSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 z-50 w-[260px] flex flex-col bg-white dark:bg-[#131E2E] shadow-2xl transition-transform duration-300 ease-out md:hidden",
          isRTL ? "right-0" : "left-0",
          isOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full"
            : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <Logo size={32} />
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, labelEn, labelAr, icon: Icon }) => {
            const isActive = pathname.includes(`/${role}/${href}`);
            return (
              <Link
                key={href}
                href={`/${locale}/${role}/${href}`}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                  isActive
                    ? "text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
                style={isActive ? { backgroundColor: activeColor } : undefined}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-white" : "text-slate-400"}
                />
                <span>{isRTL ? labelAr : labelEn}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href={`/${locale}/${role}/profile`}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
              pathname.includes(`/${role}/profile`)
                ? "text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
            style={
              pathname.includes(`/${role}/profile`)
                ? { backgroundColor: activeColor }
                : undefined
            }
          >
            <User size={18} />
            <span>{isRTL ? "الملف الشخصي" : "Profile"}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
