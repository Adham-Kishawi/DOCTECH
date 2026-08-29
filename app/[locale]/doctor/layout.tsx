"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Calendar, CalendarCheck, BarChart2, MessageSquare, Bell, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "appointments", label: "Appointments", icon: CalendarCheck },
  { href: "schedule", label: "Schedule", icon: Calendar },
  { href: "reports", label: "Reports", icon: BarChart2 },
  { href: "communications", label: "Internal Comms", icon: MessageSquare },
  { href: "notifications", label: "Notifications", icon: Bell },
  { href: "team", label: "Team", icon: Users },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-background)" }}>
      <aside className="fixed inset-y-0 left-0 flex flex-col z-30"
        style={{ width: "var(--sidebar-width)", background: "var(--sidebar-bg)", borderRight: "1px solid var(--color-border)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--color-primary)" }}>D</div>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>DOCTECH</span>
          </div>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.includes(`/doctor/${href}`);
            return (
              <Link key={href} href={`/${locale}/doctor/${href}`}
                className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all")}
                style={isActive
                  ? { background: "var(--color-primary)", color: "white" }
                  : { color: "var(--color-text-secondary)" }}>
                <Icon size={18} /><span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <Link href={`/${locale}/doctor/profile`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
            style={{ color: "var(--color-text-secondary)" }}>
            <User size={18} /><span>Profile</span>
          </Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col" style={{ marginLeft: "var(--sidebar-width)" }}>
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 h-14"
          style={{ background: "var(--sidebar-bg)", borderBottom: "1px solid var(--color-border)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Dr. Clinical Lead — Medical View
          </span>
          <UserButton />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}