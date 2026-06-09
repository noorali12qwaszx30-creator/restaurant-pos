import { useState, useMemo, useEffect } from "react";
import {
  Phone, MapPin, AlertTriangle, AlertCircle, AlertOctagon,
  FileText, CheckCircle2, ChefHat, Loader2,
} from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { MOCK_DRIVERS } from "@/data/mock-drivers";
import { DeliveryPersonSelector } from "../components/DeliveryPersonSelector";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

// ── Utilities ─────────────────────────────────────────────────
function waitedMin(d: Date) { return Math.floor((Date.now() - d.getTime()) / 60000); }
function waitedLabel(d: Date) {
  const m = waitedMin(d);
  return m < 60 ? `${m} د` : `${Math.floor(m / 60)} س ${m % 60} د`;
}
function timeLabel(d: Date) {
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

// ── Live timer tick ────────────────────────────────────────────
function useTick() {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
}

function UrgencyBadge({ createdAt }: { createdAt: Date }) {
  const m = waitedMin(createdAt);
  if (m >= 40) return <span className="text-[10px] font-bold bg-status-error/15 text-status-error border border-status-error/30 rounded-full px-2 py-0.5 inline-flex items-center gap-1"><AlertOctagon className="w-2.5 h-2.5" /> حرج {m}د</span>;
  if (m >= 25) return <span className="text-[10px] font-bold bg-status-error/10 text-status-error border border-status-error/20 rounded-full px-2 py-0.5 inline-flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> متأخر {m}د</span>;
  if (m >= 15) return <span className="text-[10px] font-bold bg-status-warning/10 text-status-warning border border-status-warning/20 rounded-full px-2 py-0.5 inline-flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> {m}د</span>;
  return <span className="text-[10px] text-text-muted bg-surface-elevated border border-border rounded-full px-2 py-0.5">{timeLabel(createdAt)}</span>;
}

// ── Preparing Card (kitchen working → field marks ready) ──────
function PreparingCard({ order, onMarkReady }: {
  order: LiveOrder;
  onMarkReady: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const m = waitedMin(order.createdAt);

  async function handle() {
    setLoading(true);
    await onMarkReady();
    setLoading(false);
  }

  return (
    <div className={cn(
      "bg-surface border rounded-2xl overflow-hidden shadow-card",
      m >= 40 ? "border-status-error/40" : m >= 25 ? "border-status-error/25" : m >= 15 ? "border-status-warning/30" : "border-border"
    )}>
      <div className={cn("h-1", m >= 40 ? "bg-status-error" : m >= 25 ? "bg-status-error/60" : m >= 15 ? "bg-status-warning" : "bg-primary/20")} />
      <div className="p-3 flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-text-primary">{order.id}</span>
            <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 flex items-center gap-1">
              <ChefHat className="w-2.5 h-2.5" /> قيد التحضير
            </span>
            <UrgencyBadge createdAt={order.createdAt} />
          </div>
          <span className="text-xs text-text-muted shrink-0">{timeLabel(order.createdAt)}</span>
        </div>

        {/* Customer */}
        {order.customerName && (
          <div className="flex items-center gap-1.5 text-sm text-text-primary">
            <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="font-medium">{order.customerName}</span>
            {order.customerPhone && <span className="text-text-muted text-xs">· {order.customerPhone}</span>}
          </div>
        )}
        {order.zone && (
          <span className="text-xs font-medium text-status-info bg-status-info/8 border border-status-info/20 rounded-lg px-2 py-0.5 w-fit flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {order.zone}
          </span>
        )}

        {/* Items */}
        <div className="bg-surface-elevated rounded-xl px-3 py-2">
          <p className="text-xs text-text-muted line-clamp-2">
            {order.items.map(i => `${i.name} ×${i.quantity}`).join(" · ")}
          </p>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="flex items-start gap-1.5 text-xs text-primary bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-2">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{order.notes}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-primary">{order.total.toFixed(1)} ر.س</span>
          <span className="text-xs text-text-muted">{waitedLabel(order.createdAt)}</span>
        </div>

        {/* Mark Ready button */}
        <button
          onClick={handle}
          disabled={loading}
          className="w-full h-11 rounded-xl bg-status-success text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all shadow-card"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><CheckCircle2 className="w-4 h-4" /> تأكيد الجاهز للتوصيل</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Ready Card (driver assignment → dispatching) ──────────────
function ReadyOrderCard({ order, onAssign }: {
  order: LiveOrder;
  onAssign: (driverId: string, driverName: string) => void;
}) {
  const m = waitedMin(order.createdAt);

  return (
    <div className={cn(
      "bg-surface border rounded-2xl overflow-hidden shadow-card",
      m >= 40 ? "border-status-error/40" : m >= 25 ? "border-status-error/25" : m >= 15 ? "border-status-warning/30" : "border-border"
    )}>
      <div className={cn("h-1", m >= 40 ? "bg-status-error" : m >= 25 ? "bg-status-error/70" : m >= 15 ? "bg-status-warning" : "bg-primary/30")} />
      <div className="p-3 flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-text-primary">{order.id}</span>
            <span className="text-[10px] font-bold bg-status-success/10 text-status-success border border-status-success/20 rounded-full px-2 py-0.5">جاهز ✓</span>
            {order.driverName && (
              <span className="text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">مسند</span>
            )}
            <UrgencyBadge createdAt={order.createdAt} />
          </div>
          <span className="text-xs text-text-muted shrink-0">{timeLabel(order.createdAt)}</span>
        </div>

        {/* Customer + zone */}
        {order.customerName && (
          <div className="flex items-center gap-1.5 text-sm text-text-primary">
            <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="font-medium">{order.customerName}</span>
            {order.customerPhone && <span className="text-text-muted text-xs">· {order.customerPhone}</span>}
          </div>
        )}
        {order.deliveryAddress && (
          <div className="flex items-start gap-1.5 text-xs text-text-muted">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{order.zone && <span className="font-semibold text-primary">{order.zone} · </span>}{order.deliveryAddress}</span>
          </div>
        )}

        {/* Items */}
        <div className="bg-surface-elevated rounded-xl px-3 py-2">
          <p className="text-xs text-text-muted line-clamp-2">
            {order.items.map(i => `${i.name} ×${i.quantity}`).join(" · ")}
          </p>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="flex items-start gap-1.5 text-xs text-primary bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-2">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{order.notes}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-primary">{order.total.toFixed(1)} ر.س</span>
          <span className="text-xs text-text-muted">انتظار: {waitedLabel(order.createdAt)}</span>
        </div>

        {/* Driver selector — onAssign triggers assignAndDispatch */}
        <DeliveryPersonSelector
          orderId={order.id}
          currentDriverId={order.driverId}
          currentDriverName={order.driverName}
          onAssign={onAssign}
        />
      </div>
    </div>
  );
}

// ── Dispatched row (brief confirmation) ───────────────────────
function DispatchedRow({ order }: { order: LiveOrder }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-3 flex items-center gap-3 shadow-card">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-text-primary">{order.id}</span>
          {order.zone && <span className="text-[10px] text-status-info">· {order.zone}</span>}
        </div>
        <p className="text-xs text-text-muted">{order.driverName ?? "—"}</p>
      </div>
      <span className="text-sm font-bold text-primary shrink-0">{order.total.toFixed(1)} ر.س</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export function FieldHomePage() {
  useTick();
  const { orders, markReady, assignAndDispatch } = useOrders();

  // Preparing delivery orders — kitchen is working on them
  const preparingOrders = useMemo(
    () => orders
      .filter(o => o.status === "preparing" && o.type === "delivery")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [orders]
  );

  // Ready delivery orders — need a driver
  const readyOrders = useMemo(
    () => orders
      .filter(o => o.status === "ready" && o.type === "delivery")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [orders]
  );

  // Dispatched orders (today's delivering) — brief list
  const deliveringOrders = useMemo(
    () => orders
      .filter(o => o.status === "delivering" && o.type === "delivery")
      .sort((a, b) => (b.deliveringAt ?? b.updatedAt).getTime() - (a.deliveringAt ?? a.updatedAt).getTime())
      .slice(0, 10),
    [orders]
  );

  const availableDrivers = MOCK_DRIVERS.filter(d => d.status === "available").length;
  const busyDrivers      = MOCK_DRIVERS.filter(d => d.status === "busy").length;
  const openIssues       = orders.filter(o => o.hasIssue).length;

  const KPI = [
    { label: "تحضير",       value: preparingOrders.length, color: "text-primary",         bg: "bg-primary/8" },
    { label: "جاهزة",       value: readyOrders.length,     color: "text-status-success",  bg: "bg-status-success/8" },
    { label: "في الطريق",   value: deliveringOrders.length, color: "text-status-info",    bg: "bg-status-info/8" },
    { label: "متاحون",      value: availableDrivers,        color: "text-status-success",  bg: "bg-status-success/8" },
    { label: "مشغولون",     value: busyDrivers,             color: "text-text-secondary",  bg: "bg-surface-elevated" },
    { label: "مشاكل",       value: openIssues,              color: "text-status-error",    bg: "bg-status-error/8" },
  ];

  return (
    <div className="flex flex-col gap-0 pb-6">

      {/* ── KPI strip ── */}
      <div className="px-4 pt-3 pb-4 border-b border-border">
        <div className="grid grid-cols-3 gap-2">
          {KPI.map(k => (
            <div key={k.label} className={cn("rounded-xl p-2.5 text-center border border-border", k.bg)}>
              <p className={cn("text-xl font-bold leading-none", k.color)}>{k.value}</p>
              <p className="text-[10px] text-text-muted mt-1 leading-tight">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Preparing — waiting for field to confirm ready ── */}
      {preparingOrders.length > 0 && (
        <section className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <ChefHat className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-text-primary">قيد التحضير · في المطبخ</h2>
            <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 border border-primary/20">
              {preparingOrders.length}
            </span>
          </div>
          <div className="flex flex-col gap-3 mb-6">
            {preparingOrders.map(o => (
              <PreparingCard
                key={o.id}
                order={o}
                onMarkReady={() => markReady(o.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Ready — needs driver ── */}
      <section className="px-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-status-warning" />
          <h2 className="text-sm font-bold text-text-primary">جاهزة · بانتظار سائق</h2>
          <span className="text-xs font-bold text-status-warning bg-status-warning/10 rounded-full px-2 py-0.5 border border-status-warning/20">
            {readyOrders.length}
          </span>
        </div>

        {readyOrders.length === 0 ? (
          <div className="mb-4">
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8" />}
              title="لا توجد طلبات بانتظار سائق"
              description="جميع الطلبات الجاهزة مُسندة"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {readyOrders.map(o => (
              <ReadyOrderCard
                key={o.id}
                order={o}
                onAssign={(drvId, drvName) => assignAndDispatch(o.id, drvId, drvName)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Delivering — dispatched today ── */}
      {deliveringOrders.length > 0 && (
        <section className="px-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2 mb-3 pt-4">
            <CheckCircle2 className="w-4 h-4 text-status-success" />
            <h2 className="text-sm font-bold text-text-primary">في الطريق</h2>
            <span className="text-xs font-bold text-status-success bg-status-success/10 rounded-full px-2 py-0.5 border border-status-success/20">
              {deliveringOrders.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {deliveringOrders.map(o => (
              <DispatchedRow key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
