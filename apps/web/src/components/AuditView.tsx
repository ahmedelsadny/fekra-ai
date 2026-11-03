'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  ScrollText,
  RefreshCw,
  ShieldCheck,
  Clock,
  Inbox,
  Activity,
} from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  actor?: { fullName?: string } | null;
  newValues?: Record<string, unknown> | null;
  createdAt: string;
}

/** Human-friendly labels for audit actions */
const ACTION_LABELS: Record<string, string> = {
  FINANCE_DEPOSIT_CREATED: 'إيداع مالي جديد 💰',
  FINANCE_EXPENSE_SUBMITTED: 'تسجيل مصروف للاعتماد 🧾',
  FINANCE_EXPENSE_VOTE: 'تصويت شريك على مصروف 🗳️',
  PROJECT_CREATED: 'إنشاء مشروع جديد 📁',
  TASK_CREATED: 'إنشاء مهمة جديدة ✅',
  TASK_STATUS_UPDATED: 'تحديث حالة مهمة 🔄',
};

const ENTITY_LABELS: Record<string, string> = {
  Transaction: 'معاملة مالية',
  Project: 'مشروع',
  Task: 'مهمة',
};

export const AuditView: React.FC = () => {
  const { isLiveMode } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api<AuditEntry[]>('/audit?take=100')
      .then((list) => setEntries(list))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isLiveMode) load();
    else setLoading(false);
  }, [isLiveMode, load]);

  /* ---------- OFFLINE / DEMO MODE ---------- */
  if (!isLiveMode) {
    return (
      <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-14 h-14 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
          <ScrollText className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">سجل التدقيق — Audit Trail</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md">
          سجل التدقيق بيشتغل مع قاعدة البيانات الحقيقية: كل حركة (إيداع، مصروف، تصويت، مشروع، مهمة)
          بتتسجل فيها باسم اللي عملها والوقت والتفاصيل. من غير السيرفر مفيش سجل ممكن يظهر — ارفع النظام
          على السيرفر وكل حاجة هتتسجل تلقائياً هنا.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-dim border border-cyan/40 text-cyan flex items-center justify-center">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">سجل التدقيق — مين عمل إيه وإمتى</h3>
            <p className="text-xs text-slate-500">
              سجل دائم وغير قابل للتعديل لكل الحركات المالية والمشاريع والمهام والتصويتات
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            {entries.length} حركة مسجلة
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="p-2.5 rounded-xl bg-surface-card border border-surface-border text-cyan hover:border-cyan/50 transition disabled:opacity-50"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="glass-panel rounded-3xl p-14 flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-cyan animate-spin" />
          <p className="text-xs text-slate-500">جاري تحميل السجل من السيرفر...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-panel rounded-3xl p-14 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-3xl bg-cyan-dim border border-cyan/30 text-cyan flex items-center justify-center">
            <Inbox className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">السجل فاضي لسه</h4>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            أول ما حد يعمل إيداع أو يسجل مصروف أو يصوّت أو ينشئ مشروع أو مهمة — الحركة هتظهر هنا فوراً
            بالتفاصيل الكاملة.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-card text-slate-500 border-b border-surface-border">
                  <th className="text-start font-bold py-3 px-4">الوقت</th>
                  <th className="text-start font-bold py-3 px-4">مين</th>
                  <th className="text-start font-bold py-3 px-4">الحدث</th>
                  <th className="text-start font-bold py-3 px-4">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-card/70 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(entry.createdAt).toLocaleString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-navy-800 text-cyan border border-surface-border flex items-center justify-center font-mono font-bold text-[10px]">
                          {(entry.actor?.fullName || '؟')
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <span className="font-bold text-slate-900">{entry.actor?.fullName || 'النظام'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-dim text-cyan border border-cyan/30 font-bold whitespace-nowrap">
                        <Activity className="w-3 h-3" />
                        {ACTION_LABELS[entry.action] || entry.action}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {ENTITY_LABELS[entry.entityType] || entry.entityType}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <code
                        dir="ltr"
                        className="text-[10px] text-slate-600 font-mono bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 block max-w-[260px] truncate"
                      >
                        {entry.newValues ? JSON.stringify(entry.newValues) : '—'}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

