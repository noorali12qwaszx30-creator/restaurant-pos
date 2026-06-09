import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NewOrdersPage }  from "./pages/NewOrdersPage";
import { ActiveOrdersPage } from "./pages/ActiveOrdersPage";
import { StatsPage }      from "./pages/StatsPage";
import { ArchivePage }    from "./pages/ArchivePage";
import { useOrders }      from "@/contexts/OrderContext";
import { useAuth }        from "@/contexts/AuthContext";
import { cn }             from "@/lib/utils";

function DriverStatusBar() {
  const [available, setAvailable] = useState(true);
  const { orders } = useOrders();
  const { profile } = useAuth();
  const driverId = profile?.uid ?? "mock-delivery-001";
  const pendingCount = orders.filter(
    o => (o.driverId === driverId || o.driverId === "mock-delivery-001") && o.status === "delivering"
  ).length;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
      {/* Status toggle */}
      <button
        onClick={() => setAvailable(p => !p)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
          available
            ? "bg-status-success/10 text-status-success border-status-success/30"
            : "bg-surface-elevated text-text-muted border-border"
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", available ? "bg-status-success animate-pulse" : "bg-text-muted")} />
        {available ? "متاح" : "غير متاح"}
      </button>

      {/* Pending badge */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-primary">{pendingCount} طلب جديد</span>
        </div>
      )}
    </div>
  );
}

export function DeliveryDashboard() {
  return (
    <DashboardLayout role="delivery" className="!px-0 !pt-0">
      <DriverStatusBar />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route index           element={<NewOrdersPage />}   />
          <Route path="active"   element={<ActiveOrdersPage />} />
          <Route path="stats"    element={<StatsPage />}        />
          <Route path="archive"  element={<ArchivePage />}      />
        </Routes>
      </div>
    </DashboardLayout>
  );
}
