import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CreditCard, Map, Bike, ShoppingBag, ChefHat, Settings2, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InteractiveAvatar, type AvatarState } from "@/components/ui/InteractiveAvatar";
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

export function LoginPage() {
  const navigate = useNavigate();
  const { notifyLogin } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState(false);

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
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-status-info/5 rounded-full blur-[60px]" />
        <div className="absolute top-1/2 left-1/4 w-[250px] h-[250px] bg-primary/4 rounded-full blur-[50px]" />
      </div>

      <div className="relative w-full max-w-sm animate-in">
        {/* Dev badge */}
        {IS_DEV_MODE && (
          <div className="flex justify-center mb-5">
            <span className="text-xs bg-status-warning/12 text-status-warning border border-status-warning/25 rounded-full px-3.5 py-1.5 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
              وضع التطوير
            </span>
          </div>
        )}

        {/* Avatar + Brand */}
        <div className="flex flex-col items-center gap-3 mb-7">
          <motion.div
            animate={
              loginSuccess
                ? { scale: [1, 1.12, 1], y: [0, -8, 0] }
                : avatarState === "peek"
                ? { scale: 1.18, y: 18 }
                : { scale: 1, y: 0 }
            }
            transition={
              loginSuccess
                ? { duration: 0.6, ease: "easeOut" }
                : { type: "spring", stiffness: 180, damping: 18 }
            }
            className="relative"
          >
            <motion.div
              className="absolute -inset-3 rounded-full blur-xl -z-10"
              animate={{
                backgroundColor:
                  avatarState === "success" ? "rgba(34,197,94,0.25)"
                  : avatarState === "typing" ? "rgba(59,130,246,0.20)"
                  : avatarState === "peek"   ? "rgba(251,191,36,0.22)"
                  : "rgba(99,102,241,0.15)",
              }}
              transition={{ duration: 0.4 }}
            />
            <InteractiveAvatar state={avatarState} size={120} />
          </motion.div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">تويتر</h1>
            <p className="text-xs text-text-muted mt-0.5 font-medium">نظام إدارة المطعم</p>
          </div>
        </div>

        {/* Card */}
        <motion.div
          animate={loginSuccess ? { borderColor: "hsl(var(--status-success))" } : {}}
          className="bg-surface border border-border/60 rounded-3xl p-6 shadow-dialog"
        >
          <h2 className="text-lg font-bold text-text-primary mb-6 text-center tracking-tight">
            تسجيل الدخول
          </h2>

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
                <button type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 end-3 flex items-center text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                        "flex flex-col items-center gap-1.5 py-3.5 px-1 rounded-2xl border transition-all duration-150",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-card"
                          : "border-border bg-surface-elevated hover:border-primary/20 hover:bg-surface"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                        isSelected ? "bg-primary text-white shadow-sm" : "bg-border/60 text-text-muted"
                      )}>
                        <Icon className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <span className={cn("text-[11px] font-semibold leading-none",
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
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-status-error/10 border border-status-error/20 rounded-xl p-3">
                  <p className="text-sm text-status-error text-center">{authError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button type="submit" size="lg" disabled={isSubmitting || loginSuccess}
              className={cn("w-full rounded-2xl h-12 text-base mt-1 transition-all",
                loginSuccess && "bg-status-success hover:bg-status-success")}>
              {loginSuccess ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                  ✓ أهلاً بك!
                </motion.span>
              ) : isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري الدخول...</>
              ) : "دخول"}
            </Button>
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
          تويتر &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
