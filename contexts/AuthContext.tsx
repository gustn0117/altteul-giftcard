'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { DBUser } from '@/lib/types';

interface AuthContextType {
  user: DBUser | null;
  login: (user: DBUser) => void;
  logout: () => void;
  isLoggedIn: boolean;
  /** 저장된 로그인 정보를 다 읽었는지. false 동안은 isLoggedIn 이 아직 확정이 아니다 */
  ready: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
  ready: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DBUser | null>(null);
  // 로그인 정보는 첫 렌더 '이후'에 읽힌다. 이 플래그 없이 !isLoggedIn 으로 판단하면
  // 로그인한 사용자도 로그인 화면으로 튕긴다.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('altteul-giftcard_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setReady(true);
  }, []);

  const login = (userData: DBUser) => {
    setUser(userData);
    localStorage.setItem('altteul-giftcard_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('altteul-giftcard_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
