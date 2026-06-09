import { useState, useMemo } from "react";
import {
  Search, X, SlidersHorizontal, ChevronDown, ChevronUp,
  Clock, MapPin, Bike, UtensilsCrossed,
  ShoppingBag, Truck, CheckCircle2, XCircle, AlertTriangle,
  ClipboardList, Filter
} from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { StatusBadge, OrderTypeBadge } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";

/* ─── helpers ────────────────────────────────────────────────── */
function normalizeAr(s: string) {
  return s.replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/[ىئ]/g,"ي").toLowerCase().trim();
}
function timeLabel(d: Date) {
  return d.toLocaleDateString("ar-SA",{day:"numeric",month:"short"}) + " " +
         d.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"});
}
function waitedMin(d: Date) { return Math.floor((Date.now()-d.getTime())/60000); }
function minLabel(m: number) { return m < 60 ? `${m} د` : `${Math.floor(m/60)} س ${m%60} د`; }

/* ─── Order Timeline ─────────────────────────────────────────── */
type TimelineEvent = { label: string; time: Date | null; done: boolean; icon: React.ElementType };

function buildTimeline(order: LiveOrder): TimelineEvent[] {
  const created   = order.createdAt;
  const delivered = order.deliveredAt ?? null;

  const steps: TimelineEvent[] = [
    { label: "إنشاء الطلب",    time: created,                                                                                                   done: true,                                                      icon: ClipboardList  },
    { label: "دخول المطبخ",    time: order.preparingAt ?? (["preparing","ready","delivering","delivered"].includes(order.status) ? new Date(created.getTime()+2*60000) : null), done: ["preparing","ready","delivering","delivered"].includes(order.status), icon: UtensilsCrossed },
    { label: "انتهاء التحضير", time: order.readyAt ?? (["ready","delivering","delivered"].includes(order.status) ? new Date(created.getTime()+20*60000) : null),               done: ["ready","delivering","delivered"].includes(order.status),               icon: CheckCircle2    },
    { label: "تعيين السائق",   time: order.deliveringAt ?? null,                                                                                done: !!order.driverId,                                          icon: Bike            },
    { label: "بدء التوصيل",    time: order.deliveringAt ?? null,                                                                                done: ["delivering","delivered"].includes(order.status),          icon: Truck           },
    { label: "التسليم",        time: delivered,                                                                                                  done: !!delivered,                                               icon: CheckCircle2    },
    { label: "إلغاء الطلب",    time: order.cancelledAt ?? null,                                                                                 done: order.status === "cancelled",                              icon: XCircle         },
  ];

  if (order.type !== "delivery") {
    return steps.filter(s => !["تعيين السائق","بدء التوصيل","التسليم"].includes(s.label));
  }
  if (order.status !== "cancelled") {
    return steps.filter(s => s.label !== "إلغاء الطلب");
  }
  return steps.filter(s => !["تعيين السائق","بدء التوصيل","التسليم"].includes(s.label) || s.done);
}

