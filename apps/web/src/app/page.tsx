'use client';

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../components/LoginScreen';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { PartnerApprovalWidget } from '../components/PartnerApprovalWidget';
import { KanbanBoard } from '../components/KanbanBoard';
import { DailyReportView } from '../components/DailyReportView';
import { PartnersView } from '../components/PartnersView';
import {
  TrendingUp,
  FolderKanban,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  ShieldCheck,
  Building,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan to-electric-600 flex items-center justify-center shadow-glow-cyan animate-pulse mb-3">
          <Sparkles className="w-6 h-6 fill-navy-950 text-navy-950" />
        </div>
        <p className="text-xs font-mono text-cyan tracking-wider">FEKRA AI • LOADING SYSTEM...</p>
      </div>
    );
  }

  // If not logged in, enforce login screen for the 4 partners
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-8 space-y-8 flex-1 overflow-y-auto">
          {/* Welcome & Organization Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan"></span>
                <span>FEKRA AI OPERATING SYSTEM • CAIRO HUB</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {t('brandName')} – {t('tagline')}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                مرحباً بك يا <span className="text-cyan font-bold">{user?.name}</span> • {t('oneCompany')}
              </p>
            </div>

            {/* Quick Tab Pill Switcher */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-navy-900 border border-surface-border self-start">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentTab === 'dashboard'
                    ? 'bg-cyan text-navy-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentTab('approvals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentTab === 'approvals'
                    ? 'bg-cyan text-navy-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                4-Partner Approvals
              </button>
              <button
                onClick={() => setCurrentTab('tasks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentTab === 'tasks'
                    ? 'bg-cyan text-navy-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setCurrentTab('daily-reports')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  currentTab === 'daily-reports'
                    ? 'bg-cyan text-navy-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Reports
              </button>
            </div>
          </div>

          {/* Conditional Views based on currentTab */}
          {currentTab === 'approvals' && (
            <div className="space-y-6">
              <PartnerApprovalWidget />
            </div>
          )}

          {currentTab === 'tasks' && <KanbanBoard />}

          {currentTab === 'daily-reports' && <DailyReportView />}

          {currentTab === 'partners' && <PartnersView />}

          {/* Default Executive Dashboard Tab */}
          {currentTab === 'dashboard' && (
            <>
              {/* Executive KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Card */}
                <div className="p-5 rounded-2xl bg-navy-900/80 border border-surface-border hover:border-cyan/40 transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">{t('totalRevenue')}</span>
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    2,450,000 <span className="text-xs font-sans text-cyan">{t('currencyEGP')}</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-mono">
                    <span>+18.4%</span>
                    <span className="text-slate-400">vs last quarter</span>
                  </div>
                </div>

                {/* Approved Expenses Card */}
                <div className="p-5 rounded-2xl bg-navy-900/80 border border-surface-border hover:border-cyan/40 transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">{t('totalExpenses')}</span>
                    <span className="p-2 rounded-xl bg-cyan-dim text-cyan">
                      <ArrowDownRight className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    780,000 <span className="text-xs font-sans text-slate-400">{t('currencyEGP')}</span>
                  </div>
                  <div className="text-[11px] text-cyan mt-2 font-mono flex items-center gap-1">
                    <span>100% Unanimous Approved</span>
                  </div>
                </div>

                {/* Net Cash Flow Card */}
                <div className="p-5 rounded-2xl bg-navy-900/80 border border-surface-border hover:border-cyan/40 transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">{t('netCashFlow')}</span>
                    <span className="p-2 rounded-xl bg-cyan-dim text-cyan">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-cyan font-mono">
                    1,670,000 <span className="text-xs font-sans text-slate-400">{t('currencyEGP')}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">
                    Treasury Reserve Ratio: 68%
                  </div>
                </div>

                {/* Projects Status Card */}
                <div className="p-5 rounded-2xl bg-navy-900/80 border border-surface-border hover:border-cyan/40 transition-all">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">{t('totalProjects')}</span>
                    <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <FolderKanban className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-white font-mono">
                    8 <span className="text-xs font-sans text-slate-400">({t('activeProjects')}: 5)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">
                    Completion Rate: 92%
                  </div>
                </div>
              </div>

              {/* Highlight: Mandatory 4-Partner Expense Approval Live Component */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan" />
                    <h3 className="text-base font-bold text-white">
                      {t('navExpenseApprovals')}
                    </h3>
                  </div>
                  <span className="text-xs text-cyan font-mono font-bold">
                    Section 7.1 Business Rule Implementation
                  </span>
                </div>
                <PartnerApprovalWidget />
              </div>

              {/* Kanban Task Pipeline Preview */}
              <KanbanBoard />

              {/* Daily Report Feed Preview */}
              <DailyReportView />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
