import { useState, useMemo } from "react";
import { MapPin, Clock, FileText, Phone, MessageCircle, Bike, BellRing, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/dashboard/EmptyState";

// ── لوحة التأكيد المنبثقة ─────────────────────────────────────
function ConfirmSheet({ mode, order, loading, onConfirm, onCancel }: {
  mode: "accept" | "reject";
  order: LiveOrder;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isAccept = mode === "accept";
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" dir="rtl">
      {/* الخلفية المعتمة */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />

      {/* اللوحة */}
      <div className="relative w-full max-w-md bg-surface rounded-t-3xl p-5 pb-8 slide-up shadow-dialog">
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />

        <div className="flex flex-col items-center text-center gap-2 mb-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isAccept ? "bg-primary/10" : "bg-status-error/10"}`}>
            {isAccept
              ? <CheckCircle2 className="w-7 h-7 text-primary" />
              : <XCircle className="w-7 h-7 text-status-error" />}
          </div>
          <p className="text-lg font-bold text-text-primary">
            {isAccept ? "قبول الطلب والانطلاق؟" : "رفض هذا الطلب؟"}
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            {isAccept
              ? "سينتقل الطلب إلى قائمة طلباتك وتبدأ رحلة التوصيل"
              : "سيرجع الطلب إلى الميدان ليُسند لسائق آخر"}
          </p>
          <div className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl px-3 py-2 mt-1">
            <span className="text-sm font-black text-primary num">#{order.orderNumber ?? order.id.slice(0, 4)}</span>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-sm font-bold text-text-primary num">{order.total.toFixed(1)} د.ع</span>
            {order.zone && <>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-secondary">{order.zone}</span>
            </>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-12 rounded-2xl border border-border bg-surface-elevated text-text-secondary text-sm font-bold disabled:opacity-50 active:scale-[0.97] transition-all"
          >
            تراجع
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`h-12 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97] transition-all shadow-elevated ${isAccept ? "bg-primary" : "bg-status-error"}`}
          >
            {loading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : isAccept ? <><CheckCircle2 className="w-4 h-4" /> تأكيد القبول</> : <><XCircle className="w-4 h-4" /> تأكيد الرفض</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function waitedLabel(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `${m} د مضت` : `${Math.floor(m / 60)} س ${m % 60} د مضت`;
}

function ContactButtons({ phone }: { phone?: string }) {
  if (!phone) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      <a href={`tel:${phone}`}
        className="h-10 rounded-xl bg-status-info/10 text-status-info border border-status-info/20 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
        <Phone className="w-3.5 h-3.5" /> اتصال
      </a>
      <a href={`https://wa.me/${phone.replace(/^0/, "966")}`} target="_blank" rel="noopener noreferrer"
        className="h-10 rounded-xl bg-status-success/10 text-status-success border border-status-success/20 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
        <MessageCircle className="w-3.5 h-3.5" /> واتساب
      </a>
    </div>
  );
}

function NewOrderCard({ order, onAccept, onReject }: {
  order: LiveOrder;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState<"accept" | "reject" | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!confirm) return;
    setLoading(true);
    try {
      if (confirm === "accept") await onAccept();
      else await onReject();
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  }

  return (
    <div className="bg-surface border-2 border-primary/30 rounded-3xl overflow-hidden shadow-elevated animate-in">
      {/* Animated top strip */}
      <div className="h-1.5 bg-gradient-to-l from-primary via-primary/70 to-transparent" />
      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-primary/10 text-primary text-base font-black shrink-0 num">
                {order.orderNumber ?? order.id.slice(0, 3)}
              </span>
              <span className="text-sm font-bold bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 flex items-center gap-1.5">
                <BellRing className="w-3 h-3 animate-pulse" /> مُسند لك
              </span>
            </div>
            <span className="text-xs text-text-muted flex items-center gap-1.5 mt-2 num">
              <Clock className="w-3 h-3" />{waitedLabel(order.createdAt)}
            </span>
          </div>
          <div className="text-left">
            <p className="text-2xl font-black text-primary num">{order.total.toFixed(1)}</p>
            <p className="text-xs text-text-muted font-medium">د.ع</p>
            {order.deliveryFee > 0 && (
              <p className="text-xs text-status-success font-semibold mt-0.5 num">+{order.deliveryFee} توصيل</p>
            )}
          </div>
        </div>

        {/* Customer */}
        {order.customerName && (
          <div className="flex items-center gap-3 bg-surface-elevated rounded-2xl px-3 py-2.5 border border-border/50">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
              {order.customerName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary">{order.customerName}</p>
              <p className="text-xs text-text-muted num" dir="ltr">{order.customerPhone}</p>
            </div>
          </div>
        )}

        {/* Address */}
        {order.deliveryAddress && (
          <div className="flex items-start gap-2.5 text-sm text-text-secondary bg-surface-elevated rounded-xl px-3 py-2.5 border border-border/50">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              {order.zone && <span className="font-bold text-primary">{order.zone} · </span>}
              <span>{order.deliveryAddress}</span>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="rounded-xl border border-border/60 overflow-hidden">
          {Array.from({ length: 5 }).map((_, idx) => {
            const item = order.items[idx];
            return (
              <div key={idx} className={`flex items-center justify-between gap-2 px-3 h-8 ${idx < 4 ? "border-b border-border/40" : ""} ${!item ? "opacity-0" : ""}`}>
                {item ? (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 num">{item.quantity}</span>
                      <span className="text-xs text-text-secondary truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-text-primary num shrink-0">{(item.unitPrice * item.quantity).toFixed(0)} د.ع</span>
                  </>
                ) : <span />}
              </div>
            );
          })}
        </div>
        {order.items.length > 5 && (
          <p className="text-[10px] text-text-muted text-center">+{order.items.length - 5} أصناف أخرى</p>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="flex items-start gap-2 text-sm text-primary bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5">
            <FileText className="w-4 h-4 shrink-0 mt-0.5" />
            {order.notes}
          </div>
        )}

        {/* Contact */}
        <ContactButtons phone={order.customerPhone} />

        {/* ── زرا القبول والرفض ── */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setConfirm("reject")}
            className="h-12 rounded-2xl border-2 border-status-error/30 bg-status-error/5 text-status-error font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all"
          >
            <XCircle className="w-4 h-4" /> رفض
          </button>
          <button
            onClick={() => setConfirm("accept")}
            className="col-span-2 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-elevated"
          >
            <CheckCircle2 className="w-5 h-5" /> قبول الطلب
          </button>
        </div>
      </div>

      {/* لوحة التأكيد */}
      {confirm && (
        <ConfirmSheet
          mode={confirm}
          order={order}
          loading={loading}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

export function NewOrdersPage() {
  const { orders, acceptOrder, rejectOrder } = useOrders();
  const { profile } = useAuth();
  const driverId = profile?.uid ?? "mock-delivery-001";

  const myNewOrders = useMemo(() => {
    return orders.filter(o =>
      (o.driverId === driverId || o.driverId === "mock-delivery-001") &&
      o.status === "assigned"
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders, driverId]);

  const pendingCount = myNewOrders.length;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      {myNewOrders.length === 0 ? (
        <EmptyState
          icon={<Bike className="w-8 h-8" />}
          title="لا توجد طلبات جديدة"
          description="ستظهر هنا الطلبات المُسندة لك"
        />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">طلبات مُسندة لك</span>
            {pendingCount > 0 && (
              <span className="text-xs font-bold text-white bg-status-error rounded-full px-2 py-0.5 animate-pulse">
                {pendingCount} تنتظر قبولك
              </span>
            )}
          </div>
          {myNewOrders.map(o => (
            <NewOrderCard
              key={o.id}
              order={o}
              onAccept={() => acceptOrder(o.id)}
              onReject={() => rejectOrder(o.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
