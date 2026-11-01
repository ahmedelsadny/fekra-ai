'use client';

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, AUTHORIZED_PARTNERS } from '../context/AuthContext';
import { CheckCircle2, XCircle, AlertCircle, Lock, ShieldCheck } from 'lucide-react';

type VoteType = 'APPROVE' | 'REJECT' | 'PENDING';

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  requester: string;
  date: string;
  invoiceRef: string;
  description: string;
  votes: Record<string, VoteType>;
}

export const PartnerApprovalWidget: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const activePartner = user || AUTHORIZED_PARTNERS[0];

  const [expense, setExpense] = useState<ExpenseItem>({
    id: 'tx-2026-089',
    title: 'Cloud Infrastructure & High-Compute AI Cluster (AWS & RunPod)',
    amount: 145000,
    category: 'Cloud Infrastructure & Servers',
    requester: 'Engineering Unit (BU-AI)',
    date: '2026-11-01',
    invoiceRef: 'INV-AWS-2026-10-88',
    description: 'Quarterly dedicated GPU cluster allocation for model training and production inference servers.',
    votes: {
      p1: 'APPROVE', // Mahmoud Ashraf
      p2: 'APPROVE', // Ahmed Elsadny
      p3: 'PENDING', // Ahmed Fouda
      p4: 'PENDING', // Mohamed Monem
    },
  });

  const castVote = (decision: VoteType) => {
    setExpense((prev) => ({
      ...prev,
      votes: {
        ...prev.votes,
        [activePartner.id]: decision,
      },
    }));
  };

  // Evaluate the Unanimous 4-Partner Rule
  const voteEntries = Object.values(expense.votes);
  const approveCount = voteEntries.filter((v) => v === 'APPROVE').length;
  const rejectCount = voteEntries.filter((v) => v === 'REJECT').length;
  const pendingCount = voteEntries.filter((v) => v === 'PENDING').length;

  const isRejected = rejectCount > 0;
  const isUnanimouslyApproved = approveCount === 4;
  const isPending = !isRejected && !isUnanimouslyApproved;

  return (
    <div className="glass-panel-cyan rounded-2xl p-6 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 end-0 -mt-8 -me-8 w-48 h-48 rounded-full bg-cyan/10 blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-dim text-cyan border border-cyan/40">
              {expense.invoiceRef}
            </span>
            <span className="text-xs text-slate-400">• {expense.category}</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">{expense.title}</h2>
          <p className="text-xs text-slate-300 mt-1">{expense.description}</p>
        </div>

        {/* Amount & Unanimous Status Badge */}
        <div className="text-end shrink-0">
          <div className="text-2xl font-black text-cyan font-mono">
            {expense.amount.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">{t('currencyEGP')}</span>
          </div>

          <div className="mt-2 inline-flex items-center gap-2">
            {isUnanimouslyApproved && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('unanimousApprovedBadge')}
              </span>
            )}
            {isRejected && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                {t('rejectedBadge')}
              </span>
            )}
            {isPending && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('pendingVoteBadge')} ({approveCount}/4)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Unanimous Rule Info Banner */}
      <div className="my-5 p-3 rounded-xl bg-navy-950/80 border border-cyan/20 flex items-start gap-3">
        <Lock className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white">{t('unanimousRule')}</span>
        </div>
      </div>

      {/* 4 Partners Voting Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {AUTHORIZED_PARTNERS.map((partner) => {
          const vote = expense.votes[partner.id];
          const isCurrentActive = activePartner.id === partner.id;

          return (
            <div
              key={partner.id}
              className={`p-4 rounded-xl border transition-all duration-200 relative flex flex-col justify-between ${
                isCurrentActive
                  ? 'bg-navy-800/90 border-cyan shadow-glow-cyan'
                  : 'bg-navy-900/60 border-surface-border'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-950 border border-surface-border flex items-center justify-center text-xl shadow-inner">
                    {partner.avatar}
                  </div>
                  {isCurrentActive && (
                    <span className="text-[10px] font-bold text-cyan bg-cyan-dim px-2 py-0.5 rounded-full border border-cyan/30">
                      حسابك
                    </span>
                  )}
                </div>

                <div className="truncate mb-3">
                  <h4 className="text-xs font-bold text-white leading-tight truncate">{partner.name}</h4>
                  <p className="text-[10px] text-cyan font-mono">{partner.ownership} • {partner.role.split('&')[0]}</p>
                </div>

                {/* Current Vote Display */}
                <div className="my-2">
                  {vote === 'APPROVE' && (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تمت الموافقة</span>
                    </div>
                  )}
                  {vote === 'REJECT' && (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/30">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>تم الرفض</span>
                    </div>
                  )}
                  {vote === 'PENDING' && (
                    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/80 text-slate-400 text-xs font-bold border border-slate-700">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>قيد الانتظار</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vote Actions: ONLY available for the logged-in partner */}
              <div className="mt-3 pt-3 border-t border-surface-border/60">
                {isCurrentActive ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => castVote('APPROVE')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        vote === 'APPROVE'
                          ? 'bg-emerald-500 text-navy-950 font-black'
                          : 'bg-navy-950 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 border border-surface-border'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      موافقة
                    </button>
                    <button
                      onClick={() => castVote('REJECT')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        vote === 'REJECT'
                          ? 'bg-rose-500 text-white font-black'
                          : 'bg-navy-950 text-slate-300 hover:text-rose-400 hover:border-rose-500/40 border border-surface-border'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      رفض
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-1.5 text-[10px] text-slate-500">
                    تصويت حصري للشريك
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
