import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Delete, Loader2, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loginWithCode } from "@/integrations/supabase/auth";
import { IS_DEV_MODE, mockSignIn } from "@/lib/dev-mock";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_ROUTES } from "@/types";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/integrations/supabase/types";

// ── الأزرار الرقمية ──────────────────────────────────────────
const PAD = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export function LoginPage() {
  const navigate = useNavigate();
  const { notifyLogin } = useAuth();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showRestaurantPicker, setShowRestaurantPicker] = useState(false);
  const [search, setSearch] = useState("");

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── جلب المطاعم ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchRestaurants() {
      if (IS_DEV_MODE) {
        setRestaurants([{ id: "00000000-0000-0000-0000-000000000001", name: "المطعم التجريبي", logo: null, phone: null, address: null, is_active: true, created_at: "" }]);
        setLoadingRestaurants(false);
        return;
      }
      const { data } = await supabase.from("restaurants").select("*").eq("is_active", true).order("name");
      setRestaurants(data ?? []);
      setLoadingRestaurants(false);
    }
    fetchRestaurants();
  }, []);

  // ── تركيز تلقائي ────────────────────────────────────────────
  useEffect(() => {
    if (selectedRestaurant && !showRestaurantPicker) {
      codeInputRef.current?.focus();
    }
  }, [selectedRestaurant, showRestaurantPicker]);

  useEffect(() => {
    if (showRestaurantPicker) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [showRestaurantPicker]);

  // ── الكيبورد ─────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (showRestaurantPicker) return;
      if (e.key === "Enter") { handleLogin(); return; }
      if (e.key === "Backspace") { setCode(c => c.slice(0, -1)); setError(null); return; }
      if (/^[0-9]$/.test(e.key) && code.length < 10) {
        setCode(c => c + e.key); setError(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [code, showRestaurantPicker]);

  function handlePad(val: string) {
    if (val === "⌫") { setCode(c => c.slice(0, -1)); setError(null); return; }
    if (val === "") return;
    if (code.length >= 10) return;
    setCode(c => c + val);
    setError(null);
  }

  async function handleLogin() {
    if (!selectedRestaurant) { setError("يرجى اختيار المطعم أولاً"); return; }
    if (code.length < 10) { setError("أدخل الكود كاملاً (10 أرقام)"); return; }
    setIsLoading(true);
    setError(null);
    try {
      if (IS_DEV_MODE) {
        // وضع التطوير: استخدام اسم المستخدم كبديل للكود
        const profile = mockSignIn(code, "Admin@123");
        setSuccess(true);
        setTimeout(() => {
          notifyLogin(profile, profile.roles[0]);
          navigate(ROLE_ROUTES[profile.roles[0]], { replace: true });
        }, 700);
        return;
      }
      const profile = await loginWithCode(selectedRestaurant.id, code);
      setSuccess(true);
      setTimeout(() => {
        const role = profile.roles[0];
        notifyLogin(profile, role);
        navigate(ROLE_ROUTES[role], { replace: true });
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تسجيل الدخول");
      setCode("");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4">

      {/* خلفية زخرفية */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-primary/6 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-status-info/4 rounded-full blur-[60px]" />
      </div>

      <div className="relative w-full max-w-xs flex flex-col gap-6" dir="rtl">

        {/* ── الشعار ── */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-3 shadow-elevated">
            <span className="text-xl font-black text-white">ن</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary">النظام للإدارة المتكاملة</h1>
          <p className="text-xs text-text-muted mt-0.5">نظام إدارة المطاعم</p>
        </div>

        {/* ── اختيار المطعم ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary">المطعم</label>
          <button
            type="button"
            onClick={() => setShowRestaurantPicker(true)}
            disabled={loadingRestaurants}
            className={cn(
              "flex items-center gap-2 w-full px-4 py-3 rounded-2xl border text-right transition-all",
              "bg-surface border-border hover:border-primary/40",
              selectedRestaurant ? "text-text-primary" : "text-text-muted",
              success && "border-status-success/50"
            )}
          >
            <Building2 className="w-4 h-4 text-text-muted shrink-0" />
            <span className="flex-1 text-sm font-medium truncate">
              {loadingRestaurants ? "جاري التحميل..." : selectedRestaurant?.name ?? "اختر المطعم"}
            </span>
            <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
          </button>
        </div>

        {/* ── عرض الكود ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-secondary">كود الموظف</label>
          <div
            onClick={() => codeInputRef.current?.focus()}
            className={cn(
              "flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all cursor-text",
              "bg-surface border-border",
              error ? "border-status-error/60" : code.length > 0 ? "border-primary/50" : "",
              success && "border-status-success/50"
            )}
          >
            {/* نقاط الكود — 10 خانات */}
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                animate={code[i] ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.12 }}
                className={cn(
                  "w-7 h-9 rounded-lg flex items-center justify-center text-base font-bold transition-all",
                  code[i]
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : i === code.length
                    ? "bg-surface-elevated border-2 border-primary/50 text-text-muted"
                    : "bg-surface-elevated border border-border text-text-muted"
                )}
              >
                {code[i] ? (success ? "✓" : "•") : ""}
              </motion.div>
            ))}

            {/* حقل مخفي للكيبورد */}
            <input
              ref={codeInputRef}
              type="number"
              inputMode="numeric"
              value={code}
              onChange={() => {}}
              className="sr-only"
              tabIndex={-1}
            />
          </div>

          {/* رسالة الخطأ */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-status-error text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── لوحة الأرقام ── */}
        <div className="grid grid-cols-3 gap-2" dir="ltr">
          {PAD.map((val, i) => (
            <motion.button
              key={i}
              type="button"
              whileTap={val ? { scale: 0.92 } : {}}
              onClick={() => handlePad(val)}
              disabled={!val || isLoading || success}
              className={cn(
                "h-14 rounded-2xl font-bold text-lg transition-all select-none",
                val === "⌫"
                  ? "bg-surface-elevated border border-border text-text-secondary hover:bg-border"
                  : val
                  ? "bg-surface border border-border text-text-primary hover:bg-surface-elevated hover:border-primary/30 active:bg-primary/10"
                  : "pointer-events-none opacity-0"
              )}
            >
              {val === "⌫" ? <Delete className="w-5 h-5 mx-auto" /> : val}
            </motion.button>
          ))}
        </div>

        {/* ── زر الدخول ── */}
        <motion.button
          type="button"
          onClick={handleLogin}
          disabled={isLoading || success || !selectedRestaurant || code.length < 10}
          animate={success ? { backgroundColor: "hsl(var(--status-success))" } : {}}
          className={cn(
            "w-full h-14 rounded-2xl font-bold text-base transition-all",
            "bg-primary text-white shadow-card",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "hover:opacity-90 active:scale-[0.98]"
          )}
        >
          {success ? (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
              ✓ أهلاً بك!
            </motion.span>
          ) : isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الدخول...
            </span>
          ) : (
            "دخول"
          )}
        </motion.button>

        {IS_DEV_MODE && (
          <p className="text-center text-[10px] text-text-muted">
            وضع التطوير — أدخل أي كود
          </p>
        )}

        <p className="text-center text-xs text-text-muted">
          تويتر © {new Date().getFullYear()}
        </p>
      </div>

      {/* ── منتقي المطاعم ── */}
      <AnimatePresence>
        {showRestaurantPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => { setShowRestaurantPicker(false); setSearch(""); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl p-4 pb-safe-bottom max-h-[70vh] flex flex-col"
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
              <h3 className="text-base font-bold text-text-primary mb-3 text-center">اختر المطعم</h3>

              {/* بحث */}
              <div className="relative mb-3">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن المطعم..."
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 pr-9 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50"
                />
              </div>

              {/* قائمة المطاعم */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-1">
                {filteredRestaurants.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6">لا توجد نتائج</p>
                ) : filteredRestaurants.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRestaurant(r);
                      setShowRestaurantPicker(false);
                      setSearch("");
                      setCode("");
                      setError(null);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all text-right",
                      selectedRestaurant?.id === r.id
                        ? "bg-primary/10 border border-primary/30 text-primary"
                        : "bg-surface-elevated hover:bg-border text-text-primary"
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.name}</p>
                      {r.address && <p className="text-xs text-text-muted truncate">{r.address}</p>}
                    </div>
                    {selectedRestaurant?.id === r.id && (
                      <span className="text-primary text-lg">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
