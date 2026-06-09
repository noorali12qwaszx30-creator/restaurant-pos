import { useState, useMemo } from "react";
import { CheckCircle2, ChefHat, Loader2, Clock } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { MOCK_DRIVERS } from "@/data/mock-drivers";
import { OrderCard } from "@/components/dashboard/OrderCard";

import { cn } from "@/lib/utils";

// ── Move to Ready button ──────────────────────────────────────
function MoveToReadyButton({ onConfirm }: { onConfirm: () => void }) {
  const [loading, setLoading] = useState(false);
  async function handle() { setLoading(true); await onConfirm(); setLoading(false); }
  return (
    <button
      onClick={handle}
      disabled={loading}
      className="w-full h-11 rounded-xl bg-status-success text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> نقل للجاهز</>}
    </button>
  );
}

// ── Preparing Card ────────────────────────────────────────────
function PreparingCard({ order, onMarkReady }: { order: LiveOrder; onMarkReady: () => void }) {
  const [loading, setLoading] = useState(false);
  async function handle() { setLoading(true); await onMarkReady(); setLoading(false); }
  return (
    <OrderCard
      order={order}
      actions={
        <button
          onClick={handle}
          disabled={loading}
          className="w-full h-11 rounded-xl bg-status-success text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> تأكيد الجاهز للتوصيل</>}
        </button>
      }
    />
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
  const { orders, markReady } = useOrders();

  // Pending delivery orders — waiting
  const pendingOrders = useMemo(
    () => orders
      .filter(o => o.status === "pending" && o.type === "delivery")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [orders]
  );

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
  const openIssues       = orders.filter(o => o.hasIssue).length;

  const KPI = [
    { label: "انتظار",      value: pendingOrders.length,    color: "text-status-warning",  bg: "bg-status-warning/8" },
    { label: "تحضير",       value: preparingOrders.length,  color: "text-primary",         bg: "bg-primary/8" },
    { label: "جاهزة",       value: readyOrders.length,      color: "text-status-success",  bg: "bg-status-success/8" },
    { label: "في الطريق",   value: deliveringOrders.length, color: "text-status-info",     bg: "bg-status-info/8" },
    { label: "متاحون",      value: availableDrivers,        color: "text-status-success",  bg: "bg-status-success/8" },
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

      {/* ── Pending — waiting orders ── */}
      {pendingOrders.length > 0 && (
        <section className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-status-warning" />
            <h2 className="text-sm font-bold text-text-primary">انتظار التأكيد</h2>
            <span className="text-xs font-bold text-status-warning bg-status-warning/10 rounded-full px-2 py-0.5 border border-status-warning/20">
              {pendingOrders.length}
            </span>
          </div>
          <div className="flex flex-col gap-3 mb-6">
            {pendingOrders.map(o => (
              <OrderCard
                key={o.id}
                order={o}
                actions={
                  <MoveToReadyButton onConfirm={() => markReady(o.id)} />
                }
              />
            ))}
          </div>
        </section>
      )}

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
