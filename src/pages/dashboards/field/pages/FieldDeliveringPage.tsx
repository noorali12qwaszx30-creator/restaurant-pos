/**
 * FieldDeliveringPage — الطلبات قيد التوصيل
 * يعرض الطلبات التي قبلها السائق وهي في الطريق، مع تغيير السائق وتأكيد التسليم
 */
import { useState, useMemo } from "react";
import { Bike, MapPin, Phone, Clock, CheckCircle2, Package, Truck, X, Check } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { useDrivers } from "@/hooks/useDrivers";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function elapsed(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `${m} د`;
  return `${Math.floor(m / 60)} س ${m % 60} د`;
}
function timeLabel(d: Date) {
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

// ── مودال تغيير السائق ───────────────────────────────────────
function ChangeDriverModal({
  order,
  onClose,
  onAssign,
}: {
  order: LiveOrder;
  onClose: () => void;
  onAssign: (driverId: string, driverName: string) => void;
}) {
  const { drivers } = useDrivers();
  const [selected, setSelected] = useState<string | null>(order.driverId ?? null);

  function handleConfirm() {
    const drv = drivers.find(d => d.id === selected);
    if (!drv) return;
    onAssign(drv.id, drv.name);
    onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
        <motion.div
          className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-sm bg-surface rounded-2xl border border-border shadow-dialog overflow-hidden"
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <p className="text-sm font-bold text-text-primary">تغيير موظف التوصيل</p>
              <p className="text-[11px] text-text-muted">طلب #{order.orderNumber ?? order.id.slice(0, 4)}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5 p-3 max-h-[60vh] overflow-y-auto">
            {drivers.length === 0 && (
              <p className="text-sm text-text-muted text-center py-6">لا يوجد موظفو توصيل</p>
            )}
            {drivers.map(drv => {
              const isOffline  = drv.status === "offline";
              const isCurrent  = drv.id === order.driverId;
              const isSelected = selected === drv.id;
              const statusCfg  = {
                available: { label: "متاح",     cls: "text-status-success bg-status-success/10 border-status-success/20" },
                busy:      { label: "مشغول",    cls: "text-status-warning bg-status-warning/10 border-status-warning/20" },
                offline:   { label: "غير متاح", cls: "text-text-muted bg-border/50 border-border" },
              }[drv.status];

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
                      : "border-border bg-surface hover:bg-surface-elevated"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-surface-elevated text-text-secondary"
                  )}>
                    {drv.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-text-primary leading-tight">{drv.name}</p>
                      {isCurrent && (
                        <span className="text-[9px] bg-status-info/10 text-status-info border border-status-info/20 rounded-full px-1.5 py-0.5">الحالي</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-[10px] font-medium border rounded-full px-1.5 py-0.5", statusCfg.cls)}>
                        {statusCfg.label}
                      </span>
                      <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                        <Package className="w-2.5 h-2.5" />{drv.currentOrders} طلب
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

          <div className="flex gap-2 px-3 pb-3">
            <button onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-border text-sm text-text-muted font-medium hover:bg-surface-elevated transition-all">
              إلغاء
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected || selected === order.driverId}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all"
            >
              <Check className="w-4 h-4" /> تغيير السائق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── بطاقة الطلب قيد التوصيل ─────────────────────────────────
function DeliveryCard({ order, onView, onDeliver, onChangeDriver }: {
  order: LiveOrder;
  onView: () => void;
  onDeliver: () => void;
  onChangeDriver: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const startTime = order.deliveringAt ?? order.updatedAt;
  const mins = startTime ? Math.floor((Date.now() - startTime.getTime()) / 60000) : 0;
  const isLate = mins > 40;

  async function handleDeliver() {
    setLoading(true);
    await onDeliver();
    setLoading(false);
  }

  return (
    <div className={cn(
      "bg-surface border rounded-2xl overflow-hidden shadow-card",
      isLate ? "border-status-error/40" : "border-status-info/30"
    )}>
      <div className={cn("h-1", isLate ? "bg-status-error" : "bg-status-info")} />

      <div className="p-3 flex flex-col gap-2.5">
        {/* الرأس */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-text-primary">
              #{order.orderNumber ?? order.id.slice(0, 6)}
            </span>
            <span className={cn(
              "text-[10px] font-bold rounded-full px-2 py-0.5 border inline-flex items-center gap-1",
              isLate
                ? "bg-status-error/10 text-status-error border-status-error/25"
                : "bg-status-info/10 text-status-info border-status-info/25"
            )}>
              <Clock className="w-2.5 h-2.5" />
              {startTime ? elapsed(startTime) : "—"}
              {isLate && " · متأخر"}
            </span>
          </div>
          <button onClick={onView} className="text-[10px] text-primary underline underline-offset-2 shrink-0">
            تفاصيل
          </button>
        </div>

        {/* المعلومات */}
        <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
          {order.driverName && (
            <div className="flex items-center gap-2">
              <Bike className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium">{order.driverName}</span>
            </div>
          )}
          {order.zone && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-status-info shrink-0" />
              <span>{order.zone}</span>
            </div>
          )}
          {order.customerPhone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <a href={`tel:${order.customerPhone}`} className="text-primary">{order.customerPhone}</a>
            </div>
          )}
        </div>

        {/* السعر + التوقيت */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="text-[11px] text-text-muted">
            {startTime && `خرج الساعة ${timeLabel(startTime)}`}
          </div>
          <div className="text-sm font-bold text-text-primary">
            {order.total.toFixed(0)} <span className="text-[10px] font-normal text-text-muted">د.ع</span>
          </div>
        </div>

        {/* الأزرار */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onChangeDriver}
            className="h-10 rounded-xl border border-border bg-surface-elevated text-text-secondary text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-border transition-all active:scale-[0.97]"
          >
            <Truck className="w-3.5 h-3.5" /> تغيير السائق
          </button>
          <button
            onClick={handleDeliver}
            disabled={loading}
            className="h-10 rounded-xl bg-status-success text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-[0.97] transition-all"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <><CheckCircle2 className="w-3.5 h-3.5" /> تأكيد التسليم</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export function FieldDeliveringPage() {
  const { orders, markDelivered, assignAndDispatch } = useOrders();
  const [selected, setSelected]       = useState<LiveOrder | null>(null);
  const [changingDriver, setChanging] = useState<LiveOrder | null>(null);

  const deliveringOrders = useMemo(
    () => orders
      .filter(o => o.status === "delivering")
      .sort((a, b) => (a.deliveringAt ?? a.updatedAt).getTime() - (b.deliveringAt ?? b.updatedAt).getTime()),
    [orders]
  );

  const lateCount = deliveringOrders.filter(o => {
    const t = o.deliveringAt ?? o.updatedAt;
    return t && (Date.now() - t.getTime()) / 60000 > 40;
  }).length;

  return (
    <div className="flex flex-col gap-0 pb-6">

      {/* ملخص أعلى الصفحة */}
      <div className="px-4 pt-3 pb-3 border-b border-border">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-status-info/5 border border-status-info/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-status-info">{deliveringOrders.length}</p>
            <p className="text-xs text-text-muted mt-0.5">في الطريق</p>
          </div>
          <div className={cn(
            "border rounded-2xl p-3 text-center",
            lateCount > 0 ? "bg-status-error/5 border-status-error/20" : "bg-surface-elevated border-border"
          )}>
            <p className={cn("text-2xl font-bold", lateCount > 0 ? "text-status-error" : "text-text-muted")}>
              {lateCount}
            </p>
            <p className="text-xs text-text-muted mt-0.5">متأخرة (+40 د)</p>
          </div>
        </div>
      </div>

      {/* قائمة الطلبات */}
      <section className="px-4 pt-4 flex flex-col gap-3">
        {deliveringOrders.length === 0 ? (
          <EmptyState
            icon={<Bike className="w-8 h-8" />}
            title="لا توجد طلبات في الطريق"
            description="ستظهر هنا الطلبات بعد قبول السائق لها"
          />
        ) : (
          deliveringOrders.map(o => (
            <DeliveryCard
              key={o.id}
              order={o}
              onView={() => setSelected(o)}
              onDeliver={() => markDelivered(o.id)}
              onChangeDriver={() => setChanging(o)}
            />
          ))
        )}
      </section>

      {changingDriver && (
        <ChangeDriverModal
          order={changingDriver}
          onClose={() => setChanging(null)}
          onAssign={(drvId, drvName) => assignAndDispatch(changingDriver.id, drvId, drvName)}
        />
      )}

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
