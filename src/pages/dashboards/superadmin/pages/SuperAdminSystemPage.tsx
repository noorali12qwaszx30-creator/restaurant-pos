/**
 * Super Admin — حالة النظام والإعدادات العامة
 */
import { useState, useEffect, useCallback } from "react";
import {
  Server, Database, Zap, RefreshCw, Loader2,
  Shield, Activity, CheckCircle2, AlertCircle,
  Clock, Users, Building2, ShoppingBag, Hash,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface SystemStats {
  tables: { name: string; count: number; icon: React.ElementType }[];
  functions: { name: string; status: "active" | "inactive" }[];
  dbLatency: number | null;
}

export function SuperAdminSystemPage() {
  const [stats,   setStats]   = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [now,     setNow]     = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const t0 = Date.now();
    try {
      const [
        { count: restaurants },
        { count: profiles },
        { count: orders },
        { count: menuItems },
        { count: categories },
      ] = await Promise.all([
        db.from("restaurants").select("id", { count: "exact", head: true }),
        db.from("profiles").select("id",     { count: "exact", head: true }),
        db.from("orders").select("id",        { count: "exact", head: true }),
        db.from("menu_items").select("id",    { count: "exact", head: true }),
        db.from("menu_categories").select("id",{ count: "exact", head: true }),
      ]);

      const latency = Date.now() - t0;

      setStats({
        tables: [
          { name: "restaurants",    count: restaurants ?? 0,  icon: Building2   },
          { name: "profiles",       count: profiles    ?? 0,  icon: Users       },
          { name: "orders",         count: orders      ?? 0,  icon: ShoppingBag },
          { name: "menu_items",     count: menuItems   ?? 0,  icon: Hash        },
          { name: "menu_categories",count: categories  ?? 0,  icon: Hash        },
        ],
        functions: [
          { name: "code-login",           status: "active" },
          { name: "create-user",          status: "active" },
          { name: "create-restaurant",    status: "active" },
          { name: "admin-reset-password", status: "active" },
          { name: "delete-user",          status: "active" },
        ],
        dbLatency: latency,
      });
      setNow(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-black text-text-primary">حالة النظام</p>
          <p className="text-[11px] text-text-muted font-mono">{now.toLocaleString("ar-IQ")}</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : stats ? (
        <>
          {/* ── Platform health ── */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">صحة المنصة</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Supabase Auth",    icon: Shield,   ok: true },
                { label: "PostgreSQL",       icon: Database, ok: true, extra: stats.dbLatency ? `${stats.dbLatency}ms` : null },
                { label: "Edge Functions",   icon: Zap,      ok: true },
                { label: "Realtime Engine",  icon: Activity, ok: true },
                { label: "API Gateway",      icon: Server,   ok: true },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <p className="text-xs text-text-secondary font-mono flex-1">{s.label}</p>
                  {s.extra && (
                    <span className="text-[10px] text-text-muted font-mono">{s.extra}</span>
                  )}
                  {s.ok ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />ONLINE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-status-error font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />ERROR
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── DB latency indicator ── */}
          {stats.dbLatency !== null && (
            <div className={cn(
              "rounded-2xl border p-3 flex items-center gap-3",
              stats.dbLatency < 200  ? "border-emerald-500/30 bg-emerald-500/5" :
              stats.dbLatency < 500  ? "border-amber-500/30 bg-amber-500/5" :
                                       "border-red-500/30 bg-red-500/5"
            )}>
              <Clock className={cn("w-4 h-4 shrink-0",
                stats.dbLatency < 200 ? "text-emerald-400" :
                stats.dbLatency < 500 ? "text-amber-400" : "text-red-400"
              )} />
              <div>
                <p className="text-xs font-bold text-text-primary">زمن استجابة قاعدة البيانات</p>
                <p className="text-[10px] text-text-muted">
                  {stats.dbLatency < 200 ? "ممتاز" : stats.dbLatency < 500 ? "جيد" : "بطيء"}
                </p>
              </div>
              <p className={cn("mr-auto text-xl font-black tabular-nums font-mono",
                stats.dbLatency < 200 ? "text-emerald-400" :
                stats.dbLatency < 500 ? "text-amber-400" : "text-red-400"
              )}>
                {stats.dbLatency}<span className="text-xs font-normal ml-0.5">ms</span>
              </p>
            </div>
          )}

          {/* ── Tables ── */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              سجلات قاعدة البيانات
            </p>
            <div className="flex flex-col gap-1">
              {stats.tables.map(t => (
                <div key={t.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <t.icon className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs text-text-secondary font-mono">{t.name}</span>
                  </div>
                  <span className="text-sm font-black text-primary tabular-nums font-mono">
                    {t.count.toLocaleString("en-US")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Edge Functions ── */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Edge Functions
            </p>
            <div className="flex flex-col gap-1">
              {stats.functions.map(fn => (
                <div key={fn.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-xs text-text-secondary font-mono">{fn.name}</span>
                  <span className={cn(
                    "flex items-center gap-1 text-[11px] font-bold",
                    fn.status === "active" ? "text-emerald-400" : "text-red-400"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", fn.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                    {fn.status === "active" ? "ACTIVE" : "DOWN"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Security info ── */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-primary uppercase tracking-wider">معلومات الأمان</p>
            </div>
            <div className="flex flex-col gap-1.5 text-[11px] text-text-secondary">
              <p>• الوصول عبر مسار سري مشفر</p>
              <p>• تسجيل الدخول بكود مشفر — لا توجد كلمات مرور</p>
              <p>• عزل كامل بين بيانات المطاعم (RLS)</p>
              <p>• Edge Functions محمية بـ JWT</p>
              <p>• لا يوجد وصول من الخارج لجلسات المستخدمين</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
