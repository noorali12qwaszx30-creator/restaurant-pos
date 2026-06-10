/**
 * WaterDropNotification — قطرة الماء
 * المراحل:
 *  drop (280ms) → splash (180ms) → card expand (220ms) → idle → dissolve (450ms)
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Info, XCircle,
  ShoppingBag, ChefHat, PackageCheck, Bike, X,
} from "lucide-react";
import type { WaterDropToast } from "./NotificationContext";

/* ── Icons ── */
const ICONS: Record<string, React.ElementType> = {
  success:  CheckCircle2,
  warning:  AlertTriangle,
  error:    XCircle,
  info:     Info,
  order:    ShoppingBag,
  kitchen:  ChefHat,
  ready:    PackageCheck,
  delivery: Bike,
};

/* ── Themes ── */
const THEMES = {
  success:  { bg: "rgba(16,185,129,0.11)",  border: "rgba(16,185,129,0.22)", icon: "#10b981", ripple: "rgba(16,185,129,0.4)",  drop: "#10b981" },
  warning:  { bg: "rgba(245,158,11,0.11)",  border: "rgba(245,158,11,0.22)", icon: "#f59e0b", ripple: "rgba(245,158,11,0.4)",  drop: "#f59e0b" },
  error:    { bg: "rgba(239,68,68,0.11)",   border: "rgba(239,68,68,0.22)",  icon: "#ef4444", ripple: "rgba(239,68,68,0.4)",   drop: "#ef4444" },
  info:     { bg: "rgba(99,102,241,0.11)",  border: "rgba(99,102,241,0.22)", icon: "#6366f1", ripple: "rgba(99,102,241,0.4)",  drop: "#6366f1" },
  order:    { bg: "rgba(99,102,241,0.11)",  border: "rgba(99,102,241,0.22)", icon: "#6366f1", ripple: "rgba(99,102,241,0.4)",  drop: "#6366f1" },
  kitchen:  { bg: "rgba(245,158,11,0.11)",  border: "rgba(245,158,11,0.22)", icon: "#f59e0b", ripple: "rgba(245,158,11,0.4)",  drop: "#f59e0b" },
  ready:    { bg: "rgba(16,185,129,0.11)",  border: "rgba(16,185,129,0.22)", icon: "#10b981", ripple: "rgba(16,185,129,0.4)",  drop: "#10b981" },
  delivery: { bg: "rgba(14,165,233,0.11)",  border: "rgba(14,165,233,0.22)", icon: "#0ea5e9", ripple: "rgba(14,165,233,0.4)",  drop: "#0ea5e9" },
} as const;

// ── Timings (ms) ──
const T_DROP    = 280;
const T_SPLASH  = 180;
const T_EXPAND  = 220;

type Phase = "drop" | "splash" | "card" | "idle" | "dissolve" | "done";

interface Props {
  toast: WaterDropToast;
  onDone: (id: string) => void;
  index: number;
}

