'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck, RefreshCw, Wallet, Lock } from 'lucide-react';

type VoteDecision = 'APPROVE' | 'REJECT' | 'ABSTAIN';

interface PendingExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  requester: string;
  date: string;
  description: string;
  /** key = partner userId (from the API), value = cast decision */
  votes: Partial<Record<string, VoteDecision>>;
}

interface ApiPartner {
  userId: string;
  fullName: string;
  email: string;
  title: string;
  ownership: number;
}

export const PartnerApprovalWidget: React.FC = () => {
  const { t } = useLanguage();
  const { user, isLiveMode } = useAuth();

  const [expenses, setExpenses] = useState<PendingExpense[]>([]);
  const [partners, setPartners] = useState<ApiPartner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [votingTxId, setVotingTxId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isLiveMode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const [txs, parts] = await Promise.all([
        api<any[]>('/finance/pending-expenses'),
        api<any[]>('/partners'),
      ]);

      setExpenses(
        txs.map((tx) => ({
          id: tx.id,
          title: (tx.description || '').split(' — ')[0] || 'مصروف شركة',
          amount: Number(tx.amount),
          category: tx.category?.name || 'غير مصنف',
          requester: tx.createdBy?.fullName || '—',
          date: (tx.transactionDate || '').slice(0, 10),
          description: tx.description || '',
          votes: Object.fromEntries(
            (tx.approvals || []).map((a: any) => [a.partner?.member?.user?.id, a.decision]),
          ) as Partial<Record<string, VoteDecision>>,
        })),
      );

      setPartners(
        parts.map((p) => ({
          userId: p.userId,
          fullName: p.fullName,
          email: p.email,
          title: p.title || 'Founding Partner',
          ownership: p.ownership ?? 25,
        })),
      );
    } catch (e: any) {
      setErrorMessage(e?.message || 'تعذر تحميل المصروفات المعلقة');
    } finally {
      setLoading(false);
    }
  }, [isLiveMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const castVote = async (transactionId: string, decision: 'APPROVE' | 'REJECT') => {
    setVotingTxId(transactionId);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const result = await api<any>(`/finance/transactions/${transactionId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });

      const status = result?.evaluation?.status || result?.transaction?.approvalStatus;
      if (status === 'APPROVED') {
        setStatusMessage('🎉 تم اعتماد المصروف بإجماع الشركاء الأربعة (4/4) — سينعكس على الرصيد فوراً.');
      } else if (status === 'REJECTED') {
        setStatusMessage('تم رفض المصروف — صوت واحد بالرفض يلغي الاعتماد نهائياً.');
      } else {
        setStatusMessage('تم تسجيل صوتك بنجاح — في انتظار باقي الشركاء.');
      }

      await loadData();
    } catch (e: any) {
      setErrorMessage(e?.message || 'فشل تسجيل التصويت');
    } finally {
      setVotingTxId(null);
    }
  };

  /* ---------- OFFLINE / DEMO MODE ---------- */
  if (!isLiveMode) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">نظام الاعتماد بإجماع الشركاء (4/4)</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          النظام شغال حالياً في <span className="text-amber-400 font-bold">وضع تجريبي محلي</span> بدون
          اتصال بالسيرفر. عشان الاعتمادات الحقيقية بإجماع الشركاء الأربعة تشتغل (كل شريك يصوت من
          حسابه والحسابات بتتحدث للكل)، شغّل النظام على السيرفر بالدليل المرفق (DEPLOY.md).
        </p>
      </div>
    );
  }

  /* ---------- LIVE MODE ---------- */
  return (
    <div className="space-y-6">
      {/* Status / Error messages */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-cyan-dim border border-cyan/40 text-cyan text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-cyan/70 hover:text-cyan">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-300/70 hover:text-rose-300">✕</button>
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-cyan animate-spin" />
          <p className="text-xs text-slate-500">جاري تحميل المصروفات المعلقة من السيرفر...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">لا توجد مصروفات مستنية اعتماد</h3>
          <p className="text-xs text-slate-500">
            أي مصروف جديد يتسجل من صفحة "المالية والخزينة" هيظهر هنا فوراً لاعتماد الشركاء الأربعة.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {expenses.map((expense) => {
            const voteEntries = Object.values(expense.votes);
            const approveCount = voteEntries.filter((v) => v === 'APPROVE').length;
            const rejectCount = voteEntries.filter((v) => v === 'REJECT').length;
            const isVoting = votingTxId === expense.id;

            return (
              <div key={expense.id} className="glass-panel-cyan rounded-2xl p-6 relative overflow-hidden animate-fadeInUp">
                {/* Decorative background glow */}
                <div className="absolute top-0 end-0 -mt-8 -me-8 w-48 h-48 rounded-full bg-cyan/10 blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-dim text-cyan border border-cyan/40">
                        {approveCount}/4 موافقات
                      </span>
                      <span className="text-xs text-slate-500">• {expense.category}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-wide">{expense.title}</h2>
                    <p className="text-xs text-slate-600 mt-1">
                      {expense.description} — طلبه: <span className="font-bold">{expense.requester}</span> • {expense.date}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-end shrink-0">
                    <div className="text-2xl font-black text-cyan font-mono">
                      {expense.amount.toLocaleString()}{' '}
                      <span className="text-sm font-sans font-normal text-slate-500">{t('currencyEGP')}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {rejectCount > 0 ? 'مرفوض' : 'قيد اعتماد الشركاء'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unanimous rule reminder */}
                <div className="py-4 flex items-center gap-2 text-[11px] text-slate-500 border-b border-surface-border">
                  <Lock className="w-3.5 h-3.5 text-cyan shrink-0" />
                  <span>
                    قاعدة الإجماع الإلزامية: اعتماد المصروف يتطلب{' '}
                    <span className="text-cyan font-bold">موافقة 4 من 4 شركاء</span> — أي اعتراض واحد يرفضه نهائياً.
                  </span>
                </div>

                {/* Partner vote cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {partners.map((partner) => {
                    const vote: VoteDecision | 'PENDING' = expense.votes[partner.userId] ?? 'PENDING';
                    const isCurrentActive = user?.id === partner.userId;
                    const initials = partner.fullName
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={partner.userId}
                        className={`relative p-4 rounded-2xl border transition-all ${
                          isCurrentActive
                            ? 'bg-cyan-dim border-cyan/50 shadow-glow-cyan'
                            : 'bg-surface-card border border-surface-border'
                        }`}
                      >
                        {isCurrentActive && (
                          <span className="absolute -top-2 start-1/2 -translate-x-1/2 text-[10px] font-bold text-cyan bg-cyan-dim px-2 py-0.5 rounded-full border border-cyan/30">
                            حسابك
                          </span>
                        )}

                        <div className="flex items-center justify-center mb-2">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                              vote === 'APPROVE'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                                : vote === 'REJECT'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
                                  : 'bg-navy-900 text-cyan border border-surface-border'
                            }`}
                          >
                            {initials}
                          </div>
                        </div>

                        <div className="truncate mb-3 text-center">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">{partner.fullName}</h4>
                          <p className="text-[10px] text-cyan font-mono">{partner.title.split('&')[0]}</p>
                        </div>

                        {/* Current vote state */}
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
                            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold border border-slate-300">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              <span>قيد الانتظار</span>
                            </div>
                          )}
                        </div>

                        {/* Vote actions — only for the logged-in partner */}
                        <div className="mt-3 pt-3 border-t border-surface-border/60">
                          {isCurrentActive ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                disabled={isVoting}
                                onClick={() => castVote(expense.id, 'APPROVE')}
                                className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 ${
                                  vote === 'APPROVE'
                                    ? 'bg-emerald-500 text-navy-950 font-black'
                                    : 'bg-navy-950 text-slate-600 hover:text-emerald-400 hover:border-emerald-500/40 border border-surface-border'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                موافقة
                              </button>
                              <button
                                disabled={isVoting}
                                onClick={() => castVote(expense.id, 'REJECT')}
                                className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50 ${
                                  vote === 'REJECT'
                                    ? 'bg-rose-500 text-slate-900 font-black'
                                    : 'bg-navy-950 text-slate-600 hover:text-rose-400 hover:border-rose-500/40 border border-surface-border'
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

                {isVoting && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-cyan">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    جاري تسجيل صوتك على السيرفر...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
