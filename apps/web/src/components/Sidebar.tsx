'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  FileText,
  DollarSign,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { t, language, toggleLanguage } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: 'لوحة القيادة والتحليلات', icon: LayoutDashboard },
    { id: 'finance', label: 'المالية والخزينة وإضافة رصيد', icon: Wallet },
    { id: 'approvals', label: 'اعتمادات المصروفات', icon: DollarSign, badge: '4/4' },
    { id: 'tasks', label: 'المشاريع والمهام', icon: CheckSquare },
    { id: 'daily-reports', label: 'التقارير اليومية', icon: FileText },
    { id: 'partners', label: 'الشركاء ومجلس الإدارة', icon: Users },
  ];

  return (
    <aside className="w-72 bg-navy-900 border-r border-surface-border flex flex-col justify-between h-screen sticky top-0 z-40 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan to-electric-600 flex items-center justify-center text-navy-950 font-black shadow-glow-cyan">
              <Sparkles className="w-5 h-5 fill-navy-950" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wider text-white flex items-center gap-1.5">
                FEKRA <span className="text-cyan font-mono text-sm px-1.5 py-0.5 rounded bg-cyan-dim border border-cyan/30">AI</span>
              </h1>
              <p className="text-xs text-slate-400">نظام التشغيل الداخلي</p>
            </div>
          </div>
        </div>

        {/* Company Organization Badge - Clean, no 25% clutter */}
        <div className="px-5 py-4 mx-4 my-3 rounded-2xl bg-navy-800/60 border border-surface-border">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>شركة فكرة للذكاء الاصطناعي</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-dim text-cyan border border-cyan/20 font-mono text-[10px]">
              EGP / Cairo
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse"></span>
            <span>بوابة الشركاء المؤسسين</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-dim text-cyan border border-cyan/30 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-cyan/20 text-cyan border border-cyan/40">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 opacity-40 ${language === 'ar' ? 'rotate-180' : ''}`} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer & Language Switcher */}
      <div className="p-4 border-t border-surface-border space-y-2">
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-navy-800 text-slate-200 hover:text-white border border-surface-border hover:border-cyan/40 transition"
        >
          <span>🌐</span>
          <span>{language === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}</span>
        </button>
        <div className="text-[10px] text-center text-slate-500">
          FEKRA AI • Company Operating System
        </div>
      </div>
    </aside>
  );
};
