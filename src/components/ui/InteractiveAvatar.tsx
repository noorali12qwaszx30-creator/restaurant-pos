/**
 * InteractiveAvatar — شخصية تفاعلية لشاشة تسجيل الدخول
 * حالات: idle | typing | peek (إظهار كلمة المرور) | success
 */
import { motion, AnimatePresence } from "framer-motion";

export type AvatarState = "idle" | "typing" | "peek" | "success";

interface Props {
  state: AvatarState;
  size?: number;
}

// ── ease helpers ──────────────────────────────────────────────
const spring = { type: "spring", stiffness: 300, damping: 22 } as const;
const ease   = { type: "tween",  duration: 0.25, ease: [0.4, 0, 0.2, 1] } as const;

export function InteractiveAvatar({ state, size = 120 }: Props) {
  const s = size;

  // ── Derived values per state ──────────────────────────────
  // Eye openness  (scaleY of the eyeball ellipse)
  const eyeOpen   = state === "idle" ? 0.55 : state === "typing" ? 1 : state === "peek" ? 1.15 : 0.7;
  // Pupil Y (looking "down" when typing toward keyboard)
  const pupilY    = state === "typing" ? 3 : 0;
  // Pupil size
  const pupilR    = state === "peek" ? 5 : 4;
  // Eyebrow raise
  const browY     = state === "peek" ? -5 : state === "typing" ? -2 : 0;
  // Mouth
  const mouthType = state === "success" ? "smile" : state === "peek" ? "open" : "neutral";
  // Blush (success only)
  const showBlush = state === "success";
  // Hand-over-eyes (peek = show password = cover eyes)
  // peek uses wide-eye expression (no hands overlay needed)

  // Head tilt (slight toward keyboard when typing)
  const headTilt  = state === "typing" ? 3 : 0;

  return (
    <motion.div
      animate={{ rotate: headTilt }}
      transition={spring}
      style={{ width: s, height: s }}
      className="relative select-none"
    >
      <svg
        viewBox="0 0 120 120"
        width={s}
        height={s}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* ── Shadow ── */}
        <ellipse cx="60" cy="114" rx="28" ry="5" fill="rgba(0,0,0,0.08)" />

        {/* ── Neck ── */}
        <rect x="50" y="88" width="20" height="14" rx="6" fill="#C68A5E" />

        {/* ── Head base ── */}
        <ellipse cx="60" cy="62" rx="38" ry="40" fill="#C68A5E" />

        {/* ── Forehead highlight ── */}
        <ellipse cx="55" cy="44" rx="18" ry="12" fill="rgba(255,255,255,0.1)" />

        {/* ── Curly hair ── */}
        <CurlyHair />

        {/* ── Ear left ── */}
        <ellipse cx="22" cy="62" rx="7" ry="9" fill="#C68A5E" />
        <ellipse cx="23" cy="62" rx="4" ry="6" fill="#B07A52" />

        {/* ── Ear right ── */}
        <ellipse cx="98" cy="62" rx="7" ry="9" fill="#C68A5E" />
        <ellipse cx="97" cy="62" rx="4" ry="6" fill="#B07A52" />

        {/* ── Eyes group ── */}
        <g>
          {/* Left eye socket */}
          <EyeUnit
            cx={44} cy={60}
            open={eyeOpen}
            pupilDy={pupilY}
            pupilR={pupilR}
          />
          {/* Right eye socket */}
          <EyeUnit
            cx={76} cy={60}
            open={eyeOpen}
            pupilDy={pupilY}
            pupilR={pupilR}
          />
        </g>

        {/* ── Eyebrows ── */}
        <EyebrowUnit browY={browY} surprised={state === "peek"} />

        {/* ── Nose ── */}
        <ellipse cx="60" cy="72" rx="4" ry="3" fill="rgba(0,0,0,0.12)" />
        <ellipse cx="57" cy="72" rx="2.5" ry="2" fill="rgba(0,0,0,0.09)" />
        <ellipse cx="63" cy="72" rx="2.5" ry="2" fill="rgba(0,0,0,0.09)" />

        {/* ── Mouth ── */}
        <MouthUnit type={mouthType} />

        {/* ── Blush cheeks (success) ── */}
        <AnimatePresence>
          {showBlush && (
            <>
              <motion.ellipse
                key="blush-l"
                cx="36" cy="72" rx="9" ry="6"
                fill="rgba(255,100,100,0.22)"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={ease}
              />
              <motion.ellipse
                key="blush-r"
                cx="84" cy="72" rx="9" ry="6"
                fill="rgba(255,100,100,0.22)"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={ease}
              />
            </>
          )}
        </AnimatePresence>

        {/* ── Success sparkles ── */}
        <AnimatePresence>
          {state === "success" && <SuccessSparkles />}
        </AnimatePresence>

        {/* peek: no extra elements — expression handled by eyes/brows */}
      </svg>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function CurlyHair() {
  return (
    <g fill="#1a1a1a">
      {/* Main hair mass */}
      <ellipse cx="60" cy="30" rx="38" ry="22" />
      {/* Curly bumps across top */}
      <circle cx="30" cy="26" r="10" />
      <circle cx="44" cy="20" r="11" />
      <circle cx="60" cy="17" r="12" />
      <circle cx="76" cy="20" r="11" />
      <circle cx="90" cy="26" r="10" />
      {/* Side hair */}
      <circle cx="22" cy="38" r="8" />
      <circle cx="98" cy="38" r="8" />
      {/* Strand falling on forehead */}
      <ellipse cx="52" cy="38" rx="5" ry="8" transform="rotate(-15,52,38)" />
      <ellipse cx="65" cy="37" rx="4" ry="7" transform="rotate(10,65,37)" />
    </g>
  );
}

function EyeUnit({
  cx, cy, open, pupilDy, pupilR,
}: {
  cx: number; cy: number;
  open: number; pupilDy: number; pupilR: number;
}) {
  return (
    <g>
      {/* White of eye */}
      <motion.ellipse
        cx={cx} cy={cy}
        rx={11} ry={10}
        fill="white"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth={0.5}
        animate={{ scaleY: open }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Pupil */}
      <motion.circle
        cx={cx}
        fill="#1a1a1a"
        r={pupilR}
        animate={{ cy: cy + pupilDy, r: pupilR }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      />
      {/* Iris ring */}
      <motion.circle
        cx={cx}
        fill="none"
        stroke="#3b2a1a"
        strokeWidth={1.5}
        r={pupilR + 1.5}
        animate={{ cy: cy + pupilDy }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      />
      {/* Shine */}
      <motion.circle
        cx={cx - 2}
        r={1.5}
        fill="white"
        opacity={0.9}
        animate={{ cy: cy + pupilDy - 2.5 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      />
      {/* Eyelid (top) */}
      <motion.ellipse
        cx={cx} cy={cy}
        rx={11.5}
        fill="#C68A5E"
        animate={{
          ry: open < 0.7 ? 10 * (1 - open) + 1 : 0,
          cy: cy - 5,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
    </g>
  );
}

function EyebrowUnit({ browY, surprised }: { browY: number; surprised: boolean }) {
  const leftPath  = surprised
    ? "M 32 44 Q 44 36 54 44"  // arched
    : "M 33 48 Q 44 45 53 48"; // normal
  const rightPath = surprised
    ? "M 68 44 Q 76 36 88 44"
    : "M 67 48 Q 76 45 87 48";

  return (
    <motion.g
      animate={{ y: browY }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <motion.path
        d={leftPath}
        stroke="#1a1a1a"
        strokeWidth={surprised ? 3 : 2.5}
        strokeLinecap="round"
        fill="none"
        animate={{ d: leftPath }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      />
      <motion.path
        d={rightPath}
        stroke="#1a1a1a"
        strokeWidth={surprised ? 3 : 2.5}
        strokeLinecap="round"
        fill="none"
        animate={{ d: rightPath }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      />
    </motion.g>
  );
}

function MouthUnit({ type }: { type: "neutral" | "smile" | "open" }) {
  const paths = {
    neutral: "M 51 82 Q 60 84 69 82",
    smile:   "M 48 80 Q 60 92 72 80",
    open:    "M 52 81 Q 60 88 68 81",
  };
  const fills = {
    neutral: "none",
    smile:   "none",
    open:    "rgba(80,30,10,0.35)",
  };

  return (
    <motion.path
      d={paths[type]}
      stroke="#7a3b1e"
      strokeWidth={2.5}
      strokeLinecap="round"
      fill={fills[type]}
      animate={{ d: paths[type] }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
    />
  );
}

function SuccessSparkles() {
  const stars = [
    { x: 18, y: 28, delay: 0,    r: 4 },
    { x: 102, y: 32, delay: 0.1, r: 3 },
    { x: 15, y: 55, delay: 0.2,  r: 2.5 },
    { x: 105, y: 58, delay: 0.15, r: 3 },
    { x: 60, y: 10, delay: 0.05, r: 3.5 },
  ];
  return (
    <>
      {stars.map((s, i) => (
        <motion.g key={i}>
          {/* Horizontal line */}
          <motion.line
            x1={s.x - s.r} y1={s.y} x2={s.x + s.r} y2={s.y}
            stroke="#FFD700" strokeWidth={1.5} strokeLinecap="round"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 1, 0] }}
            transition={{ delay: s.delay, duration: 0.6, repeat: Infinity, repeatDelay: 1.2 }}
            style={{ transformOrigin: `${s.x}px ${s.y}px` }}
          />
          {/* Vertical line */}
          <motion.line
            x1={s.x} y1={s.y - s.r} x2={s.x} y2={s.y + s.r}
            stroke="#FFD700" strokeWidth={1.5} strokeLinecap="round"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: [0, 1, 0] }}
            transition={{ delay: s.delay + 0.05, duration: 0.6, repeat: Infinity, repeatDelay: 1.2 }}
            style={{ transformOrigin: `${s.x}px ${s.y}px` }}
          />
        </motion.g>
      ))}
    </>
  );
}
