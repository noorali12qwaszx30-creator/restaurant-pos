import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut as supabaseSignOut,
  getCurrentProfile,
} from "@/integrations/supabase/auth";
import type { UserProfile, UserRole } from "@/types";
import { IS_DEV_MODE, getMockSession, mockSignOut } from "@/lib/dev-mock";

interface AuthState {
  profile: UserProfile | null;
  activeRole: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  configError: string | null;
}

interface AuthContextValue extends AuthState {
  setActiveRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  notifyLogin: (profile: UserProfile, role?: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    profile: null,
    activeRole: null,
    isLoading: true,
    isAuthenticated: false,
    configError: null,
  });

  useEffect(() => {
    // ── Dev mode: restore session from sessionStorage ──
    if (IS_DEV_MODE) {
      const profile = getMockSession();
      const savedRole = localStorage.getItem("activeRole") as UserRole | null;
      const activeRole = savedRole && profile?.roles.includes(savedRole)
        ? savedRole
        : (profile?.roles[0] ?? null);
      setState({
        profile,
        activeRole,
        isLoading: false,
        isAuthenticated: !!profile,
        configError: null,
      });
      return;
    }

    // ── Production: Supabase Auth observer ──
    let unsubscribe: (() => void) | undefined;

    // Safety timeout — if auth doesn't resolve in 8s, stop loading
    const timeout = setTimeout(() => {
      setState(prev => prev.isLoading ? { ...prev, isLoading: false } : prev);
    }, 8000);

    try {
      unsubscribe = onAuthStateChanged((profile) => {
        clearTimeout(timeout);
        const savedRole = localStorage.getItem("activeRole") as UserRole | null;
        const activeRole = savedRole && profile?.roles.includes(savedRole)
          ? savedRole
          : (profile?.roles[0] ?? null);
        setState({
          profile,
          activeRole,
          isLoading: false,
          isAuthenticated: !!profile,
          configError: null,
        });
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, isLoading: false, configError: msg }));
    }

    return () => { unsubscribe?.(); clearTimeout(timeout); };
  }, []);

  const notifyLogin = (profile: UserProfile, role?: UserRole) => {
    const activeRole = role ?? profile.roles[0] ?? null;
    if (activeRole) localStorage.setItem("activeRole", activeRole);
    setState({
      profile,
      activeRole,
      isLoading: false,
      isAuthenticated: true,
      configError: null,
    });
  };

  const setActiveRole = (role: UserRole) => {
    localStorage.setItem("activeRole", role);
    setState((prev) => ({ ...prev, activeRole: role }));
  };

  const logout = async () => {
    localStorage.removeItem("activeRole");
    if (IS_DEV_MODE) {
      mockSignOut();
    } else {
      await supabaseSignOut();
    }
    setState({
      profile: null,
      activeRole: null,
      isLoading: false,
      isAuthenticated: false,
      configError: null,
    });
  };

  const refreshProfile = async () => {
    if (IS_DEV_MODE || !state.profile) return;
    const profile = await getCurrentProfile();
    if (profile) setState((prev) => ({ ...prev, profile }));
  };

  return (
    <AuthContext.Provider
      value={{ ...state, setActiveRole, logout, refreshProfile, notifyLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
