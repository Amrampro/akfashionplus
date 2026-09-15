import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authService from "../services/auth.service";

export type AuthUser = {
  id?: number;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  phone?: string | null;
  preferred_language?: string | null;
  country_code?: string | null;
  avatar_url?: string | null;
  referral_code?: string | null;
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<AuthUser | null>;
  registerWithCredentials: (body: RegisterPayload) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

type AuthResponse = {
  user?: AuthUser | null;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  loginWithCredentials: async () => null,
  registerWithCredentials: async () => null,
  logout: async () => {},
});

function extractUser(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as AuthResponse & AuthUser;
  return response.user || response || null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authService.me();
      setUser(extractUser(result));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      const result = await authService.login({ email, password });
      const nextUser = extractUser(result);
      setUser(nextUser);
      return nextUser;
    },
    [],
  );

  const registerWithCredentials = useCallback(async (body: RegisterPayload) => {
    const result = await authService.register(body);
    const nextUser = extractUser(result);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser,
      loginWithCredentials,
      registerWithCredentials,
      logout,
    }),
    [loading, loginWithCredentials, logout, refreshUser, registerWithCredentials, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
