'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, AUTHORIZED_PARTNERS } from '../context/AuthContext';
import { Search, Bell, CheckCircle2, LogOut, ShieldCheck } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const currentPartner = user || AUTHORIZED_PARTNERS[0];

  return (
    <header className="h-18 bg-navy-900/80 backdrop-blur-md border-b border-surface-border px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="flex items-center gap-3 w-80 lg:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="w-full bg-navy-800/80 border border-surface-border rounded-xl ps-9 pe-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30 transition"
          />
        </div>
      </div>

      {/* Right Controls: Notifications, Logged-in Profile & Logout */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white border border-surface-border transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-cyan animate-ping"></span>
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-cyan"></span>
        </button>

        {/* Current Authenticated Partner Profile */}
        <div className="flex items-center gap-3 ps-3 border-s border-surface-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan/20 to-electric-600/30 border border-cyan/30 flex items-center justify-center text-lg shadow-sm">
            {currentPartner.avatar}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{currentPartner.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-dim text-cyan text-[10px] border border-cyan/30">
                شريك مؤسس
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{currentPartner.email}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="تسجيل الخروج من الحساب"
          className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition flex items-center gap-1.5 text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </header>
  );
};