export function WaterDropNotification({ toast, onDone, index }: Props) {
  const theme = THEMES[toast.type ?? "info"] ?? THEMES.info;
  const Icon  = ICONS[toast.type ?? "info"] ?? Info;
  const [phase, setPhase] = useState<Phase>("drop");
  const autoRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("splash"), T_DROP);
    const t2 = setTimeout(() => setPhase("card"),   T_DROP + T_SPLASH);
    const t3 = setTimeout(() => setPhase("idle"),   T_DROP + T_SPLASH + T_EXPAND);

    const dur = toast.duration ?? 4000;
    autoRef.current = setTimeout(() => setPhase("dissolve"), T_DROP + T_SPLASH + T_EXPAND + dur);
    const t5 = setTimeout(() => { setPhase("done"); onDone(toast.id); }, T_DROP + T_SPLASH + T_EXPAND + dur + 450);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(autoRef.current); clearTimeout(t5); };
  }, [toast.id, toast.duration, onDone]);

  function dismiss() {
    clearTimeout(autoRef.current);
    setPhase("dissolve");
    setTimeout(() => { setPhase("done"); onDone(toast.id); }, 450);
  }

  if (phase === "done") return null;

  return (
    <div
      className="fixed left-1/2 z-[9999] pointer-events-none"
      style={{ top: 16 + index * 4, transform: "translateX(-50%)", width: "min(92vw, 360px)" }}
    >
      {/* ── DROP ── */}
      <AnimatePresence>
        {phase === "drop" && (
          <motion.div
            key="drop"
            className="flex justify-center pointer-events-none"
            initial={{ y: -28, opacity: 0.8, scaleY: 0.5, scaleX: 0.7 }}
            animate={{
              y:      [-28, -12, 4, 18, 28, 35, 38],
              scaleY: [0.5, 0.8, 1.1, 1.3, 1.1, 0.75, 0],
              scaleX: [0.7, 0.85, 0.95, 1, 1.05, 1.15, 0],
              opacity:[0.8, 1,   1,   1,   1,   0.6,  0],
            }}
            transition={{ duration: T_DROP / 1000, ease: [0.3, 0, 0.1, 1] }}
          >
            <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
              <path d="M9 0C9 0 0 11 0 15.5C0 20.19 4.03 24 9 24C13.97 24 18 20.19 18 15.5C18 11 9 0 9 0Z"
                fill={theme.drop} opacity="0.92" />
              <ellipse cx="6.5" cy="14" rx="2" ry="3.5" fill="white" opacity="0.22" transform="rotate(-15 6.5 14)" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SPLASH ── */}
      <AnimatePresence>
        {phase === "splash" && (
          <motion.div
            key="splash"
            className="relative flex justify-center pointer-events-none"
            style={{ height: 48 }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {/* impact dot */}
            <motion.div
              className="absolute rounded-full"
              style={{ top: 36, left: "50%", marginLeft: -5, marginTop: -5, width: 10, height: 10, background: theme.drop }}
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: 0.2, opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <Ripple color={theme.ripple} delay={0}    w={28}  h={10} top={34} />
            <Ripple color={theme.ripple} delay={0.04} w={52}  h={18} top={28} />
            <Ripple color={theme.ripple} delay={0.08} w={76}  h={26} top={22} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CARD ── */}
      <AnimatePresence>
        {(phase === "card" || phase === "idle") && (
          <motion.div
            key="card"
            className="pointer-events-auto"
            style={{ originX: 0.5, originY: 0 }}
            initial={{ scaleX: 0.08, scaleY: 0.08, opacity: 0, y: 38 }}
            animate={{ scaleX: 1, scaleY: 1, opacity: 1, y: 0 }}
            exit={{
              scaleX: 0.06, scaleY: 0.3, opacity: 0, y: 20, filter: "blur(4px)",
              transition: { duration: 0.42, ease: [0.4, 0, 1, 1] },
            }}
            transition={{ duration: T_EXPAND / 1000, ease: [0.34, 1.28, 0.64, 1] }}
            onClick={dismiss}
          >
            <Card toast={toast} theme={theme} Icon={Icon} show={phase === "idle"} onDismiss={dismiss} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DISSOLVE ── */}
      <AnimatePresence>
        {phase === "dissolve" && (
          <motion.div
            key="dissolve"
            className="pointer-events-none"
            style={{ originX: 0.5, originY: 0 }}
            initial={{ scaleX: 1, scaleY: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
            animate={{
              scaleX: [1, 0.5, 0.12],
              scaleY: [1, 1.05, 0.3],
              opacity: [1, 0.6, 0],
              y: [0, -10, -26],
              filter: ["blur(0px)", "blur(2px)", "blur(6px)"],
            }}
            transition={{ duration: 0.42, ease: [0.4, 0, 1, 1] }}
          >
            <Card toast={toast} theme={theme} Icon={Icon} show onDismiss={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Ripple ring ── */
function Ripple({ color, delay, w, h, top }: {
  color: string; delay: number; w: number; h: number; top: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{ width: w, height: h, top, left: "50%", marginLeft: -w / 2, borderColor: color, borderWidth: 1.5 }}
      initial={{ scale: 0, opacity: 0.85 }}
      animate={{ scale: 1, opacity: 0 }}
      transition={{ duration: 0.22, delay, ease: [0.2, 0.8, 0.4, 1] }}
    />
  );
}

/* ── Card visual ── */
function Card({ toast, theme, Icon, show, onDismiss }: {
  toast: WaterDropToast;
  theme: typeof THEMES[keyof typeof THEMES];
  Icon: React.ElementType;
  show: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[18px] border"
      style={{
        background: theme.bg,
        borderColor: theme.border,
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: `0 4px 28px rgba(0,0,0,0.16), 0 1px 6px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.10)`,
      }}
    >
      {/* shimmer top */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${theme.icon}80 40%,${theme.icon}cc 50%,${theme.icon}80 60%,transparent)` }}
      />

      {/* progress */}
      <ProgressBar color={theme.icon} duration={toast.duration ?? 4000} running={show} />

      {/* body */}
      <motion.div
        className="flex items-start gap-3 px-4 py-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: show ? 1 : 0 }}
        transition={{ duration: 0.18, delay: show ? 0.06 : 0 }}
      >
        {/* icon */}
        <motion.div
          className="mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${theme.icon}16`, border: `1px solid ${theme.icon}28` }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: show ? 1 : 0.4, opacity: show ? 1 : 0 }}
          transition={{ duration: 0.26, delay: show ? 0.09 : 0, type: "spring", stiffness: 350, damping: 22 }}
        >
          <Icon style={{ color: theme.icon }} size={16} />
        </motion.div>

        {/* text */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <motion.p
              className="text-[12.5px] font-bold text-text-primary leading-snug"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: show ? 1 : 0, x: show ? 0 : -6 }}
              transition={{ duration: 0.18, delay: show ? 0.12 : 0 }}
            >
              {toast.title}
            </motion.p>
          )}
          {toast.message && (
            <motion.p
              className="text-[11px] text-text-muted mt-0.5 leading-snug"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: show ? 1 : 0, x: show ? 0 : -6 }}
              transition={{ duration: 0.18, delay: show ? 0.17 : 0 }}
            >
              {toast.message}
            </motion.p>
          )}
        </div>

        {/* dismiss */}
        <motion.button
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          className="shrink-0 w-5 h-5 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors mt-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: show ? 0.5 : 0 }}
          whileHover={{ opacity: 1, scale: 1.15 }}
          transition={{ delay: show ? 0.2 : 0 }}
        >
          <X size={11} />
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ color, duration, running }: { color: string; duration: number; running: boolean }) {
  return (
    <motion.div
      className="absolute bottom-0 right-0 h-[2px] rounded-full"
      style={{ background: color, opacity: 0.45 }}
      initial={{ width: "100%" }}
      animate={running ? { width: "0%" } : {}}
      transition={running ? { duration: duration / 1000, ease: "linear", delay: 0.15 } : {}}
    />
  );
}
