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
      setState({
        profile,
        activeRole: profile?.roles[0] ?? null,
        isLoading: false,
        isAuthenticated: !!profile,
        configError: null,
      });
      return;
    }

    // ── Production: Supabase Auth observer ──
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged((profile) => {
        setState({
          profile,
          activeRole: profile?.roles[0] ?? null,
          isLoading: false,
          isAuthenticated: !!profile,
          configError: null,
        });
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, isLoading: false, configError: msg }));
    }

    return () => unsubscribe?.();
  }, []);

  const notifyLogin = (profile: UserProfile, role?: UserRole) => {
    setState({
      profile,
      activeRole: role ?? profile.roles[0] ?? null,
      isLoading: false,
      isAuthenticated: true,
      configError: null,
    });
  };

  const setActiveRole = (role: UserRole) => {
    setState((prev) => ({ ...prev, activeRole: role }));
  };

  const logout = async () => {
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
