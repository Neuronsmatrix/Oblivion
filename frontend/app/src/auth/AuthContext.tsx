import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../lib/api/endpoints';
import { setAuthFailureHandler } from '../lib/api/client';
import { tokenStore } from '../lib/api/storage';
import { queryClient } from '../lib/queryClient';
import type { RegisterRequest, User } from '../lib/api/types';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: User | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const bootstrapped = useRef(false);

  // Register the failure handler in its own effect so a StrictMode
  // mount→cleanup→mount cycle always leaves it set (the bootstrap guard below
  // would otherwise skip re-registration on the second mount).
  useEffect(() => {
    setAuthFailureHandler(() => {
      tokenStore.clear();
      queryClient.clear();
      setUser(null);
      setStatus('anonymous');
    });
    return () => setAuthFailureHandler(null);
  }, []);

  // Bootstrap: hydrate the session from a stored refresh token on first load.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    (async () => {
      if (!tokenStore.getRefresh()) {
        setStatus('anonymous');
        return;
      }
      try {
        const me = await authApi.me(); // apiFetch refreshes the access token on 401
        setUser(me);
        setStatus('authenticated');
      } catch {
        tokenStore.clear();
        setStatus('anonymous');
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login({ email, password });
    tokenStore.set(tokens);
    const me = await authApi.me();
    queryClient.clear(); // never serve a previous user's cached data
    setUser(me);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (req: RegisterRequest) => {
    await authApi.register(req); // returns User, not tokens
    await login(req.email, req.password); // immediately exchange for a session
  }, [login]);

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      // best-effort; clear locally regardless
    }
    tokenStore.clear();
    queryClient.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
