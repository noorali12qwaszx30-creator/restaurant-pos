import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, Loader2, ShieldAlert } from "lucide-react";
import { loginWithCode } from "@/integrations/supabase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_ROUTES } from "@/types";
import { cn } from "@/lib/utils";

const PAD = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export function SystemLoginPage() {
  const navigate = useNavigate();
  const { notifyLogin } = useAuth();

  const [code, setCode]       = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Backspace") { setCode(c => c.slice(0, -1)); setError(null); return; }
      if (/^[0-9]$/.test(e.key) && code.length < 10) { setCode(c => c + e.key); setError(null); }
      if (e.key === "Enter") handleLogin();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [code]);

  function handlePad(val: string) {
    if (val === "⌫") { setCode(c => c.slice(0, -1)); setError(null); return; }
    if (!val || code.length >= 10) return;
    setCode(c => c + val);
    setError(null);
  }

  async function handleLogin() {
    if (code.length < 2) { setError("أدخل الكود"); return; }
    setIsLoading(true);
    setError(null);
    try {
      const profile = await loginWithCode("__system__", code);
      if (!profile.isSuperAdmin) {
        setError("غير مصرح");
        setCode("");
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        notifyLogin(profile, "super_admin");
        navigate(ROLE_ROUTES["super_admin"], { replace: true });
      }, 700);
    } catch (err) {
      setError("كود غير صحيح");
      setCode("");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="relative w-full max-w-[260px] flex flex-col gap-5">

        {/* أيقونة */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-elevated">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <p className="text-xs text-text-muted">وصول النظام</p>
        </div>

        {/* خانات الكود */}
        <div className={cn(
          "flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all",
          error ? "border-status-error/60 bg-status-error/5" : code.length > 0 ? "border-primary/40 bg-surface" : "border-border bg-surface"
        )}>
          {Array.from({ length: Math.max(4, code.length) }).map((_, i) => (
            <motion.div
              key={i}
              animate={code[i] ? { scale: [1, 1.25, 1] } : {}}
              transition={{ duration: 0.12 }}
              className={cn(
                "w-9 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all",
                code[i] ? "bg-primary/10 text-primary border border-primary/30" : "bg-surface-elevated border border-border"
              )}
            >
              {code[i] ? (success ? "✓" : "•") : ""}
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs text-status-error text-center -mt-2">
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* لوحة الأرقام */}
        <div className="grid grid-cols-3 gap-2">
          {PAD.map((val, i) => (
            <motion.button key={i} type="button"
              whileTap={val ? { scale: 0.9 } : {}}
              onClick={() => handlePad(val)}
              disabled={!val || isLoading || success}
              className={cn(
                "h-13 rounded-2xl font-bold text-lg transition-all select-none",
                val === "⌫"
                  ? "bg-surface-elevated border border-border text-text-secondary hover:bg-border"
                  : val
                  ? "bg-surface border border-border text-text-primary hover:bg-surface-elevated hover:border-primary/30"
                  : "pointer-events-none opacity-0"
              )}
              style={{ height: "52px" }}
            >
              {val === "⌫" ? <Delete className="w-4 h-4 mx-auto" /> : val}
            </motion.button>
          ))}
        </div>

        {/* زر الدخول */}
        <motion.button
          type="button"
          onClick={handleLogin}
          disabled={isLoading || success || code.length < 2}
          animate={success ? { backgroundColor: "hsl(var(--status-success))" } : {}}
          className="w-full h-12 rounded-2xl font-bold text-sm bg-primary text-white disabled:opacity-40 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {success ? "✓" : isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "دخول"}
        </motion.button>
      </div>
    </div>
  );
}
