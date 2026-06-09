import { useState, useMemo } from "react";
import { Search, X, CheckCircle2, Package, Truck, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { useDrivers } from "@/hooks/useDrivers";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/[ىئ]/g, "ي").toLowerCase().trim();
}

// ── Assign Driver Modal ───────────────────────────────────────
function AssignDriverModal({
  order,
  onClose,
  onAssign,
}: {
  order: LiveOrder;
  onClose: () => void;
  onAssign: (driverId: string, driverName: string) => void;
}) {
  const { drivers } = useDrivers();
  const [selected, setSelected] = useState<string | null>(null);

  function handleConfirm() {
    const drv = drivers.find(d => d.id === selected);
    if (!drv) return;
    onAssign(drv.id, drv.name);
    onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-sm bg-surface rounded-2xl border border-border shadow-dialog overflow-hidden"
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <p className="text-sm font-bold text-text-primary">اختر موظف التوصيل</p>
              <p className="text-[11px] text-text-muted">طلب #{order.orderNumber ?? order.id.slice(0, 4)}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted hover:bg-border transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drivers list */}
          <div className="flex flex-col gap-1.5 p-3 max-h-[60vh] overflow-y-auto">
            {drivers.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">لا يوجد موظفو توصيل</p>
            )}
            {drivers.map(drv => {
              const isOffline = drv.status === "offline";
              const isSelected = selected === drv.id;
              const statusCfg = {
                available: { label: "متاح",     cls: "text-status-success bg-status-success/10 border-status-success/20" },
                busy:      { label: "مشغول",    cls: "text-status-warning bg-status-warning/10 border-status-warning/20" },
                offline:   { label: "غير متاح", cls: "text-text-muted bg-border/50 border-border" },
              }[drv.status];

              const lastMin = Math.floor((Date.now() - drv.lastActivity.getTime()) / 60000);

              return (
                <button
                  key={drv.id}
                  disabled={isOffline}
                  onClick={() => setSelected(isSelected ? null : drv.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-start transition-all",
                    isSelected
                      ? "border-primary bg-primary/8 ring-1 ring-primary/20"
                      : isOffline
                      ? "border-border bg-surface-elevated opacity-40 cursor-not-allowed"
                      : "border-border bg-surface hover:bg-surface-elevated hover:border-primary/30"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-surface-elevated text-text-secondary"
                  )}>
                    {drv.name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary leading-tight">{drv.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-[10px] font-medium border rounded-full px-1.5 py-0.5", statusCfg.cls)}>
                        {statusCfg.label}
                      </span>
                      <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                        <Package className="w-2.5 h-2.5" />{drv.currentOrders} طلب
                      </span>
                      <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{lastMin < 60 ? `${lastMin} د` : `${Math.floor(lastMin / 60)} س`}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-3 pb-3">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-border text-sm text-text-muted font-medium hover:bg-surface-elevated transition-all"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 hover:bg-primary-hover active:scale-[0.97] transition-all"
            >
              <Check className="w-4 h-4" /> تأكيد التعيين
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════
export function FieldOrdersPage() {
  const [query, setQuery]           = useState("");
  const [zoneFilter, setZone]       = useState("all");
  const [selected, setSelected]     = useState<LiveOrder | null>(null);
  const [assigning, setAssigning]   = useState<LiveOrder | null>(null);

  const { orders, assignAndDispatch } = useOrders();

  const readyOrders = useMemo(
    () => orders.filter(o => o.type === "delivery" && o.status === "ready"),
    [orders]
  );

  const zones = useMemo(
    () => [...new Set(readyOrders.map(o => o.zone).filter(Boolean))] as string[],
    [readyOrders]
  );

  const results = useMemo(() => {
    const q = normalizeAr(query);
    return readyOrders.filter(o => {
      if (zoneFilter !== "all" && o.zone !== zoneFilter) return false;
      if (!q) return true;
      return (
        String(o.orderNumber ?? "").includes(query) ||
        normalizeAr(o.customerName ?? "").includes(q) ||
        (o.customerPhone ?? "").includes(query) ||
        normalizeAr(o.deliveryAddress ?? "").includes(q)
      );
    }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [readyOrders, query, zoneFilter]);

  return (
    <div className="flex flex-col gap-0 pb-6">

      {/* ── Header bar ── */}
      <div className="px-4 pt-3 pb-3 border-b border-border bg-surface flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-success" />
          <span className="text-sm font-bold text-text-primary">جاهزة للتوصيل</span>
          <span className="text-xs font-bold text-status-success bg-status-success/10 rounded-full px-2 py-0.5 border border-status-success/20">
            {readyOrders.length}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="رقم الطلب · اسم الزبون · هاتف..."
            className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
              <X className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>

        {zones.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setZone("all")}
              className={cn("shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                zoneFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
              )}>
              كل المناطق
            </button>
            {zones.map(z => (
              <button key={z} onClick={() => setZone(z)}
                className={cn("shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                  zoneFilter === z ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
                )}>
                {z}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div className="px-4 pt-3 flex flex-col gap-2">
        {results.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="لا توجد طلبات جاهزة"
            description="ستظهر هنا الطلبات الجاهزة للتوصيل"
          />
        ) : (
          results.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              onClick={() => setSelected(o)}
              actions={
                <button
                  onClick={e => { e.stopPropagation(); setAssigning(o); }}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-[0.97] transition-all"
                >
                  <Truck className="w-4 h-4" />
                  {o.driverName ? `إعادة تعيين · ${o.driverName}` : "اختيار موظف التوصيل"}
                </button>
              }
            />
          ))
        )}
      </div>

      {/* ── Assign Driver Modal ── */}
      {assigning && (
        <AssignDriverModal
          order={assigning}
          onClose={() => setAssigning(null)}
          onAssign={(drvId, drvName) => assignAndDispatch(assigning.id, drvId, drvName)}
        />
      )}

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
