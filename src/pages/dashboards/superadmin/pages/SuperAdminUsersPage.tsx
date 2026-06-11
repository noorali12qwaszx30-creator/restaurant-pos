/**
 * Super Admin — جميع المستخدمين في جميع المطاعم
 */
import { useState, useEffect, useCallback } from "react";
import {
  Search, X, User, Loader2, RefreshCw, Building2,
  ToggleRight, ToggleLeft, Hash, Copy, Check, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNotify } from "@/components/notifications/NotificationContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface StaffRow {
  id: string; username: string; display_name: string;
  role: string; roles: string[]; is_active: boolean;
  phone: string | null; restaurant_id: string | null;
  login_code: string | null; last_login_at: string | null;
  created_at: string; _restaurant_name?: string;
}

const ROLE_COLOR: Record<string, string> = {
  admin:    "bg-amber-500/15 text-amber-400 border-amber-500/30",
  cashier:  "bg-sky-500/15 text-sky-400 border-sky-500/30",
  kitchen:  "bg-orange-500/15 text-orange-400 border-orange-500/30",
  field:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  delivery: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  takeaway: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};
const ROLE_LABEL: Record<string, string> = {
  admin: "مدير مطعم", cashier: "كاشير", kitchen: "مطبخ",
  field: "ميداني", delivery: "سائق", takeaway: "تيك أواي",
};

export function SuperAdminUsersPage() {
  const [users,      setUsers]      = useState<StaffRow[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterRest, setFilterRest] = useState("all");
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const { notify } = useNotify();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data: rests }, { data: profs }] = await Promise.all([
        db.from("restaurants").select("id, name").order("name"),
        db.from("profiles").select("*").not("restaurant_id", "is", null).order("created_at", { ascending: false }),
      ]);
      setRestaurants(rests ?? []);
      const map = Object.fromEntries((rests ?? []).map((r: { id:string; name:string }) => [r.id, r.name]));
      setUsers((profs ?? []).map((p: StaffRow) => ({ ...p, _restaurant_name: p.restaurant_id ? map[p.restaurant_id] : "—" })));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(u: StaffRow) {
    const next = !u.is_active;
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: next } : x));
    const { error } = await db.from("profiles").update({ is_active: next }).eq("id", u.id);
    if (error) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: u.is_active } : x));
      notify({ type: "error", title: "فشل التحديث" });
    } else {
      notify({ type: "success", title: next ? "✓ تم التفعيل" : "تم التعطيل", message: u.display_name });
    }
  }

  const filtered = users.filter(u => {
    const matchRest = filterRest === "all" || u.restaurant_id === filterRest;
    const matchSearch = !search.trim() ||
      u.display_name.includes(search) || u.username.includes(search) ||
      (u._restaurant_name ?? "").includes(search);
    return matchRest && matchSearch;
  });

  const activeCount = users.filter(u => u.is_active).length;

  return (
    <div className="flex flex-col pb-4">

      {/* ── Header ── */}
      <div className="sticky top-14 z-20 bg-background border-b border-border px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-text-primary">{users.length} مستخدم</p>
            <p className="text-[10px] text-text-muted">{activeCount} نشط · {users.length - activeCount} معطّل</p>
          </div>
          <button onClick={load} className="w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors">
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو المطعم..."
            className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
              <X className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <FilterChip active={filterRest === "all"} onClick={() => setFilterRest("all")}>الكل ({users.length})</FilterChip>
          {restaurants.map(r => (
            <FilterChip key={r.id} active={filterRest === r.id} onClick={() => setFilterRest(r.id)}>
              {r.name}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="px-4 pt-3 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <User className="w-10 h-10 text-text-muted/20" />
            <p className="text-text-muted text-sm">لا يوجد مستخدمون</p>
          </div>
        ) : filtered.map(u => (
          <div key={u.id} className={cn(
            "bg-surface border border-border rounded-2xl p-3.5 flex items-center gap-3 transition-all",
            !u.is_active && "opacity-50"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border",
              ROLE_COLOR[u.role] ?? "bg-surface-elevated text-text-secondary border-border"
            )}>
              {u.display_name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{u.display_name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={cn("text-[11px] font-semibold border rounded-full px-2 py-0.5 leading-none", ROLE_COLOR[u.role] ?? "bg-surface-elevated border-border text-text-muted")}>
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
                {u._restaurant_name && u._restaurant_name !== "—" && (
                  <span className="flex items-center gap-1 text-[11px] text-text-muted">
                    <Building2 className="w-3 h-3" />{u._restaurant_name}
                  </span>
                )}
              </div>
              {u.login_code && (
                <CodeBadge code={u.login_code} />
              )}
              {u.last_login_at && (
                <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  آخر دخول: {new Date(u.last_login_at).toLocaleString("ar-IQ")}
                </p>
              )}
            </div>

            <button
              onClick={() => toggleActive(u)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-elevated transition-colors shrink-0"
              title={u.is_active ? "تعطيل" : "تفعيل"}
            >
              {u.is_active
                ? <ToggleRight className="w-5 h-5 text-status-success" />
                : <ToggleLeft  className="w-5 h-5 text-text-muted"   />
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all",
      active ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-text-muted hover:border-primary/30"
    )}>
      {children}
    </button>
  );
}

function CodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(()=>setCopied(false),1500); }); }}
      className="flex items-center gap-1 mt-1 bg-primary/8 border border-primary/20 rounded-lg px-2 py-0.5 text-primary hover:bg-primary/15 transition-all w-fit"
    >
      <Hash className="w-3 h-3" />
      <span className="text-[11px] font-black tracking-widest font-mono">{code}</span>
      {copied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3 opacity-50" />}
    </button>
  );
}
