import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  createElement,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';
import type { User, AuthTokens } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('att_user');
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('att_access');
    if (!token) {
      setLoading(false);
      return;
    }
    api<User>('/api/v1/auth/me')
      .then((me) => {
        setUser(me);
        localStorage.setItem('att_user', JSON.stringify(me));
      })
      .catch(() => {
        localStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (idToken: string) => {
    const data = await api<AuthTokens>('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    localStorage.setItem('att_access', data.access);
    localStorage.setItem('att_refresh', data.refresh);
    localStorage.setItem('att_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore — clear storage regardless
    }
    localStorage.clear();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, signIn, signOut } },
    children,
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
