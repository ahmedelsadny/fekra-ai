'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  Wallet,
  FolderKanban,
  FileText,
  DollarSign,
  ChevronRight,
  Sparkles,
  Globe,
  X,
  Video,
  ScrollText,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isOpen, onClose }) => {
  const { t, language, toggleLanguage } = useLanguage();

  // Drawer slide direction: slides off the RIGHT edge in Arabic (RTL), off the LEFT edge in English (LTR).
  // Overshoots by 24px to guarantee it is fully off-screen. Uses max-lg: so the
  // transform never applies on desktop — no class conflicts.
  const drawerHiddenClass =
    language === 'ar'
      ? 'max-lg:translate-x-[calc(100%_+_24px)]'
      : 'max-lg:-translate-x-[calc(100%_+_24px)]';

  const navItems = [
    { id: 'dashboard', label: 'لوحة القيادة والتحليلات', icon: LayoutDashboard },
    { id: 'finance', label: 'المالية والخزينة وإضافة رصيد', icon: Wallet },
    { id: 'approvals', label: 'اعتمادات المصروفات', icon: DollarSign, badge: '4/4' },
    { id: 'projects', label: 'المشاريع والمهام والدردشة', icon: FolderKanban },
    { id: 'meetings', label: 'الاجتماعات والمكالمات', icon: Video },
    { id: 'daily-reports', label: 'التقارير اليومية', icon: FileText },
    { id: 'audit', label: 'سجل التدقيق', icon: ScrollText },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0B2447]/40 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 start-0 z-50 w-72 shrink-0 bg-navy-900 border-e border-surface-border flex flex-col justify-between h-screen select-none transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : drawerHiddenClass
        }`}
      >
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-dim border border-cyan/40 flex items-center justify-center text-cyan font-bold">
              <Sparkles className="w-4 h-4 text-cyan" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wider text-slate-900 flex items-center gap-1.5">
                FEKRA <span className="text-cyan font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-dim border border-cyan/30">AI</span>
              </h1>
              <p className="text-[11px] text-slate-500">نظام التشغيل الداخلي</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl bg-navy-950 border border-surface-border text-slate-500 hover:text-slate-900 transition"
            title="إغلاق القائمة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Company Organization Badge */}
        <div className="px-4 py-3 mx-4 my-3 rounded-xl bg-navy-950 border border-surface-border">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>شركة فكرة للذكاء الاصطناعي</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-dim text-cyan border border-cyan/20 font-mono text-[10px]">
              EGP
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan"></span>
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
                onClick={() => {
                  setCurrentTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-dim text-cyan border border-cyan/30 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-navy-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan' : 'text-slate-500'}`} />
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
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold bg-navy-950 text-slate-600 hover:text-slate-900 border border-surface-border hover:border-cyan/40 transition"
        >
          <Globe className="w-3.5 h-3.5 text-cyan" />
          <span>{language === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}</span>
        </button>
        <div className="text-[10px] text-center text-slate-500 font-mono">
          FEKRA AI • Company OS v1.0
        </div>
      </div>
    </aside>
    </>
  );
};
