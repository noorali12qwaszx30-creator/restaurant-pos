/**
 * WaterDropNotification — نظام إشعارات قطرة الماء
 *
 * المراحل:
 * 1. drop      — قطرة صغيرة تسقط من الأعلى بعجلة الجاذبية
 * 2. splash    — تموج دائري عند الاصطدام (water ripple)
 * 3. expand    — البطاقة تتكون بتوسع ناعم من نقطة التموج
 * 4. content   — النص والأيقونة يظهران تدريجياً
 * 5. idle      — البطاقة تعيش مدتها
 * 6. dissolve  — تذوب كأنها عادت قطرة وترتفع
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Info, XCircle,
  ShoppingBag, ChefHat, PackageCheck, Bike, X,
} from "lucide-react";
import type { WaterDropToast } from "./NotificationContext";

/* ── Icon map ── */
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

/* ── Color tokens per type ── */
const THEMES = {
  success:  { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)", icon: "#10b981", ripple: "rgba(16,185,129,0.35)",  drop: "#10b981" },
  warning:  { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)", icon: "#f59e0b", ripple: "rgba(245,158,11,0.35)",  drop: "#f59e0b" },
  error:    { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",  icon: "#ef4444", ripple: "rgba(239,68,68,0.35)",   drop: "#ef4444" },
  info:     { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.25)", icon: "#6366f1", ripple: "rgba(99,102,241,0.35)",  drop: "#6366f1" },
  order:    { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.25)", icon: "#6366f1", ripple: "rgba(99,102,241,0.35)",  drop: "#6366f1" },
  kitchen:  { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)", icon: "#f59e0b", ripple: "rgba(245,158,11,0.35)",  drop: "#f59e0b" },
  ready:    { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)", icon: "#10b981", ripple: "rgba(16,185,129,0.35)",  drop: "#10b981" },
  delivery: { bg: "rgba(14,165,233,0.12)",  border: "rgba(14,165,233,0.25)", icon: "#0ea5e9", ripple: "rgba(14,165,233,0.35)",  drop: "#0ea5e9" },
} as const;

type Phase = "drop" | "splash" | "card" | "idle" | "dissolve" | "done";

interface Props {
  toast: WaterDropToast;
  onDone: (id: string) => void;
  index: number; // stack position
}

export function WaterDropNotification({ toast, onDone, index }: Props) {
  const theme = THEMES[toast.type ?? "info"] ?? THEMES.info;
  const Icon  = ICONS[toast.type ?? "info"] ?? Info;
  const [phase, setPhase] = useState<Phase>("drop");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const autoRef  = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // drop → splash (drop takes ~420ms)
    timerRef.current = setTimeout(() => setPhase("splash"), 420);
    // splash → card (ripple 250ms)
    setTimeout(() => setPhase("card"), 420 + 250);
    // card → idle (expand 350ms)
    setTimeout(() => setPhase("idle"), 420 + 250 + 350);
    // auto-dismiss
    const duration = toast.duration ?? 4000;
    autoRef.current = setTimeout(() => setPhase("dissolve"), 420 + 250 + 350 + duration);
    // remove from DOM
    setTimeout(() => { setPhase("done"); onDone(toast.id); }, 420 + 250 + 350 + duration + 600);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(autoRef.current);
    };
  }, [toast.id, toast.duration, onDone]);

  function dismiss() {
    clearTimeout(autoRef.current);
    setPhase("dissolve");
    setTimeout(() => { setPhase("done"); onDone(toast.id); }, 600);
  }

  if (phase === "done") return null;

  // vertical position — stack up from top
  const topOffset = 16 + index * 0;

  return (
    <div
      className="fixed left-1/2 z-[9999] pointer-events-none"
      style={{ top: topOffset, transform: "translateX(-50%)", width: "min(92vw, 360px)" }}
    >
      {/* ── Phase: DROP ── */}
      <AnimatePresence>
        {phase === "drop" && (
          <motion.div
            key="drop"
            className="flex justify-center pointer-events-none"
            initial={{ y: -32, scaleY: 0.6, scaleX: 0.8, opacity: 0.9 }}
            animate={{
              y: [
                -32, -20, -8, 4, 14, 24, 32, 36, 38, 39,
              ],
              scaleY: [0.6, 0.7, 0.85, 1, 1.1, 1.2, 1.3, 1.1, 0.85, 0.7],
              scaleX: [0.8, 0.82, 0.88, 0.92, 0.95, 0.97, 1, 1.05, 1.08, 1.1],
              opacity: [0.9, 1, 1, 1, 1, 1, 1, 1, 0.8, 0],
            }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Droplet SVG shape */}
            <svg width="20" height="26" viewBox="0 0 20 26" fill="none">
              <path
                d="M10 0 C10 0 0 12 0 17 C0 22.52 4.48 26 10 26 C15.52 26 20 22.52 20 17 C20 12 10 0 10 0Z"
                fill={theme.drop}
                opacity="0.95"
              />
              <ellipse cx="7" cy="15" rx="2.5" ry="4" fill="white" opacity="0.25" transform="rotate(-15 7 15)" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase: SPLASH (ripple rings) ── */}
      <AnimatePresence>
        {phase === "splash" && (
          <motion.div
            key="splash"
            className="relative flex justify-center items-start pointer-events-none"
            style={{ height: 60 }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Center dot (impact point) */}
            <motion.div
              className="absolute rounded-full"
              style={{
                top: 40, left: "50%",
                width: 8, height: 8,
                marginLeft: -4, marginTop: -4,
                background: theme.drop,
              }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
            {/* Ring 1 */}
            <RippleRing color={theme.ripple} delay={0}    size={32}  top={32} />
            {/* Ring 2 */}
            <RippleRing color={theme.ripple} delay={0.06} size={56}  top={26} />
            {/* Ring 3 */}
            <RippleRing color={theme.ripple} delay={0.12} size={80}  top={20} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase: CARD ── */}
      <AnimatePresence>
        {(phase === "card" || phase === "idle") && (
          <motion.div
            key="card"
            className="relative pointer-events-auto cursor-pointer"
            initial={{ scaleX: 0.15, scaleY: 0.15, opacity: 0, y: 44, borderRadius: 999 }}
            animate={{ scaleX: 1, scaleY: 1, opacity: 1, y: 0, borderRadius: 20 }}
            exit={{
              scaleX: 0.1, scaleY: 0.1, opacity: 0, y: 32,
              borderRadius: 999,
              transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
            }}
            transition={{ duration: 0.38, ease: [0.34, 1.4, 0.64, 1] }}
            onClick={dismiss}
            style={{ originY: 0 }}
          >
            <CardContent
              toast={toast}
              theme={theme}
              Icon={Icon}
              visible={phase === "idle"}
              onDismiss={dismiss}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase: DISSOLVE ── */}
      <AnimatePresence>
        {phase === "dissolve" && (
          <motion.div
            key="dissolve"
            className="relative pointer-events-none"
            initial={{ scaleX: 1, scaleY: 1, opacity: 1, y: 0, borderRadius: 20, filter: "blur(0px)" }}
            animate={{
              scaleX: [1, 0.6, 0.2, 0.05],
              scaleY: [1, 1.1, 0.8, 0.4],
              opacity: [1, 0.8, 0.4, 0],
              y: [0, -6, -16, -28],
              filter: ["blur(0px)", "blur(1px)", "blur(3px)", "blur(6px)"],
              borderRadius: [20, 40, 80, 999],
            }}
            transition={{ duration: 0.55, ease: [0.4, 0, 1, 1] }}
            style={{ originY: 0 }}
          >
            <CardContent
              toast={toast}
              theme={theme}
              Icon={Icon}
              visible={true}
              onDismiss={() => {}}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Ripple ring helper ── */
function RippleRing({ color, delay, size, top }: {
  color: string; delay: number; size: number; top: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{
        width: size, height: size / 2.5,
        top, left: "50%",
        marginLeft: -size / 2,
        borderColor: color,
        borderWidth: 1.5,
      }}
      initial={{ scaleX: 0, scaleY: 0, opacity: 0.9 }}
      animate={{ scaleX: 1, scaleY: 1, opacity: 0 }}
      transition={{ duration: 0.28, delay, ease: [0.2, 0.8, 0.4, 1] }}
    />
  );
}

/* ── Card visual ── */
function CardContent({ toast, theme, Icon, visible, onDismiss }: {
  toast: WaterDropToast;
  theme: typeof THEMES[keyof typeof THEMES];
  Icon: React.ElementType;
  visible: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border"
      style={{
        background: `${theme.bg}`,
        borderColor: theme.border,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        boxShadow: `0 8px 40px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)`,
      }}
    >
      {/* Shimmer top border */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${theme.icon}60 30%, ${theme.icon}aa 50%, ${theme.icon}60 70%, transparent 100%)`,
        }}
      />

      {/* Progress bar */}
      <ProgressBar color={theme.icon} duration={toast.duration ?? 4000} />

      {/* Body */}
      <motion.div
        className="flex items-start gap-3 px-4 py-3.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.25, delay: visible ? 0.08 : 0 }}
      >
        {/* Icon */}
        <motion.div
          className="mt-0.5 shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center"
          style={{
            background: `${theme.icon}18`,
            border: `1px solid ${theme.icon}30`,
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: visible ? 1 : 0.5, opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.3, delay: visible ? 0.12 : 0, type: "spring", stiffness: 300, damping: 20 }}
        >
          <Icon style={{ color: theme.icon }} className="w-4.5 h-4.5" size={18} />
        </motion.div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <motion.p
              className="text-[13px] font-bold text-text-primary leading-snug"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -8 }}
              transition={{ duration: 0.22, delay: visible ? 0.15 : 0 }}
            >
              {toast.title}
            </motion.p>
          )}
          {toast.message && (
            <motion.p
              className="text-[11.5px] text-text-muted mt-0.5 leading-snug"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -8 }}
              transition={{ duration: 0.22, delay: visible ? 0.2 : 0 }}
            >
              {toast.message}
            </motion.p>
          )}
        </div>

        {/* Dismiss */}
        <motion.button
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          className="shrink-0 w-6 h-6 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 0.6 : 0 }}
          whileHover={{ opacity: 1, scale: 1.1 }}
          transition={{ delay: visible ? 0.25 : 0 }}
        >
          <X size={12} />
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ── Shrinking progress bar ── */
function ProgressBar({ color, duration }: { color: string; duration: number }) {
  return (
    <motion.div
      className="absolute bottom-0 left-0 h-[2px] rounded-full"
      style={{ background: color, opacity: 0.5 }}
      initial={{ width: "100%", scaleX: 1 }}
      animate={{ width: "0%" }}
      transition={{ duration: duration / 1000, ease: "linear", delay: 0.2 }}
    />
  );
}
