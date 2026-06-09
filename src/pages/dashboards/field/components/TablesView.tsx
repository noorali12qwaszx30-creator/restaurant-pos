import { useState } from "react";
import { Users, Clock, Plus } from "lucide-react";
import { MOCK_TABLES, TABLE_STATUS_CONFIG } from "@/data/mock-tables";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { Button } from "@/components/ui/button";

import type { Table } from "@/data/mock-types";
import { cn } from "@/lib/utils";

export function TablesView() {
  const { orders } = useOrders();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);
  const [floor, setFloor] = useState(1);

  const tables = MOCK_TABLES.filter((t) => t.floor === floor);
  const tableOrder: LiveOrder | null = selectedTable?.currentOrderId
    ? orders.find((o) => o.id === selectedTable.currentOrderId) ?? null
    : null;

  const stats = {
    available: MOCK_TABLES.filter((t) => t.status === "available").length,
    occupied:  MOCK_TABLES.filter((t) => t.status === "occupied").length,
    reserved:  MOCK_TABLES.filter((t) => t.status === "reserved").length,
    cleaning:  MOCK_TABLES.filter((t) => t.status === "cleaning").length,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(TABLE_STATUS_CONFIG) as [keyof typeof TABLE_STATUS_CONFIG, typeof TABLE_STATUS_CONFIG[keyof typeof TABLE_STATUS_CONFIG]][]).map(([key, cfg]) => (
          <div key={key} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border", cfg.bg, cfg.border, cfg.color)}>
            <span className="font-medium">{cfg.label}</span>
            <span className="font-bold">{stats[key]}</span>
          </div>
        ))}
      </div>

      {/* Floor selector */}
      <div className="flex gap-2">
        {[1, 2].map((f) => (
          <button key={f} onClick={() => setFloor(f)}
            className={cn("flex-1 py-2 rounded-xl border text-sm font-medium transition-all",
              floor === f ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted bg-surface-elevated"
            )}>
            الطابق {f === 1 ? "الأول" : "الثاني"}
          </button>
        ))}
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-3 gap-3">
        {tables.map((table) => {
          const cfg = TABLE_STATUS_CONFIG[table.status];
          return (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all active:scale-95",
                cfg.bg, cfg.border
              )}
            >
              <div className={cn("text-2xl font-bold", cfg.color)}>{table.number}</div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Users className="w-3 h-3" />
                <span>{table.capacity}</span>
              </div>
              <span className={cn("text-[10px] font-medium", cfg.color)}>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Table action dialog */}
      <Dialog open={!!selectedTable} onOpenChange={(o) => !o && setSelectedTable(null)}>
        <DialogContent>
          <DialogHeader onClose={() => setSelectedTable(null)}>
            <DialogTitle>طاولة {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            {selectedTable && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-elevated rounded-xl p-3 text-center">
                    <p className="text-xs text-text-muted mb-1">السعة</p>
                    <p className="text-lg font-bold text-text-primary">{selectedTable.capacity} أشخاص</p>
                  </div>
                  <div className={cn("rounded-xl p-3 text-center border", TABLE_STATUS_CONFIG[selectedTable.status].bg, TABLE_STATUS_CONFIG[selectedTable.status].border)}>
                    <p className="text-xs text-text-muted mb-1">الحالة</p>
                    <p className={cn("text-lg font-bold", TABLE_STATUS_CONFIG[selectedTable.status].color)}>
                      {TABLE_STATUS_CONFIG[selectedTable.status].label}
                    </p>
                  </div>
                </div>

                {tableOrder ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-text-primary">الطلب الحالي</p>
                    <div className="bg-surface-elevated rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-text-primary">{tableOrder.id}</span>
                        <span className="font-bold text-primary">{tableOrder.total.toFixed(1)} د.ع</span>
                      </div>
                      <p className="text-xs text-text-muted">{tableOrder.items.map((i) => `${i.name} ×${i.quantity}`).join(" · ")}</p>
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        <span>{tableOrder.createdAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => { setSelectedOrder(tableOrder); setSelectedTable(null); }}>
                      عرض تفاصيل الطلب
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full"><Plus className="w-4 h-4" /> إضافة طلب جديد</Button>
                )}
              </>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
