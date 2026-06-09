import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/ui/PageTransition";

interface DashboardLayoutProps {
  role: UserRole;
  children: ReactNode;
  className?: string;
  hideNav?: boolean;
}

export function DashboardLayout({ role, children, className, hideNav }: DashboardLayoutProps) {
  const showNav = !hideNav && role !== "kitchen";
  return (
    <div className="min-h-dvh bg-background mesh-bg">
      <Header role={role} />
      <main className={cn("px-4", showNav ? "page-container" : "pt-[var(--header-height)] pb-4", className)}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      {showNav && <BottomNav role={role} />}
    </div>
  );
}
