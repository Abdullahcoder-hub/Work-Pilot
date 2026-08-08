import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tokenStore, setUnauthorizedHandler } from '../../lib/api';
import { connectSocket, disconnectSocket } from '../../lib/socket';
import { Company, Role, User } from '../../types';
import * as authApi from './authApi';

interface AuthContextValue {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerCompany: (input: authApi.RegisterCompanyPayload) => Promise<{ email: string; message?: string }>;
  setSession: (token: string, user: User) => Promise<void>;
  /** Patches the locally cached user/company after a Settings change, without a full refetch. */
  updateUser: (patch: Partial<User>) => void;
  updateCompany: (patch: Partial<Company>) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const clearSession = useCallback(() => {
    tokenStore.clear();
    disconnectSocket();
    queryClient.clear();
    setUser(null);
    setCompany(null);
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    async function bootstrap() {
      if (!tokenStore.get()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authApi.getMe();
        setUser(me.user);
        setCompany(me.company);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }
    void bootstrap();
  }, [clearSession]);

  useEffect(() => {
    const token = tokenStore.get();
    if (user && token) {
      connectSocket(token);
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    tokenStore.set(result.token);
    setUser(result.user);
    const me = await authApi.getMe();
    setCompany(me.company);
    return result.user;
  }, []);

  const registerCompany = useCallback(async (input: authApi.RegisterCompanyPayload) => {
    const result = await authApi.registerCompany(input);
    // No tokenStore.set / setUser here on purpose — the account exists but
    // is unusable until the person verifies their email (see login()'s
    // isEmailVerified check on the backend). The caller shows a
    // "check your email" screen instead of navigating into the app.
    return { email: result.user.email, message: result.message };
  }, []);

  const setSession = useCallback(async (token: string, sessionUser: User) => {
    tokenStore.set(token);
    setUser(sessionUser);
    const me = await authApi.getMe();
    setCompany(me.company);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const updateCompany = useCallback((patch: Partial<Company>) => {
    setCompany((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const hasRole = useCallback((...roles: Role[]) => !!user && roles.includes(user.role), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, company, isLoading, isAuthenticated: !!user, login, registerCompany, setSession, updateUser, updateCompany, logout, hasRole }),
    [user, company, isLoading, login, registerCompany, setSession, updateUser, updateCompany, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
