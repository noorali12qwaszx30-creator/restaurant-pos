import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CreditCard, Map, Bike, ShoppingBag, ChefHat, Settings2, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "@/integrations/supabase/auth";
import { IS_DEV_MODE, mockSignIn } from "@/lib/dev-mock";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_CONFIGS, ROLE_ROUTES, type UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<string, LucideIcon> = {
  CreditCard, Map, Bike, ShoppingBag, ChefHat, Settings2,
};

const ALL_ROLES: UserRole[] = ["cashier", "field", "delivery", "takeaway", "kitchen", "admin"];

const loginSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .regex(/^[a-zA-Z0-9_]+$/, "يُسمح فقط بالحروف والأرقام والشرطة السفلية"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});
type LoginFormData = z.infer<typeof loginSchema>;

// ── Eye overlay — positions calibrated to the real photo ──────
// Photo is portrait ~3:4. Eyes at ~38% from top, 38%/60% horizontal
const LEFT_EYE  = { x: 38.5, y: 37.5 }; // % of container
const RIGHT_EYE = { x: 60.5, y: 37.5 };

type AvatarState = "idle" | "typing" | "peek" | "success";

// ── Interactive Eye Overlay ────────────────────────────────────
function EyeOverlay({ state, containerW, containerH }: {
  state: AvatarState;
  containerW: number;
  containerH: number;
}) {
  const lx = (LEFT_EYE.x  / 100) * containerW;
  const ly = (LEFT_EYE.y  / 100) * containerH;
  const rx = (RIGHT_EYE.x / 100) * containerW;
  const ry = (RIGHT_EYE.y / 100) * containerH;

  // Pupil offset when typing (look down-right toward form)
  const pupilOffset = state === "typing"  ? { x: 3,  y: 4  }
                    : state === "peek"    ? { x: 0,  y: 0  }
                    : state === "success" ? { x: 0,  y: -1 }
                    : { x: 0, y: 0 };

  // Eyelid openness: 0=closed, 1=full open
  const openness = state === "idle"    ? 0.45
                 : state === "typing"  ? 1
                 : state === "peek"    ? 1.2
                 : /* success */         0.65;

  const eyeRx = 14;
  const eyeRy = 10;

  const glowColor = state === "typing"  ? "rgba(96,165,250,0.55)"
                  : state === "peek"    ? "rgba(251,191,36,0.6)"
                  : state === "success" ? "rgba(34,197,94,0.55)"
                  : "rgba(255,255,255,0.15)";

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerW}
      height={containerH}
      style={{ zIndex: 10 }}
    >
      <defs>
        <filter id="eye-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="soft-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Glow aura around eyes */}
      <motion.ellipse cx={lx} cy={ly} rx={eyeRx + 10} ry={eyeRy + 8}
        fill={glowColor} filter="url(#soft-glow)"
        animate={{ opacity: state === "idle" ? 0 : 0.8, rx: eyeRx + 10, ry: (eyeRy + 8) * openness }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        style={{ transformOrigin: `${lx}px ${ly}px` }}
      />
      <motion.ellipse cx={rx} cy={ry} rx={eyeRx + 10} ry={eyeRy + 8}
        fill={glowColor} filter="url(#soft-glow)"
        animate={{ opacity: state === "idle" ? 0 : 0.8, rx: eyeRx + 10, ry: (eyeRy + 8) * openness }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        style={{ transformOrigin: `${rx}px ${ry}px` }}
      />

      {/* Pupil highlight dots */}
      {[{ x: lx, y: ly }, { x: rx, y: ry }].map((eye, i) => (
        <motion.g key={i}
          animate={{ x: pupilOffset.x * (i === 0 ? 1 : -0.7), y: pupilOffset.y }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
        >
          {/* White shine */}
          <motion.circle
            cx={eye.x - 4} cy={eye.y - 3} r={3}
            fill="rgba(255,255,255,0.9)"
            filter="url(#eye-glow)"
            animate={{ opacity: state === "idle" ? 0 : 1, r: state === "peek" ? 4 : 3 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          />
          {/* Smaller secondary shine */}
          <motion.circle
            cx={eye.x + 3} cy={eye.y + 2} r={1.5}
            fill="rgba(255,255,255,0.6)"
            animate={{ opacity: state === "idle" ? 0 : 0.7 }}
            transition={{ duration: 0.3 }}
          />
        </motion.g>
      ))}

      {/* Success sparkles */}
      <AnimatePresence>
        {state === "success" && (
          <>
            {[
              { x: lx - 20, y: ly - 20 },
              { x: rx + 18, y: ry - 18 },
              { x: lx - 5,  y: ly - 30 },
              { x: rx + 5,  y: ry - 28 },
            ].map((pos, i) => (
              <motion.g key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -12] }}
                transition={{ delay: i * 0.1, duration: 0.8, repeat: Infinity, repeatDelay: 0.8 }}
              >
                <line x1={pos.x} y1={pos.y - 5} x2={pos.x} y2={pos.y + 5}
                  stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
                <line x1={pos.x - 5} y1={pos.y} x2={pos.x + 5} y2={pos.y}
                  stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
              </motion.g>
            ))}
          </>
        )}
      </AnimatePresence>
    </svg>
  );
}

