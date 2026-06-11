/**
 * Super Admin — إحصائيات شاملة لجميع المطاعم
 */
import { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, ShoppingBag, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface RestaurantStats {
  id: string;
  name: string;
  is_active: boolean;
  total_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  today_orders: number;
  today_revenue: number;
}

export function SuperAdminStatsPage() {
  const [stats, setStats] = useState<RestaurantStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: rests } = await db
        .from("restaurants")
        .select("id, name, is_active")
        .order("name");

      const enriched = await Promise.all((rests ?? []).map(async (r: { id: string; name: string; is_active: boolean }) => {
        const [
          { data: allOrders },
          { data: todayOrders },
        ] = await Promise.all([
          db.from("orders").select("status, total").eq("restaurant_id", r.id),
          db.from("orders").select("status, total")
            .eq("restaurant_id", r.id)
            .gte("created_at", today.toISOString()),
        ]);

        const delivered = (allOrders ?? []).filter((o: { status: string }) => o.status === "delivered");
        const cancelled = (allOrders ?? []).filter((o: { status: string }) => o.status === "cancelled");
        const todayDelivered = (todayOrders ?? []).filter((o: { status: string }) => o.status === "delivered");

        return {
          ...r,
          total_orders:     (allOrders ?? []).length,
          delivered_orders: delivered.length,
          cancelled_orders: cancelled.length,
          total_revenue:    delivered.reduce((s: number, o: { total: number }) => s + Number(o.total), 0),
          today_orders:     (todayOrders ?? []).length,
          today_revenue:    todayDelivered.reduce((s: number, o: { total: number }) => s + Number(o.total), 0),
        };
      }));

      setStats(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Totals
  const totalRevenue   = stats.reduce((s, r) => s + r.total_revenue,   0);
  const todayRevenue   = stats.reduce((s, r) => s + r.today_revenue,   0);
  const totalOrders    = stats.reduce((s, r) => s + r.total_orders,    0);
  const todayOrders    = stats.reduce((s, r) => s + r.today_orders,    0);

  return (
    <div className="flex flex-col pb-4 px-4 pt-4 gap-4">

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* ── Global Summary ── */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-primary mb-3">الإجمالي الكلي — جميع المطاعم</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "إيرادات اليوم (د.ع)", value: todayRevenue, icon: TrendingUp, color: "text-primary" },
                { label: "إيرادات كلية (د.ع)", value: totalRevenue, icon: TrendingUp, color: "text-emerald-600" },
                { label: "طلبات اليوم", value: todayOrders, icon: ShoppingBag, color: "text-sky-600" },
                { label: "طلبات كلية", value: totalOrders, icon: ShoppingBag, color: "text-text-secondary" },
              ].map(s => (
                <div key={s.label} className="bg-surface/80 rounded-xl p-3 flex items-center gap-2.5">
                  <s.icon className={`w-4 h-4 shrink-0 ${s.color}`} />
                  <div>
                    <p className={`text-base font-black tabular-nums ${s.color}`}>
                      {s.value.toLocaleString("en-US")}
                    </p>
                    <p className="text-[10px] text-text-muted leading-tight">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Per Restaurant ── */}
          <p className="text-xs font-bold text-text-secondary">تفصيل لكل مطعم</p>

          {stats.map(r => (
            <div key={r.id} className={`bg-surface border rounded-2xl p-4 ${!r.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <p className="font-bold text-text-primary">{r.name}</p>
                {!r.is_active && (
                  <span className="text-[10px] bg-status-error/10 text-status-error border border-status-error/20 rounded-full px-2 py-0.5 mr-auto">
                    معطّل
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <StatCard label="اليوم" value={r.today_orders.toLocaleString("en-US")} sub="طلب" />
                <StatCard label="الكل" value={r.total_orders.toLocaleString("en-US")} sub="طلب" />
                <StatCard label="الإيراد" value={r.total_revenue.toLocaleString("en-US")} sub="د.ع" highlight />
              </div>

              <div className="flex gap-3 mt-2 pt-2 border-t border-border text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-status-success" />
                  {r.delivered_orders} مُسلَّم
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-status-error" />
                  {r.cancelled_orders} ملغي
                </span>
                {r.total_orders > 0 && (
                  <span className="mr-auto text-primary font-medium">
                    {Math.round(r.delivered_orders / r.total_orders * 100)}% نجاح
                  </span>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: {
  label: string; value: string; sub: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl px-2 py-2 text-center border ${highlight ? "bg-primary/5 border-primary/15" : "bg-surface-elevated border-border"}`}>
      <p className={`text-base font-black tabular-nums ${highlight ? "text-primary" : "text-text-primary"}`}>{value}</p>
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className="text-[10px] text-text-muted opacity-70">{sub}</p>
    </div>
  );
}
