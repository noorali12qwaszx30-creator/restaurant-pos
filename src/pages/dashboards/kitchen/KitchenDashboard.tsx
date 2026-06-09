import { useState, useMemo, useEffect } from "react";
import {
  ChefHat, CheckCircle2, AlertTriangle, AlertOctagon,
  Truck, ShoppingBag, UtensilsCrossed,
  Package, CircleAlert, Timer,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLateOrderSiren, type AlarmLevel } from "@/hooks/useLateOrderSiren";
import { useKitchenVoiceAnnouncer } from "@/hooks/useKitchenVoiceAnnouncer";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { cn } from "@/lib/utils";

/* ── helpers ─────────────────────────────────────────────────── */
function ageMin(d: Date) { return Math.floor((Date.now() - d.getTime()) / 60000); }
function ageLabel(m: number) {
  if (m < 60) return `${m} د`;
  return `${Math.floor(m / 60)}س ${m % 60}د`;
}
function timeLabel(d: Date) {
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

/* ── Delay badge ─────────────────────────────────────────────── */
function DelayBadge({ level, age }: { level: AlarmLevel; age: number }) {
  if (level === 0) return null;
  const cfg = {
    1: { cls: "bg-status-warning/15 text-status-warning border-status-warning/40", Icon: AlertTriangle },
    2: { cls: "bg-status-error/15 text-status-error border-status-error/40",        Icon: AlertOctagon  },
    3: { cls: "bg-status-error text-white border-status-error animate-pulse",        Icon: CircleAlert   },
  }[level];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold", cfg.cls)}>
      <cfg.Icon className="w-3 h-3" />
      {ageLabel(age)}
    </span>
  );
}

/* ── Type chip ───────────────────────────────────────────────── */
function TypeChip({ type }: { type: LiveOrder["type"] }) {
  const cfg =
    type === "delivery" ? { Icon: Truck,          label: "توصيل", cls: "bg-status-info/15 text-status-info border-status-info/30"     } :
    type === "takeaway" ? { Icon: ShoppingBag,     label: "سفري",  cls: "bg-amber-500/15 text-amber-600 border-amber-500/30"           } :
                          { Icon: UtensilsCrossed, label: "داخلي", cls: "bg-primary/15 text-primary border-primary/30"                 };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold", cfg.cls)}>
      <cfg.Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

/* ── Status chip ─────────────────────────────────────────────── */
function StatusChip({ status }: { status: LiveOrder["status"] }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending:    { label: "جديد",        cls: "bg-status-warning/15 text-status-warning border-status-warning/30" },
    preparing:  { label: "قيد التحضير", cls: "bg-primary/15 text-primary border-primary/30"                     },
    ready:      { label: "جاهز",        cls: "bg-status-success/15 text-status-success border-status-success/30" },
    delivering: { label: "توصيل",       cls: "bg-status-info/10 text-status-info border-status-info/20"          },
    delivered:  { label: "تسليم",       cls: "bg-status-success/10 text-status-success border-status-success/20" },
    cancelled:  { label: "ملغي",        cls: "bg-status-error/10 text-status-error border-status-error/20"       },
  };
  const { label, cls } = cfg[status] ?? cfg.pending;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold", cls)}>
      {label}
    </span>
  );
}

