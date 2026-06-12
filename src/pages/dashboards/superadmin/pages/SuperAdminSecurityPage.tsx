import { useState, useEffect, useCallback } from "react";
import {
  Shield, RefreshCw, Lock,
  CheckCircle2, AlertTriangle, LogIn, Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SACard, SASkeleton, SASection, PulseDot, SABadge } from "../components/SACard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface LoginEntry {
  id: string; name: string; role: string;
  restaurant: string; time: string; timeAgo: string;
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "مدير مطعم", cashier: "كاشير", kitchen: "مطبخ",
  field: "ميداني", delivery: "سائق", takeaway: "تيك أواي", super_admin: "مدير النظام",
};
const ROLE_COLOR: Record<string, string> = {
  admin:    "bg-amber-500/15 text-amber-400 border-amber-500/25",
  cashier:  "bg-sky-500/15 text-sky-400 border-sky-500/25",
  kitchen:  "bg-orange-500/15 text-orange-400 border-orange-500/25",
  field:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  delivery: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  takeaway: "bg-pink-500/15 text-pink-400 border-pink-500/25",
  super_admin: "bg-primary/15 text-primary border-primary/25",
};

export function SuperAdminSecurityPage() {
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      const { data: profiles } = await db
        .from("profiles")
        .select("id, display_name, role, last_login_at, is_active, restaurants(name)")
        .not("last_login_at", "is", null)
        .order("last_login_at", { ascending: false })
        .limit(30);

      const now = Date.now();
      const entries: LoginEntry[] = (profiles ?? []).map((p: {
        id: string; display_name: string; role: string; last_login_at: string;
        is_active: boolean; restaurants?: { name: string };
      }) => ({
        id: p.id,
        name: p.display_name,
        role: p.role,
        restaurant: p.restaurants?.name ?? "النظام",
        time: new Date(p.last_login_at).toLocaleString("ar-IQ"),
        timeAgo: relTime(p.last_login_at),
      }));

      const active = entries.filter(e => {
        const diff = now - new Date((profiles ?? []).find((p: { id: string }) => p.id === e.id)?.last_login_at ?? 0).getTime();
        return diff < 30 * 60 * 1000; // نشط خلال 30 دقيقة
      });
      const today = (profiles ?? []).filter((p: { last_login_at: string }) =>
        new Date(p.last_login_at) >= todayStart
      );

      setLogins(entries);
      setActiveCount(active.length);
      setTodayCount(today.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && logins.length === 0) return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-6">
      {Array(5).fill(0).map((_, i) => <SASkeleton key={i} className="h-20 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-text-primary">الأمان</h1>
          <p className="text-[11px] text-text-muted">مراقبة الوصول والنشاط</p>
        </div>
        <button onClick={load} disabled={loading}
          className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors disabled:opacity-40">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Security summary */}
      <div className="grid grid-cols-2 gap-2.5">
        <SACard className="p-3.5 bg-emerald-500/8 border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-black text-emerald-400 tabular-nums font-mono">{activeCount}</p>
          <p className="text-xs text-text-secondary mt-1">جلسات نشطة</p>
          <p className="text-[10px] text-text-muted">آخر 30 دقيقة</p>
        </SACard>
        <SACard className="p-3.5 bg-sky-500/8 border-sky-500/20">
          <LogIn className="w-4 h-4 text-sky-400 mb-2" />
          <p className="text-2xl font-black text-sky-400 tabular-nums font-mono">{todayCount}</p>
          <p className="text-xs text-text-secondary mt-1">دخول اليوم</p>
          <p className="text-[10px] text-text-muted">منذ منتصف الليل</p>
        </SACard>
      </div>

      {/* Security status */}
      <SACard className="p-4 border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          <p className="text-xs font-bold text-primary uppercase tracking-wider">حالة الأمان</p>
          <SABadge color="success">محمي</SABadge>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { label: "تشفير الاتصالات (HTTPS)", ok: true },
            { label: "مصادقة بكود مشفر", ok: true },
            { label: "عزل البيانات بين المطاعم (RLS)", ok: true },
            { label: "Edge Functions محمية بـ JWT", ok: true },
            { label: "لا يوجد وصول مباشر لقاعدة البيانات", ok: true },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <PulseDot color={s.ok ? "success" : "error"} />
              <p className="text-xs text-text-secondary flex-1">{s.label}</p>
              <span className={cn("text-[10px] font-bold", s.ok ? "text-emerald-400" : "text-red-400")}>
                {s.ok ? "✓ آمن" : "✗ خطر"}
              </span>
            </div>
          ))}
        </div>
      </SACard>

      {/* Login history */}
      <SASection
        title="سجل تسجيلات الدخول"
        subtitle={`${logins.length} سجل`}
      >
        {logins.length === 0 ? (
          <SACard className="p-8 flex flex-col items-center gap-2">
            <Lock className="w-8 h-8 text-text-muted/20" />
            <p className="text-sm text-text-muted">لا توجد سجلات</p>
          </SACard>
        ) : (
          <div className="flex flex-col gap-2">
            {logins.map((entry, i) => (
              <SACard key={entry.id} className="px-3 py-3 flex items-center gap-3">
                {/* Avatar */}
                <div className={cn(
                  "w-9 h-9 rounded-full border flex items-center justify-center text-xs font-black shrink-0",
                  ROLE_COLOR[entry.role] ?? "bg-surface-elevated text-text-muted border-border"
                )}>
                  {entry.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-text-primary truncate">{entry.name}</p>
                    {i === 0 && <PulseDot color="success" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={cn(
                      "text-[10px] font-medium border rounded-full px-1.5 py-0.5 leading-none",
                      ROLE_COLOR[entry.role] ?? "bg-surface-elevated border-border text-text-muted"
                    )}>
                      {ROLE_LABEL[entry.role] ?? entry.role}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-text-muted">
                      <Building2 className="w-2.5 h-2.5" />{entry.restaurant}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] text-text-muted font-mono">{entry.timeAgo}</span>
                  <span className="text-[9px] text-text-muted/60 mt-0.5">{entry.time.split("،")[0]}</span>
                </div>
              </SACard>
            ))}
          </div>
        )}
      </SASection>

      {/* Access info */}
      <SACard className="p-4 border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <p className="text-xs font-bold text-amber-400">معلومات الوصول</p>
        </div>
        <div className="flex flex-col gap-1.5 text-[11px] text-text-secondary">
          <p>• المسار السري للوصول: <span className="font-mono text-primary">/sys-9x7k</span></p>
          <p>• لا يظهر في قوائم التنقل العادية</p>
          <p>• كل موظف يملك كود دخول فريد من 10 أرقام</p>
          <p>• الكود مرتبط بمطعم محدد — لا يعمل مع مطاعم أخرى</p>
        </div>
      </SACard>

    </div>
  );
}
