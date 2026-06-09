import { useState, useEffect, useMemo } from "react";
import {
  MapPin, Clock, AlertTriangle, AlertCircle, AlertOctagon,
  CheckCircle2, FileText, X, Phone, MessageCircle, Bike,
} from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

const ISSUE_REASONS = [
  "لا يمكن الوصول للعنوان",
  "الزبون لا يرد على الهاتف",
  "الزبون غائب عند الوصول",
  "عنوان خاطئ أو غير موجود",
  "طلب المستخدم الإلغاء",
  "حادث أو ظرف طارئ",
  "أخرى",
];

// ── Live timer tick ────────────────────────────────────────────
function useTick() {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

function waitedMin(d: Date) { return Math.floor((Date.now() - d.getTime()) / 60000); }

function DelayIndicator({ since }: { since: Date }) {
  const m = waitedMin(since);
  if (m < 15) return null;
  const cfg =
    m >= 40 ? { label: `حرج · ${m}د`,   Icon: AlertOctagon, cls: "bg-status-error text-white border-status-error" } :
    m >= 25 ? { label: `متأخر · ${m}د`,  Icon: AlertCircle,  cls: "bg-status-error/10 text-status-error border-status-error/30" } :
              { label: `تحذير · ${m}د`,  Icon: AlertTriangle, cls: "bg-status-warning/10 text-status-warning border-status-warning/30" };
  return (
    <span className={cn("text-[10px] font-bold border rounded-full px-2 py-0.5 flex items-center gap-1", cfg.cls)}>
      <cfg.Icon className="w-2.5 h-2.5" />{cfg.label}
    </span>
  );
}

function ContactButtons({ phone }: { phone?: string }) {
  if (!phone) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
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

function ActiveOrderCard({ order, onDeliver, onIssue }: {
  order: LiveOrder;
  onDeliver: (id: string) => Promise<void>;
  onIssue: (id: string, reason: string, note: string) => Promise<void>;
}) {
  const [issueOpen, setIssueOpen]     = useState(false);
  const [issueReason, setIssueReason] = useState("");
  const [issueNote, setIssueNote]     = useState("");
  const [confirming, setConfirming]   = useState(false);
  const [loading, setLoading]         = useState(false);

  const since = order.deliveringAt ?? order.createdAt;
  const m     = waitedMin(since);

  const borderCls =
    m >= 40 ? "border-status-error/50" :
    m >= 25 ? "border-status-error/30" :
    m >= 15 ? "border-status-warning/30" : "border-border";

  async function handleDeliver() {
    if (!confirming) { setConfirming(true); return; }
    setLoading(true);
    await onDeliver(order.id);
    setLoading(false);
    setConfirming(false);
  }

  async function handleIssue() {
    if (!issueReason) return;
    setLoading(true);
    await onIssue(order.id, issueReason, issueNote);
    setLoading(false);
    setIssueOpen(false);
    setIssueReason("");
    setIssueNote("");
  }

  return (
    <div className={cn("bg-surface border-2 rounded-2xl overflow-hidden shadow-card", borderCls)}>
      <div className={cn("h-1",
        m >= 40 ? "bg-status-error" : m >= 25 ? "bg-status-error/60" : m >= 15 ? "bg-status-warning" : "bg-primary/20"
      )} />

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-text-primary">{order.id}</span>
            <DelayIndicator since={since} />
            {order.hasIssue && (
              <span className="text-[10px] font-bold bg-status-warning/10 text-status-warning border border-status-warning/25 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> مشكلة
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold text-primary">{order.total.toFixed(1)} ر.س</p>
            {order.deliveryFee > 0 && (
              <p className="text-xs text-status-success">+ {order.deliveryFee} ر.س توصيل</p>
            )}
          </div>
        </div>

        {/* Customer */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {order.customerName?.[0] ?? "؟"}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{order.customerName ?? "—"}</p>
            <p className="text-xs text-text-muted" dir="ltr">{order.customerPhone}</p>
          </div>
          <span className="ms-auto text-xs text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />{m} د
          </span>
        </div>

        {/* Address */}
        {order.deliveryAddress && (
          <div className="flex items-start gap-2 bg-surface-elevated rounded-xl px-3 py-2.5 text-xs text-text-secondary">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              {order.zone && <span className="font-semibold text-primary">{order.zone} · </span>}
              {order.deliveryAddress}
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="flex items-start gap-1.5 text-xs text-primary bg-primary/5 border border-primary/15 rounded-xl px-3 py-2">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {order.notes}
          </div>
        )}

        {/* Contact */}
        <ContactButtons phone={order.customerPhone} />

        {/* Issue panel */}
        {issueOpen && (
          <div className="flex flex-col gap-2 border border-status-warning/30 bg-status-warning/5 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-status-warning">الإبلاغ عن مشكلة</p>
              <button onClick={() => { setIssueOpen(false); setIssueReason(""); setIssueNote(""); }}>
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {ISSUE_REASONS.map(r => (
                <button key={r} onClick={() => setIssueReason(r)}
                  className={cn("text-start px-3 py-2 rounded-lg text-sm border transition-all",
                    issueReason === r
                      ? "bg-status-warning/15 border-status-warning/40 text-status-warning font-medium"
                      : "bg-surface border-border text-text-secondary hover:bg-surface-elevated"
                  )}>
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={issueNote}
              onChange={e => setIssueNote(e.target.value)}
              placeholder="ملاحظات إضافية (اختياري)..."
              rows={2}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none outline-none focus:ring-2 focus:ring-status-warning/30"
            />
            <button
              onClick={handleIssue}
              disabled={!issueReason || loading}
              className="h-10 rounded-xl bg-status-warning text-white text-sm font-bold disabled:opacity-40 transition-all active:scale-[0.97]"
            >
              {loading ? "..." : "إرسال البلاغ"}
            </button>
          </div>
        )}

        {/* Actions */}
        {!issueOpen && (
          <div className="flex flex-col gap-2 mt-1">
            {confirming ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirming(false)}
                  className="flex-1 h-12 rounded-xl border border-border text-text-muted text-sm font-medium hover:bg-surface-elevated transition-all">
                  إلغاء
                </button>
                <button onClick={handleDeliver} disabled={loading}
                  className="flex-1 h-12 rounded-xl bg-status-success text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-card disabled:opacity-60">
                  <CheckCircle2 className="w-4 h-4" />
                  {loading ? "..." : "تأكيد التسليم"}
                </button>
              </div>
            ) : (
              <button onClick={handleDeliver}
                className="w-full h-14 rounded-xl bg-status-success text-white text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-elevated">
                <CheckCircle2 className="w-5 h-5" />
                تم التسليم ✓
              </button>
            )}
            {!confirming && (
              <button onClick={() => setIssueOpen(true)}
                className="w-full h-10 rounded-xl border border-status-warning/30 text-status-warning bg-status-warning/5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-status-warning/10 transition-all active:scale-[0.97]">
                <AlertTriangle className="w-3.5 h-3.5" />
                الإبلاغ عن مشكلة
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export function ActiveOrdersPage() {
  useTick();
  const { profile } = useAuth();
  const { orders, markDelivered, reportIssue } = useOrders();

  // In dev mode uid = "mock-delivery-001" / production = profile.uid
  const driverId = profile?.uid ?? "mock-delivery-001";

  // My active delivering orders
  const activeOrders = useMemo(
    () => orders.filter(
      o => (o.driverId === driverId || o.driverId === "mock-delivery-001") &&
           o.status === "delivering"
    ),
    [orders, driverId]
  );

  // Delivered today
  const deliveredToday = useMemo(
    () => orders.filter(
      o => (o.driverId === driverId || o.driverId === "mock-delivery-001") &&
           o.status === "delivered"
    ),
    [orders, driverId]
  );

  return (
    <div className="flex flex-col gap-0 pb-6">
      {/* Stats bar */}
      <div className="px-4 pt-3 pb-3 border-b border-border">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "قيد التوصيل", value: activeOrders.length, cls: "text-status-info bg-status-info/8" },
            { label: "مكتملة اليوم", value: deliveredToday.length, cls: "text-status-success bg-status-success/8" },
            {
              label: "إجمالي اليوم",
              value: `${deliveredToday.reduce((s, o) => s + o.deliveryFee, 0).toFixed(0)} ر.س`,
              cls: "text-primary bg-primary/8",
            },
          ].map(k => (
            <div key={k.label} className={cn("rounded-xl p-2.5 text-center border border-border", k.cls)}>
              <p className="text-base font-bold leading-none">{k.value}</p>
              <p className="text-[10px] text-text-muted mt-1 leading-tight">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active orders */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        {activeOrders.length === 0 ? (
          <EmptyState
            icon={<Bike className="w-8 h-8" />}
            title="لا توجد طلبات نشطة"
            description="ستظهر هنا طلباتك المُسندة فور إرسالها"
          />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-primary">قيد التوصيل</span>
              <span className="text-xs font-bold text-status-info bg-status-info/10 rounded-full px-2 py-0.5 border border-status-info/20">
                {activeOrders.length}
              </span>
            </div>
            {activeOrders.map(o => (
              <ActiveOrderCard
                key={o.id}
                order={o}
                onDeliver={() => markDelivered(o.id)}
                onIssue={(id, reason, note) => reportIssue(id, reason, note)}
              />
            ))}
          </>
        )}
      </div>

      {/* Delivered today */}
      {deliveredToday.length > 0 && (
        <div className="px-4 mt-4 border-t border-border pt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success" />
            <span className="text-sm font-bold text-text-primary">مكتملة اليوم</span>
            <span className="text-xs font-bold text-status-success bg-status-success/10 rounded-full px-2 py-0.5 border border-status-success/20">
              {deliveredToday.length}
            </span>
          </div>
          {deliveredToday.map(o => (
            <div key={o.id} className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary">{o.id}</p>
                <p className="text-xs text-text-muted truncate">{o.customerName} · {o.zone}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">{o.total.toFixed(1)} ر.س</p>
                {o.deliveryFee > 0 && <p className="text-xs text-status-success">+{o.deliveryFee}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
