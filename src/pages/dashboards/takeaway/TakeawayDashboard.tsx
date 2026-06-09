import { useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TakeawayQueueTab } from "./components/TakeawayQueueTab";
import { useOrders } from "@/contexts/OrderContext";

export function TakeawayDashboard() {
  const { orders: allOrders } = useOrders();
  const orders  = useMemo(() => allOrders.filter(o => o.type === "takeaway" || o.type === "pickup"), [allOrders]);
  const active  = orders.filter((o) => !["delivered","cancelled"].includes(o.status));
  const ready   = orders.filter((o) => o.status === "ready");
  const paid    = orders.filter((o) => o.status === "delivered");

  return (
    <DashboardLayout role="takeaway">
      <div className="flex flex-col gap-4 pb-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[
            { label: "نشطة", value: active.length, color: "text-primary" },
            { label: "جاهزة", value: ready.length, color: "text-status-success" },
            { label: "مكتملة اليوم", value: paid.length,  color: "text-text-muted" },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-2xl p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="queue">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="queue">قائمة الانتظار</TabsTrigger>
            <TabsTrigger value="history">السجل</TabsTrigger>
          </TabsList>
          <TabsContent value="queue">
            <TakeawayQueueTab />
          </TabsContent>
          <TabsContent value="history">
            <div className="flex flex-col gap-2">
              {paid.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">لا توجد طلبات مكتملة اليوم</div>
              ) : (
                paid.map((o) => (
                  <div key={o.id} className="bg-surface border border-border rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{o.id}</p>
                      <p className="text-xs text-text-muted">{o.customerName}</p>
                    </div>
                    <span className="text-sm font-bold text-text-secondary">{o.total.toFixed(1)} د.ع</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
