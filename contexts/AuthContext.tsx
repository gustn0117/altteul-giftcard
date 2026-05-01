'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { DBUser } from '@/lib/types';

interface AuthContextType {
  user: DBUser | null;
  login: (user: DBUser) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DBUser | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('altteul-giftcard_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
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
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
