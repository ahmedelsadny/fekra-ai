'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, getToken, clearToken, ApiError } from '../lib/api';
import { closeSocket } from '../lib/socket';

export interface PartnerUser {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
  phone?: string;
}

/**
 * Static directory of the four founding partners (names/emails only — NO passwords).
 * Passwords live exclusively in the backend database (argon2-hashed).
 */
export const AUTHORIZED_PARTNERS: PartnerUser[] = [
  {
    id: 'p1',
    email: 'Mahmoud@fekra.com',
    name: 'Mahmoud Ashraf',
    role: 'Managing Partner & Strategy',
    initials: 'MA',
    phone: '+20 101 510 0000',
  },
  {
    id: 'p2',
    email: 'Elsadny@fekra.com',
    name: 'Ahmed Elsadny',
    role: 'Technical Partner & Technology',
    initials: 'AE',
    phone: '+20 128 521 7746',
  },
  {
    id: 'p3',
    email: 'Fouda@fekra.com',
    name: 'Ahmed Fouda',
    role: 'Commercial & Financial Partner',
    initials: 'AF',
    phone: '+20 111 110 0000',
  },
  {
    id: 'p4',
    email: 'Monem@fekra.com',
    name: 'Mohamed Monem',
    role: 'Operations & Execution Partner',
    initials: 'MM',
    phone: '+20 121 400 0000',
  },
];

/** Maps the API user object (with memberships) to the frontend PartnerUser shape. */
function mapApiUser(apiUser: {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  memberships?: { partner?: { title?: string } | null }[];
}): PartnerUser {
  const membership = (apiUser.memberships || [])[0];
  const fullName = apiUser.fullName || 'Partner';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return {
    id: apiUser.id,
    email: apiUser.email,
    name: fullName,
    role: membership?.partner?.title || 'Founding Partner',
    initials,
    phone: apiUser.phone ?? undefined,
  };
}

interface AuthContextType {
  user: PartnerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True when the app is connected to the live API (backend + database). */
  isLiveMode: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const restoreOfflineSession = () => {
      try {
        const savedUser = localStorage.getItem('fekra_auth_partner');
        if (savedUser) {
          const parsed = JSON.parse(savedUser) as PartnerUser;
          if (parsed?.id && parsed?.email) setUser(parsed);
        }
      } catch {
        // ignore corrupted cache
      }
    };

    const bootstrap = async () => {
      if (getToken()) {
        try {
          const me = await api<any>('/auth/me');
          if (cancelled) return;
          const mapped = mapApiUser(me);
          setUser(mapped);
          setIsLiveMode(true);
          localStorage.setItem('fekra_auth_partner', JSON.stringify(mapped));
        } catch (e) {
          if (cancelled) return;
          if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
            // Invalid/expired token — force re-login
            clearToken();
            localStorage.removeItem('fekra_auth_partner');
          } else {
            // Server unreachable — keep working in offline/demo mode
            restoreOfflineSession();
          }
        }
      } else {
        // No token (e.g. legacy/demo session) — offline mode
        restoreOfflineSession();
      }

      if (!cancelled) setIsLoading(false);
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (inputEmail: string, inputPass: string) => {
    const normalizedEmail = (inputEmail || '').trim().toLowerCase();

    try {
      const data = await api<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password: inputPass }),
      });

      setToken(data.accessToken);
      const mapped = mapApiUser(data.user);
      setUser(mapped);
      setIsLiveMode(true);
      localStorage.setItem('fekra_auth_partner', JSON.stringify(mapped));
      return { success: true };
    } catch (e) {
      // Server unreachable → OFFLINE / DEMO mode:
      // resolve the partner by email only (no real data is at stake —
      // everything lives in this browser's local storage).
      if (e instanceof ApiError && e.status === 0) {
        const partner = AUTHORIZED_PARTNERS.find(
          (p) => p.email.toLowerCase() === normalizedEmail,
        );
        if (partner && (inputPass || '').trim().length > 0) {
          setUser(partner);
          setIsLiveMode(false);
          localStorage.setItem('fekra_auth_partner', JSON.stringify(partner));
          return { success: true };
        }
        return {
          success: false,
          error: 'البريد الإلكتروني غير مسجل — الحسابات متاحة حصرياً للشركاء الأربعة المؤسسين.',
        };
      }

      const message = e instanceof ApiError ? e.message : 'فشل تسجيل الدخول';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setIsLiveMode(false);
    clearToken();
    closeSocket();
    localStorage.removeItem('fekra_auth_partner');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isLiveMode,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
