import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  role: UserRole;
  children: ReactNode;
  className?: string;
  hideNav?: boolean;
}

export function DashboardLayout({ role, children, className, hideNav }: DashboardLayoutProps) {
  const showNav = !hideNav && role !== "kitchen";
  return (
    <div className="min-h-dvh bg-background">
      <Header role={role} />
      <main className={cn("px-4", showNav ? "page-container" : "pt-[var(--header-height)] pb-4", className)}>
        {children}
      </main>
      {showNav && <BottomNav role={role} />}
    </div>
  );
}
