/**
 * Super Admin — نظرة عامة على النظام بالكامل
 */
import { useState, useEffect, useCallback } from "react";
import {
  Building2, Users, ShoppingBag, TrendingUp,
  CheckCircle2, XCircle, Clock, Loader2, RefreshCw,
  Activity, Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Overview {
  totalRestaurants: number;
  activeRestaurants: number;
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  todayOrders: number;
}

export function SuperAdminOverviewPage() {
  const [data, setData]     = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date(); today.setHours(0,0,0,0);

      const [
        { data: rests },
        { data: users },
        { data: orders },
        { data: todayOrders },
      ] = await Promise.all([
        db.from("restaurants").select("id, is_active"),
        db.from("profiles").select("id, is_active").not("restaurant_id", "is", null),
        db.from("orders").select("status, total"),
        db.from("orders").select("status, total").gte("created_at", today.toISOString()),
      ]);

      const delivered  = (orders ?? []).filter((o: {status:string}) => o.status === "delivered");
      const cancelled  = (orders ?? []).filter((o: {status:string}) => o.status === "cancelled");
      const pending    = (orders ?? []).filter((o: {status:string}) => ["pending","preparing","ready","delivering"].includes(o.status));
      const todayDel   = (todayOrders ?? []).filter((o: {status:string}) => o.status === "delivered");

      setData({
        totalRestaurants:  (rests  ?? []).length,
        activeRestaurants: (rests  ?? []).filter((r:{is_active:boolean}) => r.is_active).length,
        totalUsers:        (users  ?? []).length,
        activeUsers:       (users  ?? []).filter((u:{is_active:boolean}) => u.is_active).length,
        totalOrders:       (orders ?? []).length,
        deliveredOrders:   delivered.length,
        cancelledOrders:   cancelled.length,
        pendingOrders:     pending.length,
        totalRevenue:      delivered.reduce((s:{},o:{total:number}) => (s as number) + Number(o.total), 0) as number,
        todayRevenue:      todayDel.reduce((s:{},o:{total:number}) => (s as number) + Number(o.total), 0) as number,
        todayOrders:       (todayOrders ?? []).length,
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const successRate = data && data.totalOrders > 0
    ? Math.round(data.deliveredOrders / data.totalOrders * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-4">

      {/* ── Title bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-black text-text-primary">مركز التحكم</p>
          <p className="text-[11px] text-text-muted font-mono">
            {lastUpdated ? lastUpdated.toLocaleTimeString("ar-IQ") : "جاري التحميل..."}
          </p>
        </div>
        <button
          onClick={load}
          className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          {/* ── Today highlight ── */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-primary uppercase tracking-wider">اليوم</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <KpiBox label="الإيراد" value={`${data.todayRevenue.toLocaleString("en-US")} د.ع`} accent />
              <KpiBox label="الطلبات" value={data.todayOrders.toLocaleString("en-US")} />
            </div>
          </div>

          {/* ── Platform stats ── */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Building2}
              label="المطاعم"
              value={data.totalRestaurants}
              sub={`${data.activeRestaurants} نشط`}
              color="text-amber-400"
              bg="bg-amber-400/10 border-amber-400/20"
            />
            <StatCard
              icon={Users}
              label="الموظفون"
              value={data.totalUsers}
              sub={`${data.activeUsers} نشط`}
              color="text-sky-400"
              bg="bg-sky-400/10 border-sky-400/20"
            />
            <StatCard
              icon={ShoppingBag}
              label="الطلبات الكلية"
              value={data.totalOrders}
              sub={`${data.pendingOrders} قيد التنفيذ`}
              color="text-violet-400"
              bg="bg-violet-400/10 border-violet-400/20"
            />
            <StatCard
              icon={TrendingUp}
              label="الإيراد الكلي"
              value={`${(data.totalRevenue / 1000).toFixed(0)}k`}
              sub="دينار عراقي"
              color="text-emerald-400"
              bg="bg-emerald-400/10 border-emerald-400/20"
            />
          </div>

          {/* ── Orders breakdown ── */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">توزيع الطلبات</p>
            <div className="flex flex-col gap-2">
              <OrderBar
                icon={CheckCircle2} label="مُسلَّمة"
                count={data.deliveredOrders} total={data.totalOrders}
                color="bg-emerald-500" textColor="text-emerald-400"
              />
              <OrderBar
                icon={Clock} label="قيد التنفيذ"
                count={data.pendingOrders} total={data.totalOrders}
                color="bg-amber-500" textColor="text-amber-400"
              />
              <OrderBar
                icon={XCircle} label="ملغاة"
                count={data.cancelledOrders} total={data.totalOrders}
                color="bg-red-500" textColor="text-red-400"
              />
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-text-muted">نسبة النجاح الكلية</p>
              <p className={cn(
                "text-sm font-black tabular-nums",
                successRate >= 80 ? "text-emerald-400" : successRate >= 50 ? "text-amber-400" : "text-red-400"
              )}>
                {successRate}%
              </p>
            </div>
          </div>

          {/* ── System status ── */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              حالة النظام
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Supabase Auth",      status: "online" },
                { label: "PostgreSQL DB",       status: "online" },
                { label: "Edge Functions",      status: "online" },
                { label: "Realtime",            status: "online" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1">
                  <span className="text-xs text-text-secondary font-mono">{s.label}</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function KpiBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl p-3 border text-center",
      accent ? "bg-primary/10 border-primary/25" : "bg-surface-elevated border-border"
    )}>
      <p className={cn("text-lg font-black tabular-nums leading-tight", accent ? "text-primary" : "text-text-primary")}>
        {value}
      </p>
      <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: number | string;
  sub: string; color: string; bg: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-3.5", bg)}>
      <Icon className={cn("w-5 h-5 mb-2", color)} />
      <p className={cn("text-2xl font-black tabular-nums leading-none", color)}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      <p className="text-xs text-text-secondary mt-1 font-medium">{label}</p>
      <p className="text-[10px] text-text-muted">{sub}</p>
    </div>
  );
}

function OrderBar({ icon: Icon, label, count, total, color, textColor }: {
  icon: React.ElementType; label: string; count: number; total: number;
  color: string; textColor: string;
}) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("w-3.5 h-3.5 shrink-0", textColor)} />
      <p className="text-xs text-text-secondary w-16 shrink-0">{label}</p>
      <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <p className={cn("text-xs font-bold tabular-nums w-8 text-left", textColor)}>{count}</p>
    </div>
  );
}
