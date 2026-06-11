/**
 * Super Admin — عرض جميع الموظفين في جميع المطاعم
 */
import { useState, useEffect, useCallback } from "react";
import { Search, X, User, Loader2, RefreshCw, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface StaffRow {
  id: string;
  username: string;
  display_name: string;
  role: string;
  roles: string[];
  is_active: boolean;
  phone: string | null;
  restaurant_id: string | null;
  created_at: string;
  _restaurant_name?: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin:       "bg-amber-500/15 text-amber-600 border-amber-500/30",
  cashier:     "bg-blue-500/15 text-blue-600 border-blue-500/30",
  kitchen:     "bg-orange-500/15 text-orange-600 border-orange-500/30",
  field:       "bg-green-500/15 text-green-600 border-green-500/30",
  delivery:    "bg-purple-500/15 text-purple-600 border-purple-500/30",
  takeaway:    "bg-pink-500/15 text-pink-600 border-pink-500/30",
  super_admin: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير", cashier: "كاشير", kitchen: "مطبخ",
  field: "ميداني", delivery: "سائق", takeaway: "تيك أواي", super_admin: "مدير عام",
};

export function SuperAdminUsersPage() {
  const [users, setUsers] = useState<StaffRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRestaurant, setFilterRestaurant] = useState<string>("all");
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data: rests }, { data: profs }] = await Promise.all([
        db.from("restaurants").select("id, name").order("name"),
        db.from("profiles").select("*").order("created_at", { ascending: false }),
      ]);

      setRestaurants(rests ?? []);

      const restMap = Object.fromEntries((rests ?? []).map((r: { id: string; name: string }) => [r.id, r.name]));
      setUsers((profs ?? []).map((p: StaffRow) => ({
        ...p,
        _restaurant_name: p.restaurant_id ? restMap[p.restaurant_id] : "—",
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const matchRest = filterRestaurant === "all" || u.restaurant_id === filterRestaurant;
    const matchSearch = !search.trim() ||
      u.display_name.includes(search) ||
      u.username.includes(search) ||
      (u._restaurant_name ?? "").includes(search);
    return matchRest && matchSearch;
  });

  return (
    <div className="flex flex-col pb-4">

      {/* ── Sticky header ── */}
      <div className="sticky top-14 z-20 bg-background border-b border-border px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-text-primary">
            {filtered.length} موظف
          </p>
          <button
            onClick={load}
            className="w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-primary transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو المطعم..."
            className="w-full bg-surface-elevated border border-border rounded-xl pr-9 pl-9 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center">
              <X className="w-3 h-3 text-text-muted" />
            </button>
          )}
        </div>

        {/* Restaurant filter */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setFilterRestaurant("all")}
            className={cn("shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all",
              filterRestaurant === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-text-muted"
            )}
          >الكل</button>
          {restaurants.map(r => (
            <button key={r.id}
              onClick={() => setFilterRestaurant(r.id)}
              className={cn("shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all",
                filterRestaurant === r.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-text-muted"
              )}
            >{r.name}</button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="px-4 pt-3 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <User className="w-10 h-10 text-text-muted/30" />
            <p className="text-text-muted text-sm">لا يوجد موظفون</p>
          </div>
        ) : (
          filtered.map(u => (
            <div key={u.id} className={cn(
              "bg-surface border rounded-2xl p-3.5 flex items-center gap-3",
              !u.is_active && "opacity-50"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border",
                ROLE_COLORS[u.role] ?? "bg-surface-elevated text-text-secondary border-border"
              )}>
                {u.display_name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{u.display_name}</p>
                <p className="text-xs text-text-muted">@{u.username}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={cn("text-[11px] font-semibold border rounded-full px-2 py-0.5", ROLE_COLORS[u.role] ?? "bg-surface-elevated border-border text-text-muted")}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                  {u._restaurant_name && u._restaurant_name !== "—" && (
                    <span className="flex items-center gap-1 text-[11px] text-text-muted">
                      <Building2 className="w-3 h-3" />{u._restaurant_name}
                    </span>
                  )}
                  {!u.is_active && (
                    <span className="text-[10px] bg-status-error/10 text-status-error border border-status-error/20 rounded-full px-2 py-0.5">معطّل</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