// ── Full Character Component ───────────────────────────────────
function CharacterFigure({ state }: { state: AvatarState }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDims({ w: el.offsetWidth, h: el.offsetHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Subtle lean toward form when typing
  const tilt   = state === "typing" ? -4 : state === "peek" ? 3 : 0;
  const scaleX = state === "peek"   ? 1.04 : 1;

  return (
    <motion.div
      animate={{ rotate: tilt, scaleX }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="relative w-full h-full"
      style={{ transformOrigin: "bottom center" }}
    >
      {/* Photo container */}
      <div ref={ref} className="relative w-full h-full overflow-hidden">
        {/* The photo — fills the container, object-position to show face */}
        <img
          src="/avatar.jpg"
          alt=""
          className="w-full h-full object-cover object-top"
          style={{ filter: state === "success" ? "brightness(1.08) saturate(1.1)" : "brightness(1) saturate(1)" }}
          draggable={false}
        />

        {/* Gradient overlays to blend into background */}
        {/* Bottom fade — creates illusion of full body fading out */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[hsl(var(--background))] via-[hsl(var(--background))/60%] to-transparent" />
        {/* Right edge fade */}
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[hsl(var(--background))] to-transparent" />
        {/* Left edge subtle */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[hsl(var(--background))/30%] to-transparent" />
        {/* Top subtle */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[hsl(var(--background))/20%] to-transparent" />

        {/* Interactive eye overlay */}
        {dims.w > 0 && (
          <EyeOverlay state={state} containerW={dims.w} containerH={dims.h} />
        )}
      </div>

      {/* State label hint */}
      <AnimatePresence>
        {state === "peek" && (
          <motion.div
            className="absolute top-[33%] left-1/2 -translate-x-1/2 bg-status-warning/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg"
            initial={{ opacity: 0, y: -8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ top: `${LEFT_EYE.y - 8}%` }}
          >
            👀 يراقبك!
          </motion.div>
        )}
        {state === "success" && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 bg-status-success/90 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ top: `${LEFT_EYE.y + 10}%` }}
          >
            ✓ أهلاً بك!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main LoginPage
// ─────────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate();
  const { notifyLogin } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState(false);

  // Avatar state
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [passwordValue, setPasswordValue] = useState("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (loginSuccess) return;
    if (showPassword) {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      setAvatarState("peek");
      return;
    }
    if (passwordValue.length > 0) {
      setAvatarState("typing");
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setAvatarState("idle"), 1800);
    } else {
      setAvatarState("idle");
    }
    return () => { if (typingTimer.current) clearTimeout(typingTimer.current); };
  }, [passwordValue, showPassword, loginSuccess]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    if (!selectedRole) { setRoleError(true); return; }
    setRoleError(false);
    setAuthError(null);
    try {
      if (IS_DEV_MODE) {
        const profile = mockSignIn(data.username, data.password);
        if (!profile.roles.includes(selectedRole)) {
          setAuthError(`ليس لديك صلاحية دور "${ROLE_CONFIGS[selectedRole].label}"`);
          return;
        }
        setLoginSuccess(true);
        setAvatarState("success");
        setTimeout(() => { notifyLogin(profile, selectedRole); navigate(ROLE_ROUTES[selectedRole], { replace: true }); }, 900);
        return;
      }
      const profile = await signIn(data.username, data.password);
      if (!profile.roles.includes(selectedRole)) {
        setAuthError(`ليس لديك صلاحية دور "${ROLE_CONFIGS[selectedRole].label}"`);
        return;
      }
      setLoginSuccess(true);
      setAvatarState("success");
      setTimeout(() => { notifyLogin(profile, selectedRole); navigate(ROLE_ROUTES[selectedRole], { replace: true }); }, 900);
    } catch {
      setAuthError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="min-h-dvh bg-background overflow-hidden relative flex">

      {/* ── Left side: Character figure ─────────────────────── */}
      {/* Desktop: takes left half. Mobile: full background behind card */}
      <div className="
        hidden md:block
        w-[45%] min-h-dvh relative shrink-0
        overflow-hidden
      ">
        {/* Background tint behind photo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <CharacterFigure state={avatarState} />
      </div>

      {/* Mobile: character as background */}
      <div className="absolute inset-0 md:hidden pointer-events-none">
        <div className="absolute left-0 top-0 w-2/3 h-full opacity-25">
          <CharacterFigure state={avatarState} />
        </div>
      </div>

      {/* ── Right side: Login form ───────────────────────────── */}
      <div className="
        flex-1 flex flex-col items-center justify-center
        px-5 py-8 relative z-10
      ">
        {/* Background blobs */}
        <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden>
          <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-primary/6 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-status-info/4 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-sm">
          {/* Dev badge */}
          {IS_DEV_MODE && (
            <div className="flex justify-center mb-4">
              <span className="text-xs bg-status-warning/12 text-status-warning border border-status-warning/25 rounded-full px-3.5 py-1.5 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
                وضع التطوير
              </span>
            </div>
          )}

          {/* Brand */}
          <div className="text-center mb-7">
            <motion.div
              animate={loginSuccess ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="w-14 h-14 primary-gradient rounded-2xl flex items-center justify-center shadow-elevated mx-auto mb-3"
            >
              <ShoppingBag className="w-7 h-7 text-white" strokeWidth={1.8} />
            </motion.div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Twitter POS</h1>
            <p className="text-sm text-text-muted mt-0.5">نظام إدارة المطعم</p>
          </div>

          {/* Card */}
          <motion.div
            animate={loginSuccess ? { scale: [1, 1.01, 1], borderColor: "hsl(var(--status-success))" } : {}}
            transition={{ duration: 0.4 }}
            className="bg-surface/95 backdrop-blur-xl border border-border/60 rounded-3xl p-6 shadow-dialog"
          >
            <h2 className="text-lg font-bold text-text-primary mb-5 text-center">تسجيل الدخول</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input id="username" type="text" placeholder="أدخل اسم المستخدم"
                  autoComplete="username" autoCapitalize="none" dir="ltr"
                  className={cn(errors.username && "border-status-error")}
                  {...register("username")}
                />
                {errors.username && <p className="text-xs text-status-error">{errors.username.message}</p>}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    autoComplete="current-password" dir="ltr"
                    className={cn("pe-10", errors.password && "border-status-error")}
                    {...register("password", {
                      onChange: (e) => setPasswordValue(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 end-3 flex items-center text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <motion.div animate={showPassword ? { rotate: 10, scale: 1.1 } : { rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.div>
                  </button>
                </div>
                {errors.password && <p className="text-xs text-status-error">{errors.password.message}</p>}
              </div>

              {/* Role selector */}
              <div className="flex flex-col gap-2">
                <Label className={cn(roleError && "text-status-error")}>اختر دورك</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_ROLES.map((roleId) => {
                    const cfg = ROLE_CONFIGS[roleId];
                    const isSelected = selectedRole === roleId;
                    const Icon = ROLE_ICONS[cfg.iconName] ?? Settings2;
                    return (
                      <motion.button key={roleId} type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => { setSelectedRole(roleId); setRoleError(false); }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border transition-all duration-150",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-card"
                            : "border-border bg-surface-elevated hover:border-primary/20"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                          isSelected ? "bg-primary text-white" : "bg-border/60 text-text-muted"
                        )}>
                          <Icon className="w-4 h-4" strokeWidth={2} />
                        </div>
                        <span className={cn("text-[11px] font-semibold",
                          isSelected ? "text-primary" : "text-text-secondary")}>
                          {cfg.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                {roleError && <p className="text-xs text-status-error">يجب اختيار دور للمتابعة</p>}
              </div>

              {/* Auth error */}
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-status-error/10 border border-status-error/20 rounded-xl p-3"
                  >
                    <p className="text-sm text-status-error text-center">{authError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button type="submit" size="lg" disabled={isSubmitting || loginSuccess}
                  className={cn(
                    "w-full rounded-2xl h-12 text-base mt-1 transition-all",
                    loginSuccess && "bg-status-success hover:bg-status-success"
                  )}
                >
                  {loginSuccess ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}>
                      ✓ أهلاً بك!
                    </motion.span>
                  ) : isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> جاري الدخول...</>
                  ) : "دخول"}
                </Button>
              </motion.div>
            </form>

            {/* Dev quick login */}
            {IS_DEV_MODE && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-muted text-center mb-2">دخول سريع</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    ["admin", "Admin@123", "admin"],
                    ["cashier1", "Cash@123", "cashier"],
                    ["kitchen1", "Kitchen@123", "kitchen"],
                    ["delivery1", "Delivery@123", "delivery"],
                    ["field1", "Field@123", "field"],
                    ["takeaway1", "Take@123", "takeaway"],
                  ] as [string, string, UserRole][]).map(([u, p, role]) => {
                    const cfg = ROLE_CONFIGS[role];
                    const Icon = ROLE_ICONS[cfg.iconName];
                    return (
                      <button key={u} type="button"
                        onClick={() => {
                          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
                          const uEl = document.getElementById("username") as HTMLInputElement;
                          const pEl = document.getElementById("password") as HTMLInputElement;
                          setter.call(uEl, u); uEl.dispatchEvent(new Event("input", { bubbles: true }));
                          setter.call(pEl, p); pEl.dispatchEvent(new Event("input", { bubbles: true }));
                          setSelectedRole(role); setRoleError(false);
                        }}
                        className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl bg-surface-elevated hover:bg-border border border-border transition-all active:scale-[0.97]"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${cfg.color}20` }}>
                          {Icon && <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />}
                        </div>
                        <span className="text-[10px] font-semibold text-text-primary">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          <p className="text-center text-xs text-text-muted mt-5">
            Twitter Restaurant POS &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
