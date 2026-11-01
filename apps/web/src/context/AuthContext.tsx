'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PartnerUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  ownership: string;
  phone?: string;
}

export const AUTHORIZED_PARTNERS: PartnerUser[] = [
  {
    id: 'p1',
    email: 'Mahmoud@fekra.com',
    name: 'Mahmoud Ashraf',
    role: 'Managing Partner & Strategy',
    avatar: '👨‍💼',
    ownership: '25%',
    phone: '+20 101 510 0000',
  },
  {
    id: 'p2',
    email: 'Elsadny@fekra.com',
    name: 'Ahmed Elsadny',
    role: 'Technical Partner & Technology',
    avatar: '👨‍💻',
    ownership: '25%',
    phone: '+20 128 521 7746',
  },
  {
    id: 'p3',
    email: 'Fouda@fekra.com',
    name: 'Ahmed Fouda',
    role: 'Commercial & Financial Partner',
    avatar: '💼',
    ownership: '25%',
    phone: '+20 111 110 0000',
  },
  {
    id: 'p4',
    email: 'Monem@fekra.com',
    name: 'Mohamed Monem',
    role: 'Operations & Execution Partner',
    avatar: '⚡',
    ownership: '25%',
    phone: '+20 121 400 0000',
  },
];

// Exact passwords provided by the user
export const PARTNER_CREDENTIALS: Record<string, string> = {
  'mahmoud@fekra.com': '20101510',
  'elsadny@fekra.com': 'ahmed01285217746',
  'fouda@fekra.com': 'fouda11111fekra',
  'monem@fekra.com': 'monem1214##fekra',
};

interface AuthContextType {
  user: PartnerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PartnerUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('fekra_auth_partner');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as PartnerUser;
        const exists = AUTHORIZED_PARTNERS.find((p) => p.id === parsed.id);
        if (exists) {
          setUser(exists);
        }
      }
    } catch (e) {
      console.error('Failed to load session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (inputEmail: string, inputPass: string) => {
    const normalizedEmail = (inputEmail || '').trim().toLowerCase();
    const cleanPass = (inputPass || '').trim();

    const expectedPass = PARTNER_CREDENTIALS[normalizedEmail];

    if (!expectedPass) {
      return {
        success: false,
        error: 'البريد الإلكتروني غير مسجل. الدخول مصرح به حصرياً للشركاء الأربعة فقط.',
      };
    }

    if (expectedPass !== cleanPass) {
      return {
        success: false,
        error: 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور الخاصة بحسابك.',
      };
    }

    const partner = AUTHORIZED_PARTNERS.find(
      (p) => p.email.toLowerCase() === normalizedEmail,
    );

    if (partner) {
      setUser(partner);
      localStorage.setItem('fekra_auth_partner', JSON.stringify(partner));
      return { success: true };
    }

    return { success: false, error: 'حدث خطأ في استرجاع بيانات الشريك.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fekra_auth_partner');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
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