function OrderTimeline({ order }: { order: LiveOrder }) {
  const events = buildTimeline(order);
  return (
    <div className="mt-3 pr-2">
      {events.map((e, i) => (
        <div key={i} className="flex gap-3 pb-3 last:pb-0">
          {/* Line + dot */}
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2",
              e.done
                ? e.label === "إلغاء الطلب"
                  ? "bg-status-error/15 border-status-error/40 text-status-error"
                  : "bg-status-success/15 border-status-success/40 text-status-success"
                : "bg-surface-elevated border-border text-text-muted"
            )}>
              <e.icon className="w-3.5 h-3.5" />
            </div>
            {i < events.length - 1 && (
              <div className={cn("w-0.5 flex-1 my-0.5 rounded-full", e.done ? "bg-status-success/30" : "bg-border")} />
            )}
          </div>
          {/* Content */}
          <div className="pb-1 pt-0.5">
            <p className={cn("text-xs font-semibold", e.done ? "text-text-primary" : "text-text-muted")}>{e.label}</p>
            {e.time ? (
              <p className="text-[10px] text-text-muted mt-0.5">{timeLabel(e.time)}</p>
            ) : (
              <p className="text-[10px] text-text-muted/50 mt-0.5">لم يحدث بعد</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Order Card ─────────────────────────────────────────────── */
function AdminOrderCard({ order }: { order: LiveOrder }) {
  const [open, setOpen] = useState(false);
  const age = waitedMin(order.createdAt);

  const typeIcon = order.type === "dine_in" ? UtensilsCrossed : order.type === "takeaway" ? ShoppingBag : Truck;
  const TypeIcon = typeIcon;

  return (
    <div className={cn(
      "bg-surface border border-border rounded-2xl overflow-hidden shadow-card",
      "transition-all duration-200 hover:shadow-elevated",
      "border-r-4",
      {
        "border-r-status-warning":   order.status === "pending",
        "border-r-primary":          order.status === "preparing",
        "border-r-status-success":   order.status === "ready",
        "border-r-status-info":      order.status === "delivering",
        "border-r-status-success/50": order.status === "delivered",
        "border-r-status-error/50":  order.status === "cancelled",
      }
    )}>
      <div className="p-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-text-primary">#{order.orderNumber ?? order.id.slice(0,6)}</span>
            <StatusBadge status={order.status} />
            <span className="flex items-center gap-1 text-[10px] text-text-muted bg-surface-elevated rounded-full px-1.5 py-0.5 border border-border">
              <TypeIcon className="w-2.5 h-2.5" />
              <OrderTypeBadge type={order.type} />
            </span>
          </div>
          <div className="text-left shrink-0">
            <p className="text-sm font-bold text-primary">{order.total.toFixed(1)} د.ع</p>
            <p className="text-[10px] text-text-muted">{minLabel(age)} مضت</p>
          </div>
        </div>

        {/* Customer row */}
        {order.customerName && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {order.customerName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{order.customerName}</p>
              {order.customerPhone && <p className="text-[10px] text-text-muted" dir="ltr">{order.customerPhone}</p>}
            </div>
            {order.zone && (
              <span className="text-[10px] text-status-info bg-status-info/10 border border-status-info/20 rounded-lg px-1.5 py-0.5 flex items-center gap-0.5">
                <MapPin className="w-2 h-2" />{order.zone}
              </span>
            )}
          </div>
        )}

        {/* Address */}
        {order.deliveryAddress && (
          <div className="flex items-start gap-1.5 mt-1.5 text-[10px] text-text-muted">
            <MapPin className="w-2.5 h-2.5 shrink-0 mt-0.5 text-primary/60" />
            <span className="line-clamp-1">{order.deliveryAddress}</span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />{timeLabel(order.createdAt)}
          </span>
          {order.driverName && (
            <span className="flex items-center gap-1">
              <Bike className="w-2.5 h-2.5" />{order.driverName}
            </span>
          )}
          {order.hasIssue && (
            <span className="flex items-center gap-1 text-status-error font-semibold">
              <AlertTriangle className="w-2.5 h-2.5" />مشكلة
            </span>
          )}
        </div>

        {/* Items summary */}
        <p className="text-[10px] text-text-muted mt-1.5 line-clamp-1">
          {order.items.map(i => `${i.name} ×${i.quantity}`).join(" · ")}
        </p>

        {/* Expand button */}
        <button
          onClick={() => setOpen(p => !p)}
          className="mt-2 flex items-center gap-1 text-[11px] text-primary font-medium"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {open ? "إخفاء التفاصيل" : "عرض الخط الزمني"}
        </button>

        {/* Timeline */}
        {open && <OrderTimeline order={order} />}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
type SortKey = "newest" | "oldest" | "highest" | "lowest";

export function AdminOrdersPage() {
  const { orders } = useOrders();
  const [query,       setQuery]       = useState("");
  const [statusFilter, setStatus]    = useState<string>("all");
  const [typeFilter,   setType]      = useState<string>("all");
  const [sortKey,      setSort]      = useState<SortKey>("newest");
  const [filtersOpen,  setFiltersOpen] = useState(false);

  const STATUS_OPTS: { id: string; label: string }[] = [
    { id: "all",        label: "الكل"    },
    { id: "pending",    label: "انتظار"  },
    { id: "preparing",  label: "تحضير"   },
    { id: "ready",      label: "جاهز"    },
    { id: "delivering", label: "توصيل"   },
    { id: "delivered",  label: "تسليم"   },
    { id: "cancelled",  label: "ملغي"    },
  ];

  const TYPE_OPTS: { id: string; label: string; Icon: React.ElementType }[] = [
    { id: "all",      label: "الكل",   Icon: Filter          },
    { id: "dine_in",  label: "داخلي",  Icon: UtensilsCrossed },
    { id: "takeaway", label: "سفري",   Icon: ShoppingBag     },
    { id: "delivery", label: "توصيل",  Icon: Truck           },
  ];

  const filtered = useMemo(() => {
    const q = normalizeAr(query);
    let list = orders.filter(o => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (typeFilter   !== "all" && o.type   !== typeFilter)   return false;
      if (!q) return true;
      return (
        normalizeAr(o.id).includes(q) ||
        normalizeAr(o.customerName ?? "").includes(q) ||
        (o.customerPhone ?? "").includes(query) ||
        normalizeAr(o.deliveryAddress ?? "").includes(q) ||
        normalizeAr(o.zone ?? "").includes(q) ||
        normalizeAr(o.driverName ?? "").includes(q)
      );
    });
    switch (sortKey) {
      case "newest":  list = [...list].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()); break;
      case "oldest":  list = [...list].sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime()); break;
      case "highest": list = [...list].sort((a,b) => b.total - a.total); break;
      case "lowest":  list = [...list].sort((a,b) => a.total - b.total); break;
    }
    return list;
  }, [orders, query, statusFilter, typeFilter, sortKey]);

  return (
    <div className="flex flex-col gap-0">

      {/* Search */}
      <div className="px-4 pt-4 pb-3 border-b border-border bg-surface sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="رقم الطلب · اسم الزبون · هاتف · عنوان · سائق..."
            className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
              <X className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen(p => !p)}
          className="mt-2 flex items-center gap-1.5 text-xs text-text-muted"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {filtersOpen ? "إخفاء الفلاتر" : "الفلاتر والترتيب"}
          {(statusFilter !== "all" || typeFilter !== "all") && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>

        {filtersOpen && (
          <div className="mt-3 flex flex-col gap-2">
            {/* Type */}
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {TYPE_OPTS.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={cn("shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                    typeFilter === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
                  )}>
                  <t.Icon className="w-3 h-3" />{t.label}
                </button>
              ))}
            </div>
            {/* Status */}
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {STATUS_OPTS.map(s => (
                <button key={s.id} onClick={() => setStatus(s.id)}
                  className={cn("shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                    statusFilter === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface-elevated border-border text-text-muted"
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
            {/* Sort */}
            <div className="flex gap-1.5">
              {([
                { id:"newest",  label:"الأحدث"  },
                { id:"oldest",  label:"الأقدم"  },
                { id:"highest", label:"الأعلى سعراً" },
                { id:"lowest",  label:"الأقل سعراً"  },
              ] as {id:SortKey;label:string}[]).map(s => (
                <button key={s.id} onClick={() => setSort(s.id)}
                  className={cn("flex-1 py-1.5 rounded-xl border text-xs font-medium transition-all",
                    sortKey === s.id ? "bg-surface border-primary text-primary" : "bg-surface-elevated border-border text-text-muted"
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
          {filtered.length} طلب
        </span>
        <span className="text-xs text-text-muted">من إجمالي {orders.length}</span>
      </div>

      {/* Orders list */}
      <div className="px-4 pb-6 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-sm font-semibold text-text-primary">لا توجد نتائج</p>
            <p className="text-xs text-text-muted">جرّب تغيير الفلاتر أو الكلمة البحثية</p>
          </div>
        ) : (
          filtered.map(o => <AdminOrderCard key={o.id} order={o} />)
        )}
      </div>
    </div>
  );
}
