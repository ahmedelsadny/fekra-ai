'use client';

import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface DashboardAnalyticsProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ onNavigateTab }) => {
  const { totalBalance, thisMonthExpenses, lastMonthExpenses, thisMonthRevenue, netCashFlow, accounts, transactions } =
    useFinance();
  const { user } = useAuth();

  // Percentage difference in expenses vs last month
  const expenseDiff = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
  const isExpenseLower = expenseDiff < 0;

  return (
    <div className="space-y-8">
      {/* 1. Main Financial KPI Cards (معانا كام دلوقتي، مصاريف الشهر، مصاريف الشهر اللي فات) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Treasury Balance */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 border border-cyan/40 shadow-glow-card relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-cyan">معانا كام دلوقتي (إجمالي الخزينة)</span>
            <div className="p-2.5 rounded-2xl bg-cyan-dim text-cyan border border-cyan/30">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight mt-1">
            {totalBalance.toLocaleString()}{' '}
            <span className="text-sm font-sans font-normal text-cyan">ج.م</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-surface-border">
            <span>موزعة على {accounts.length} حسابات</span>
            <button
              onClick={() => onNavigateTab('finance')}
              className="text-cyan hover:underline font-bold flex items-center gap-1"
            >
              عرض الحسابات <ArrowRight className="w-3 h-3 rotate-180" />
            </button>
          </div>
        </div>

        {/* Card 2: This Month Expenses */}
        <div className="p-6 rounded-3xl bg-navy-900/80 border border-surface-border hover:border-cyan/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-200">مصاريف الشهر الحالي</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight mt-1">
            {thisMonthExpenses.toLocaleString()}{' '}
            <span className="text-sm font-sans font-normal text-slate-400">ج.م</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] pt-2 border-t border-surface-border">
            <span
              className={`font-mono font-bold flex items-center ${
                isExpenseLower ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isExpenseLower ? 'انخفاض ' : 'ارتفاع '}
              {Math.abs(expenseDiff).toFixed(1)}%
            </span>
            <span className="text-slate-400">عن مصاريف الشهر السابق</span>
          </div>
        </div>

        {/* Card 3: Last Month Expenses */}
        <div className="p-6 rounded-3xl bg-navy-900/80 border border-surface-border hover:border-cyan/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-200">مصاريف الشهر اللي فات</span>
            <div className="p-2.5 rounded-2xl bg-slate-800 text-slate-300 border border-surface-border">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-200 font-mono tracking-tight mt-1">
            {lastMonthExpenses.toLocaleString()}{' '}
            <span className="text-sm font-sans font-normal text-slate-400">ج.م</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 pt-2 border-t border-surface-border flex items-center justify-between">
            <span>سجل الشهر المنتهي</span>
            <span className="text-slate-300 font-mono">100% معتمدة</span>
          </div>
        </div>

        {/* Card 4: Net Cash Flow / Month Profit */}
        <div className="p-6 rounded-3xl bg-navy-900/80 border border-surface-border hover:border-cyan/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-emerald-400">صافي أرباح الشهر (الفائض)</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight mt-1">
            +{netCashFlow.toLocaleString()}{' '}
            <span className="text-sm font-sans font-normal text-slate-400">ج.م</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 pt-2 border-t border-surface-border flex items-center justify-between">
            <span>إيرادات: {thisMonthRevenue.toLocaleString()} ج.م</span>
            <span className="text-emerald-400 font-bold font-mono">فائض نقدي إيجابي</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Expense Comparison & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Comparison Graph Bar */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div>
              <h3 className="text-base font-bold text-white">
                مقارنة المصروفات والإيرادات (الشهر الحالي vs السابق)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحليل حركة الخزينة والتحكم في معدل الحرق المالي
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('finance')}
              className="text-xs font-bold text-cyan hover:underline flex items-center gap-1"
            >
              <span>إدارة المالية</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          {/* Visual Comparison Bars */}
          <div className="space-y-4">
            {/* This Month Revenue */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <span className="text-emerald-400">إيرادات الشهر الحالي</span>
                <span className="font-mono text-white">480,000 ج.م</span>
              </div>
              <div className="w-full h-3 rounded-full bg-navy-950 overflow-hidden border border-surface-border">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: '85%' }}
                ></div>
              </div>
            </div>

            {/* This Month Expenses */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <span className="text-cyan">مصاريف الشهر الحالي</span>
                <span className="font-mono text-white">145,000 ج.م</span>
              </div>
              <div className="w-full h-3 rounded-full bg-navy-950 overflow-hidden border border-surface-border">
                <div
                  className="h-full bg-gradient-to-r from-cyan to-electric-600 rounded-full transition-all duration-500"
                  style={{ width: '38%' }}
                ></div>
              </div>
            </div>

            {/* Last Month Expenses */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <span className="text-slate-400">مصاريف الشهر اللي فات</span>
                <span className="font-mono text-slate-300">195,000 ج.م</span>
              </div>
              <div className="w-full h-3 rounded-full bg-navy-950 overflow-hidden border border-surface-border">
                <div
                  className="h-full bg-slate-600 rounded-full transition-all duration-500"
                  style={{ width: '51%' }}
                ></div>
              </div>
            </div>
          </div>

          {/* Key Insight Box */}
          <div className="p-4 rounded-2xl bg-cyan-dim border border-cyan/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-cyan shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200 leading-relaxed">
              <span className="font-bold text-white">مؤشر مالي ممتاز:</span> انخفضت مصاريف هذا الشهر
              بمقدار <span className="text-cyan font-bold font-mono">50,000 ج.م</span> مقارنة بالشهر
              السابق مع نمو الإيرادات بنسبة 28%، مما يعزز الاحتياطي النقدي للشركة داخل حساب CIB.
            </div>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="pb-3 border-b border-surface-border">
            <h3 className="text-base font-bold text-white">توزيع مصاريف الشهر الحالي</h3>
            <p className="text-xs text-slate-400 mt-0.5">أين تذهب ميزانية الشركة؟</p>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">سيرفرات ومعالجات AI</span>
                <span className="font-mono text-white font-bold">85,000 ج.م (58%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden">
                <div className="h-full bg-cyan rounded-full" style={{ width: '58%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">تشغيل ومقر الشركة</span>
                <span className="font-mono text-white font-bold">35,000 ج.م (24%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden">
                <div className="h-full bg-electric-500 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">تراخيص برمجيات وأدوات</span>
                <span className="font-mono text-white font-bold">15,000 ج.م (10%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">تسويق ومصروفات أخرى</span>
                <span className="font-mono text-white font-bold">10,000 ج.م (8%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bank Accounts Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Status */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="text-sm font-bold text-white">تفاصيل الحسابات البنكية المتاحة</h3>
            <span className="text-xs font-mono text-cyan">Live</span>
          </div>

          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-navy-950/80 border border-surface-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-navy-900 border border-surface-border flex items-center justify-center text-cyan">
                    {acc.type === 'BANK' ? (
                      <CreditCard className="w-5 h-5 text-electric-500" />
                    ) : (
                      <Wallet className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{acc.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {acc.accountNumber || 'نقدية تشغيلية'}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-sm font-black font-mono text-white">
                    {acc.balance.toLocaleString()} {acc.currency}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('finance')}
            className="w-full electric-gradient-btn py-2.5 rounded-xl text-xs font-black shadow-glow-cyan flex items-center justify-center gap-2 mt-2"
          >
            <span>+ إيداع رصيد جديد في حسابنا</span>
          </button>
        </div>

        {/* Recent Financial Transactions Feed */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <h3 className="text-sm font-bold text-white">أحدث الحركات المالية المسجلة</h3>
              <p className="text-xs text-slate-400">آخر إيداعات ومصروفات دخلت وخرجت من الحساب</p>
            </div>
            <button
              onClick={() => onNavigateTab('finance')}
              className="text-xs font-bold text-cyan hover:underline flex items-center gap-1"
            >
              <span>عرض كشف الحساب الكامل</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          <div className="divide-y divide-surface-border/50">
            {transactions.slice(0, 4).map((tx) => {
              const isIncome = tx.type === 'INCOME';
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{tx.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {tx.date} • {tx.accountName}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span
                      className={`text-xs font-mono font-black ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {tx.amount.toLocaleString()} {tx.currency}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
