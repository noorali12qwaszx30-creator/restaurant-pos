import { useState, useEffect, useCallback } from "react";
import { RefreshCw, BarChart3, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SACard, SASkeleton, SASection } from "../components/SACard";
import { SABarChart, SASparkline, SADonut } from "../components/SACharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface RestaurantStats {
  id: string; name: string;
  orders: number; revenue: number; staff: number;
  deliveredOrders: number; cancelledOrders: number;
  weeklyOrders: number[];
}

const DAY_LABELS = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

export function SuperAdminAnalyticsPage() {
  const [stats, setStats] = useState<RestaurantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyAll, setWeeklyAll] = useState<number[]>([]);
  const [revenueAll, setRevenueAll] = useState<number[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);

      const { data: rests } = await db.from("restaurants").select("id, name").order("name");
      const { data: allOrders } = await db.from("orders")
        .select("status, total, created_at, restaurant_id")
        .gte("created_at", weekAgo.toISOString());
      const { data: staffCounts } = await db.from("profiles")
        .select("restaurant_id").not("restaurant_id", "is", null);

      // Aggregate weekly totals
      const wOrders = Array(7).fill(0);
      const wRevenue = Array(7).fill(0);
      (allOrders ?? []).forEach((o: { created_at: string; status: string; total: number }) => {
        const day = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / 86400000);
        if (day >= 0 && day < 7) {
          wOrders[6 - day]++;
          if (o.status === "delivered") wRevenue[6 - day] += Number(o.total);
        }
      });
      setWeeklyAll(wOrders);
      setRevenueAll(wRevenue);

      // Per-restaurant stats
      const staffMap: Record<string, number> = {};
      (staffCounts ?? []).forEach((p: { restaurant_id: string }) => {
        staffMap[p.restaurant_id] = (staffMap[p.restaurant_id] ?? 0) + 1;
      });

      const restStats: RestaurantStats[] = (rests ?? []).map((r: { id: string; name: string }) => {
        const rOrders = (allOrders ?? []).filter((o: { restaurant_id: string }) => o.restaurant_id === r.id);
        const delivered = rOrders.filter((o: { status: string }) => o.status === "delivered");
        const cancelled = rOrders.filter((o: { status: string }) => o.status === "cancelled");
        const weeklyOrders = Array(7).fill(0);
        rOrders.forEach((o: { created_at: string }) => {
          const day = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / 86400000);
          if (day >= 0 && day < 7) weeklyOrders[6 - day]++;
        });
        return {
          id: r.id,
          name: r.name,
          orders: rOrders.length,
          revenue: delivered.reduce((s: number, o: { total: number }) => s + Number(o.total), 0),
          staff: staffMap[r.id] ?? 0,
          deliveredOrders: delivered.length,
          cancelledOrders: cancelled.length,
          weeklyOrders,
        };
      });
      setStats(restStats.sort((a, b) => b.orders - a.orders));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && stats.length === 0) return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-6">
      {Array(4).fill(0).map((_, i) => <SASkeleton key={i} className="h-32 rounded-2xl" />)}
    </div>
  );

  const totalWeekOrders = weeklyAll.reduce((s, v) => s + v, 0);
  const dayLabels = Array(7).fill(0).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return DAY_LABELS[d.getDay()];
  });

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-text-primary">التحليلات</h1>
          <p className="text-[11px] text-text-muted">آخر 7 أيام</p>
        </div>
        <button onClick={load} disabled={loading}
          className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors disabled:opacity-40">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Weekly orders bar */}
      <SASection title="الطلبات اليومية" subtitle={`${totalWeekOrders} طلب في 7 أيام`}>
        <SACard className="p-4">
          <SABarChart
            data={weeklyAll.map((v, i) => ({ label: dayLabels[i], value: v }))}
            height={130}
          />
        </SACard>
      </SASection>

      {/* Revenue sparkline */}
      <SASection title="اتجاه الإيراد" subtitle="المبيعات المُسلَّمة فقط">
        <SACard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xl font-black text-primary tabular-nums font-mono">
              {revenueAll.reduce((s, v) => s + v, 0).toLocaleString("en-US")}
              <span className="text-xs font-normal text-text-muted mr-1">د.ع</span>
            </p>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <SASparkline data={revenueAll.length > 0 ? revenueAll : [0, 0]} height={48} filled />
          <div className="flex justify-between mt-2">
            {dayLabels.map((l, i) => (
              <p key={i} className="text-[9px] text-text-muted text-center flex-1">{l}</p>
            ))}
          </div>
        </SACard>
      </SASection>

      {/* Restaurant comparison */}
      <SASection title="مقارنة المطاعم" subtitle="الأسبوع الماضي">
        {stats.length === 0 ? (
          <SACard className="p-8 flex flex-col items-center gap-2">
            <BarChart3 className="w-8 h-8 text-text-muted/30" />
            <p className="text-sm text-text-muted">لا توجد بيانات</p>
          </SACard>
        ) : (
          <div className="flex flex-col gap-3">
            {stats.map((r, i) => {
              const successRate = r.orders > 0 ? Math.round(r.deliveredOrders / r.orders * 100) : 0;
              const donutData = [
                { value: r.deliveredOrders, color: "#34d399", label: "مُسلَّم" },
                { value: r.cancelledOrders, color: "#f87171", label: "ملغي" },
                { value: Math.max(0, r.orders - r.deliveredOrders - r.cancelledOrders), color: "#fbbf24", label: "قيد التنفيذ" },
              ].filter(d => d.value > 0);

              return (
                <SACard key={r.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                      i === 0 ? "bg-amber-400/20 text-amber-400" :
                      i === 1 ? "bg-slate-400/15 text-slate-400" :
                      i === 2 ? "bg-orange-600/15 text-orange-600" :
                      "bg-surface-elevated text-text-muted"
                    )}>
                      {i === 0 ? <Award className="w-4 h-4" /> : `#${i + 1}`}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-text-primary truncate">{r.name}</p>
                        <span className="text-[10px] text-text-muted">{r.staff} موظف</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <StatMini label="الطلبات" value={r.orders} />
                        <StatMini label="الإيراد" value={`${(r.revenue / 1000).toFixed(0)}k`} />
                        <StatMini label="النجاح" value={`${successRate}%`} />
                      </div>

                      {/* Sparkline */}
                      {r.weeklyOrders.some(v => v > 0) && (
                        <SASparkline data={r.weeklyOrders} height={28} color={
                          i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : "#f97316"
                        } />
                      )}
                    </div>

                    {/* Donut */}
                    {donutData.length > 0 && (
                      <SADonut segments={donutData} size={64} className="shrink-0" />
                    )}
                  </div>
                </SACard>
              );
            })}
          </div>
        )}
      </SASection>

      {/* Top performers */}
      {stats.length > 0 && (
        <SASection title="الأعلى إيراداً">
          <SACard className="p-4">
            <div className="flex flex-col gap-2">
              {stats.slice(0, 5).map((r, i) => {
                const maxRev = stats[0].revenue || 1;
                const pct = (r.revenue / maxRev) * 100;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <p className="text-[10px] text-text-muted w-3 shrink-0 font-mono">{i + 1}</p>
                    <p className="text-xs text-text-secondary w-20 shrink-0 truncate">{r.name}</p>
                    <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs font-black text-primary tabular-nums font-mono w-16 text-left">
                      {r.revenue.toLocaleString("en-US")}
                    </p>
                  </div>
                );
              })}
            </div>
          </SACard>
        </SASection>
      )}

    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-elevated rounded-lg p-2 text-center">
      <p className="text-sm font-black text-text-primary tabular-nums font-mono">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      <p className="text-[9px] text-text-muted">{label}</p>
    </div>
  );
}
