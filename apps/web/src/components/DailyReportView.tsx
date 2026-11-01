'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, AlertTriangle, ArrowRightCircle, Calendar, User } from 'lucide-react';

interface DailyReportItem {
  id: string;
  userName: string;
  userRole: string;
  avatar: string;
  date: string;
  submittedAt: string;
  accomplishments: string;
  nextSteps: string;
  blockers: string | null;
  status: 'SUBMITTED' | 'REVIEWED';
}

const SAMPLE_REPORTS: DailyReportItem[] = [
  {
    id: 'REP-01',
    userName: 'Khaled Omar',
    userRole: 'Senior Backend Engineer',
    avatar: '👨‍💻',
    date: '2026-11-01',
    submittedAt: '18:45 PM',
    accomplishments:
      'Completed the PostgreSQL Prisma relational migration for the 4-partner unanimous approval engine and created unit test suites for transaction locking.',
    nextSteps: 'Implement Redis BullMQ workers for background notification dispatch and reminder jobs.',
    blockers: null,
    status: 'REVIEWED',
  },
  {
    id: 'REP-02',
    userName: 'Laila Mostafa',
    userRole: 'Lead UI/UX Engineer',
    avatar: '🎨',
    date: '2026-11-01',
    submittedAt: '17:30 PM',
    accomplishments:
      'Designed the Arabic RTL & English LTR responsive layout system using Tailwind custom CSS variables and dark navy tokens.',
    nextSteps: 'Assemble the Financial Accounts Ledger view and Receipt Attachment dialog.',
    blockers: 'Awaiting high-resolution SVG exports for third-party payment gateway icons.',
    status: 'SUBMITTED',
  },
];

export const DailyReportView: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">{t('dailyReportTitle')}</h3>
          <p className="text-xs text-slate-400">
            Sprint 4 Productivity & Visibility • Mandatory end-of-day submissions
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-navy-800 px-3 py-1.5 rounded-xl border border-surface-border">
          <Calendar className="w-3.5 h-3.5 text-cyan" />
          <span>2026-11-01 (Africa/Cairo)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SAMPLE_REPORTS.map((report) => (
          <div
            key={report.id}
            className="p-5 rounded-2xl bg-navy-900/70 border border-surface-border hover:border-cyan/30 transition-all space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-950 border border-surface-border flex items-center justify-center text-xl">
                  {report.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{report.userName}</h4>
                  <p className="text-[11px] text-slate-400">{report.userRole}</p>
                </div>
              </div>

              <div className="text-end">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {report.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{report.submittedAt}</p>
              </div>
            </div>

            {/* Accomplishments */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('accomplishments')}</span>
              </div>
              <p className="text-xs text-slate-300 ps-5 leading-relaxed bg-navy-950/40 p-2.5 rounded-lg border border-surface-border/60">
                {report.accomplishments}
              </p>
            </div>

            {/* Next Steps */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan mb-1">
                <ArrowRightCircle className="w-3.5 h-3.5" />
                <span>{t('nextSteps')}</span>
              </div>
              <p className="text-xs text-slate-300 ps-5 leading-relaxed bg-navy-950/40 p-2.5 rounded-lg border border-surface-border/60">
                {report.nextSteps}
              </p>
            </div>

            {/* Blockers */}
            {report.blockers && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t('blockers')}</span>
                </div>
                <p className="text-xs text-rose-300 ps-5 leading-relaxed bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  {report.blockers}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