/* ── Stats bar ───────────────────────────────────────────────── */
function StatsBar({ newCount, preparingCount, readyCount, lateCount }: {
  newCount: number; preparingCount: number; readyCount: number; lateCount: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "جديدة",        value: newCount,       cls: "text-status-warning", bg: "bg-status-warning/8 border-status-warning/20", Icon: Package      },
        { label: "قيد التحضير", value: preparingCount, cls: "text-primary",        bg: "bg-primary/8 border-primary/20",               Icon: Timer        },
        { label: "جاهزة",       value: readyCount,     cls: "text-status-success", bg: "bg-status-success/8 border-status-success/20", Icon: CheckCircle2 },
        { label: "متأخرة",      value: lateCount,      cls: "text-status-error",   bg: "bg-status-error/8 border-status-error/20",     Icon: AlertOctagon },
      ].map(s => (
        <div key={s.label} className={cn("rounded-2xl border p-3 flex items-center gap-3", s.bg)}>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
            <s.Icon className={cn("w-5 h-5", s.cls)} />
          </div>
          <div>
            <p className={cn("text-3xl font-black leading-none", s.cls)}>{s.value}</p>
            <p className="text-xs text-text-muted mt-0.5 font-medium">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Kitchen Order Card ──────────────────────────────────────── */
interface KitchenCardProps {
  order: LiveOrder;
  alarmLevel: AlarmLevel;
  onStartPreparing?: () => void;
}

function KitchenOrderCard({ order, alarmLevel, onStartPreparing }: KitchenCardProps) {
  const age         = ageMin(order.createdAt);
  const isPreparing = order.status === "preparing";
  const isNew       = order.status === "pending";

  const borderCls =
    alarmLevel === 3 ? "border-status-error ring-2 ring-status-error/30" :
    alarmLevel === 2 ? "border-status-error/60"   :
    alarmLevel === 1 ? "border-status-warning/60" :
    isPreparing      ? "border-primary/50"        : "border-border";

  const stripCls =
    alarmLevel === 3 ? "bg-status-error animate-pulse" :
    alarmLevel === 2 ? "bg-status-error/70"             :
    alarmLevel === 1 ? "bg-status-warning"              :
    isPreparing      ? "bg-primary"                     :
    isNew            ? "bg-status-info"                 : "bg-border";

  const headerBg =
    alarmLevel === 3 ? "bg-status-error/8"   :
    alarmLevel === 2 ? "bg-status-error/5"   :
    alarmLevel === 1 ? "bg-status-warning/5" :
    isPreparing      ? "bg-primary/5"        : "bg-surface-elevated";

  const ageCls =
    alarmLevel >= 2  ? "text-status-error font-black"   :
    alarmLevel === 1 ? "text-status-warning font-black" : "text-text-muted font-bold";

  return (
    <div className={cn(
      "bg-surface border-2 rounded-xl overflow-hidden flex flex-col shadow-card transition-all duration-200",
      borderCls
    )}>
      {/* colour strip */}
      <div className={cn("h-1", stripCls)} />

      {/* header: ID + timer */}
      <div className={cn("px-2.5 pt-2 pb-1.5 flex items-start justify-between gap-1", headerBg)}>
        <div className="min-w-0">
          <p className="text-xl font-black leading-none text-text-primary truncate">{order.id}</p>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <StatusChip status={order.status} />
            <TypeChip   type={order.type} />
          </div>
        </div>
        <div className="text-right shrink-0 ml-1">
          <p className={cn("text-xl leading-none", ageCls)}>{ageLabel(age)}</p>
          <p className="text-[9px] text-text-muted leading-none mt-0.5">{timeLabel(order.createdAt)}</p>
          {alarmLevel >= 1 && <DelayBadge level={alarmLevel} age={age} />}
        </div>
      </div>

      {/* customer / table */}
      {order.customerName && (
        <div className="px-2.5 py-1 border-t border-border flex items-center gap-2 bg-surface">
          <span className="text-[11px] text-text-muted truncate">{order.customerName}</span>
        </div>
      )}

      {/* order notes */}
      {order.notes && (
        <div className="mx-2 mt-1 px-2 py-1 rounded-lg bg-status-warning/10 border border-status-warning/25 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-status-warning shrink-0" />
          <p className="text-[11px] text-status-warning font-semibold leading-tight truncate">{order.notes}</p>
        </div>
      )}

      {/* items list */}
      <div className="px-2.5 py-1.5 flex flex-col gap-1 flex-1">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-surface-elevated rounded-lg px-2 py-1">
            <span className="text-[11px] font-bold text-primary bg-primary/10 rounded px-1.5 leading-tight shrink-0">
              ×{item.quantity}
            </span>
            <span className="text-[12px] font-semibold text-text-primary leading-tight flex-1 truncate">
              {item.name}
            </span>
            {item.notes && (
              <span className="text-[9px] text-status-warning shrink-0 truncate max-w-[40%]">
                {item.notes}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tap-to-start button — only on pending orders */}
      {isNew && onStartPreparing && (
        <div className="px-2.5 pb-2.5 pt-1.5 border-t border-border mt-auto">
          <button
            onClick={onStartPreparing}
            className="w-full h-9 rounded-lg bg-primary/10 text-primary border border-primary/25 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/20 active:scale-[0.97] transition-all"
          >
            <Timer className="w-3.5 h-3.5" />
            بدء التحضير
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main KitchenDashboard ───────────────────────────────────── */
export function KitchenDashboard() {
  const [tick, setTick] = useState(0);
  const { orders, markPreparing } = useOrders();

  /* timer tick every 15s for age display */
  useEffect(() => {
    const id = setInterval(() => setTick(p => p + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  /* kitchen orders — pending + preparing, sorted oldest first */
  const kitchenOrders = useMemo(() => {
    const active = orders.filter(o =>
      o.status === "pending" || o.status === "preparing"
    );
    return [...active].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, tick]);

  /* alarm / voice hooks (pass age-compatible shape) */
  const legacyOrders = useMemo(
    () => kitchenOrders.map(o => ({ ...o, createdAt: o.createdAt, status: o.status })),
    [kitchenOrders]
  );

  const { getOrderLevel } = useLateOrderSiren({ orders: legacyOrders as never });
  useKitchenVoiceAnnouncer({ orders: legacyOrders as never, enabled: true });

  const stats = useMemo(() => ({
    newC:   kitchenOrders.filter(o => o.status === "pending").length,
    prepC:  kitchenOrders.filter(o => o.status === "preparing").length,
    readyC: orders.filter(o => o.status === "ready").length,
    lateC:  kitchenOrders.filter(o => getOrderLevel(o.createdAt) >= 1).length,
  }), [kitchenOrders, orders, getOrderLevel]);

  return (
    <DashboardLayout role="kitchen">
      <div className="flex flex-col gap-4 pb-6">

        <StatsBar
          newCount={stats.newC}
          preparingCount={stats.prepC}
          readyCount={stats.readyC}
          lateCount={stats.lateC}
        />

        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-surface-elevated border border-border flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-text-muted" />
            </div>
            <p className="text-lg font-bold text-text-primary">لا توجد طلبات نشطة</p>
            <p className="text-sm text-text-muted">قائمة الطهي فارغة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-3">
            {kitchenOrders.map(o => (
              <KitchenOrderCard
                key={o.id}
                order={o}
                alarmLevel={getOrderLevel(o.createdAt)}
                onStartPreparing={o.status === "pending" ? () => markPreparing(o.id) : undefined}
              />
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
