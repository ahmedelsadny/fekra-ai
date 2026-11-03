'use client';

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../components/LoginScreen';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { DashboardAnalytics } from '../components/DashboardAnalytics';
import { FinanceView } from '../components/FinanceView';
import { PartnerApprovalWidget } from '../components/PartnerApprovalWidget';
import { ProjectsManager } from '../components/ProjectsManager';
import { DailyReportView } from '../components/DailyReportView';
import { MeetingsView } from '../components/MeetingsView';
import { AuditView } from '../components/AuditView';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-slate-900">
        <div className="w-10 h-10 rounded-xl bg-cyan-dim border border-cyan/40 flex items-center justify-center text-cyan mb-3">
          <Sparkles className="w-5 h-5 text-cyan" />
        </div>
        <p className="text-xs font-mono text-cyan tracking-wider">FEKRA AI • جاري تحميل النظام...</p>
      </div>
    );
  }

  // If not logged in, enforce official login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-800 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Header Title & Quick Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan"></span>
                <span>FEKRA AI OPERATING SYSTEM • CAIRO HQ</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {currentTab === 'dashboard' && 'لوحة القيادة والتحليلات المالية'}
                {currentTab === 'finance' && 'المالية والخزينة وإضافة رصيد'}
                {currentTab === 'approvals' && 'اعتمادات مصروفات الشركة'}
                {(currentTab === 'projects' || currentTab === 'tasks') && 'المشاريع والمهام ونقاشات العمل'}
                {currentTab === 'meetings' && 'الاجتماعات والمكالمات وغرفة الشركاء الجماعية'}
                {currentTab === 'daily-reports' && 'التقارير اليومية وإنجازات الفريق'}
                {currentTab === 'audit' && 'سجل التدقيق والعمليات المسجلة'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                أهلاً بك، <span className="text-cyan font-bold">{user?.name}</span> • مساحة العمل المؤسسية
              </p>
            </div>

            {/* Quick Header Nav Buttons (mobile/tablet only — the sidebar covers desktop) */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-navy-900 border border-surface-border self-start lg:hidden overflow-x-auto max-w-full">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  currentTab === 'dashboard'
                    ? 'bg-cyan text-navy-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                التحليلات (Dashboard)
              </button>
              <button
                onClick={() => setCurrentTab('finance')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  currentTab === 'finance'
                    ? 'bg-cyan text-navy-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                المالية والخزينة
              </button>
              <button
                onClick={() => setCurrentTab('approvals')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  currentTab === 'approvals'
                    ? 'bg-cyan text-navy-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                اعتماد المصروفات
              </button>
              <button
                onClick={() => setCurrentTab('projects')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  currentTab === 'projects' || currentTab === 'tasks'
                    ? 'bg-cyan text-navy-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                المشاريع والدردشة
              </button>
              <button
                onClick={() => setCurrentTab('meetings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  currentTab === 'meetings'
                    ? 'bg-cyan text-navy-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                الاجتماعات والمكالمات
              </button>
            </div>
          </div>

          {/* Active Tab View */}
          {currentTab === 'dashboard' && <DashboardAnalytics onNavigateTab={setCurrentTab} />}

          {currentTab === 'finance' && <FinanceView />}

          {currentTab === 'approvals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">نظام اعتماد المصروفات بإجماع الشركاء</h3>
                  <p className="text-xs text-slate-500">أي مصروف يتطلب موافقة 4 من 4 شركاء دون أي اعتراض</p>
                </div>
              </div>
              <PartnerApprovalWidget />
            </div>
          )}

          {(currentTab === 'projects' || currentTab === 'tasks') && <ProjectsManager />}

          {currentTab === 'meetings' && <MeetingsView />}

          {currentTab === 'daily-reports' && <DailyReportView />}

          {currentTab === 'audit' && <AuditView />}
        </main>
      </div>
    </div>
  );
}
