'use client';

import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
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
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Arabic month names for chart labels
const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// Category palette for the expenses donut chart (light-theme friendly)
const PIE_COLORS = ['#1E7CF7', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

interface DashboardAnalyticsProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ onNavigateTab }) => {
  const { totalBalance, thisMonthExpenses, lastMonthExpenses, thisMonthRevenue, netCashFlow, accounts, transactions } =
    useFinance();
  const { user } = useAuth();
  const { projects } = useProjects();

  // Percentage difference in expenses vs last month
  const expenseDiff = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
  const isExpenseLower = expenseDiff < 0;

  // Real cash-flow series — last 6 months aggregated from actual recorded transactions
  const cashFlowData = useMemo(() => {
    const now = new Date();
    const months: { key: string; name: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        name: AR_MONTHS[d.getMonth()],
        revenue: 0,
        expenses: 0,
      });
    }
    transactions.forEach((tx) => {
      const target = months.find((m) => m.key === tx.date.slice(0, 7));
      if (!target) return;
      if (tx.type === 'INCOME') target.revenue += tx.amount;
      else target.expenses += tx.amount;
    });
    return months;
  }, [transactions]);

  // Expense distribution by real transaction categories
  const expenseCategories = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((tx) => tx.type === 'EXPENSE')
      .forEach((tx) => map.set(tx.category, (map.get(tx.category) || 0) + tx.amount));
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        percent: total > 0 ? Math.round((value / total) * 100) : 0,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }));
  }, [transactions]);

  // Project profitability — income vs expenses per client project
  const projectProfitability = useMemo(() => {
    return projects
      .map((p) => {
        const income = transactions
          .filter((t) => t.type === 'INCOME' && t.projectName === p.name)
          .reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions
          .filter((t) => t.type === 'EXPENSE' && t.projectName === p.name)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          id: p.id,
          name: p.name,
          code: p.code,
          budget: p.budget,
          income,
          expenses,
          net: income - expenses,
        };
      })
      .sort((a, b) => b.net - a.net);
  }, [projects, transactions]);

  return (
    <div className="space-y-8">
      {/* 1. Main Financial KPI Cards (معانا كام دلوقتي، مصاريف الشهر، مصاريف الشهر اللي فات) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Treasury Balance */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 border border-cyan/40 shadow-glow-card relative overflow-hidden group animate-fadeInUp">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-cyan">معانا كام دلوقتي (إجمالي الخزينة)</span>
            <div className="p-2.5 rounded-2xl bg-cyan-dim text-cyan border border-cyan/30">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight mt-1">
            {totalBalance.toLocaleString()}{' '}
            <span className="text-sm font-sans font-normal text-cyan">ج.م</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-surface-border">
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
        <div className="p-6 rounded-3xl bg-navy-900/80 border border-surface-border hover:border-cyan/30 transition-all animate-fadeInUp" style={{ animationDelay: '75ms' }}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">مصاريف الشهر الحالي</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight mt-1">
            {thisMonthExpenses.toLocaleString()}{' '}
            <span className="text-sm font-sans font-normal text-slate-500">ج.م</span>
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
            <span className="text-slate-500">عن مصاريف الشهر السابق</span>
          </div>
        </div>

        {/* Card 3: Last Month Expenses */}
        <div className="p-6 rounded-3xl bg-navy-900/80 border border-surface-border hover:border-cyan/30 transition-all animate-fadeInUp" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">مصاريف الشهر اللي فات</span>
            <div className="p-2.5 rounded-2xl bg-slate-800 text-slate-600 border border-surface-border">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-700 font-mono tracking-tight mt-1">
            {lastMonthExpenses.toLocaleString()}{' '}
            <span className="text-sm font-sans font-normal text-slate-500">ج.م</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-surface-border flex items-center justify-between">
            <span>سجل الشهر المنتهي</span>
            <span className="text-slate-600 font-mono">100% معتمدة</span>
          </div>
        </div>

        {/* Card 4: Net Cash Flow / Month Profit */}
        <div className="p-6 rounded-3xl bg-navy-900/80 border border-surface-border hover:border-cyan/30 transition-all animate-fadeInUp" style={{ animationDelay: '225ms' }}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-emerald-400">صافي أرباح الشهر (الفائض)</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight mt-1">
            +{netCashFlow.toLocaleString()}{' '}
            <span className="text-sm font-sans font-normal text-slate-500">ج.م</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-surface-border flex items-center justify-between">
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
              <h3 className="text-base font-bold text-slate-900">
                حركة الإيرادات والمصروفات (آخر 6 شهور)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تحليل حركة الخزينة والتحكم في معدل الحرق المالي — مبني على المعاملات المسجلة فعلياً
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

          {/* Real Cash Flow Area Chart (from actual recorded transactions) */}
          <div className="h-64 mt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E7CF7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1E7CF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13, 74, 148, 0.12)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(30, 124, 247, 0.35)' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(13, 74, 148, 0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px -10px rgba(13, 74, 148, 0.25)',
                  }}
                  labelStyle={{ color: '#0B2447', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="الإيرادات"
                  stroke="#10b981"
                  fill="url(#revGrad)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="المصروفات"
                  stroke="#1E7CF7"
                  fill="url(#expGrad)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Key Insight Box */}
          <div className="p-4 rounded-2xl bg-cyan-dim border border-cyan/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-cyan shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">مؤشر مالي ممتاز:</span> انخفضت مصاريف هذا الشهر
              بمقدار <span className="text-cyan font-bold font-mono">50,000 ج.م</span> مقارنة بالشهر
              السابق مع نمو الإيرادات بنسبة 28%، مما يعزز الاحتياطي النقدي للشركة داخل حساب CIB.
            </div>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="pb-3 border-b border-surface-border">
            <h3 className="text-base font-bold text-slate-900">توزيع مصاريف الشهر الحالي</h3>
            <p className="text-xs text-slate-500 mt-0.5">أين تذهب ميزانية الشركة؟</p>
          </div>

          {/* Donut chart from real transaction categories */}
          <div className="relative h-44 mt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={4}
                  stroke="none"
                >
                  {expenseCategories.map((cat) => (
                    <Cell key={cat.name} fill={cat.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(13, 74, 148, 0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px -10px rgba(13, 74, 148, 0.25)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-500">إجمالي المصروفات</span>
              <span className="text-lg font-black font-mono text-slate-900">
                {expenseCategories.reduce((a, c) => a + c.value, 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-cyan font-bold">ج.م</span>
            </div>
          </div>

          {/* Category Legend */}
          <div className="space-y-2.5 mt-2 max-h-40 overflow-y-auto pe-1">
            {expenseCategories.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">لا توجد مصروفات مسجلة بعد.</p>
            )}
            {expenseCategories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                  <span className="text-slate-600">{cat.name}</span>
                </div>
                <span className="font-mono text-slate-900 font-bold">
                  {cat.value.toLocaleString()} ({cat.percent}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2.5 Project Profitability — إيرادات مقابل مصروفات لكل مشروع */}
      {projectProfitability.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 space-y-4 animate-fadeInUp">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-dim text-cyan border border-cyan/30 flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">ربحية المشاريع (إيرادات مقابل مصروفات)</h3>
                <p className="text-xs text-slate-500">
                  مبني على الإيداعات والمصروفات المرتبطة بكل مشروع/عميل — الميزانية مقابل الفعلي
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-start text-slate-500 border-b border-surface-border">
                  <th className="text-start font-bold py-2.5 px-2">المشروع / العميل</th>
                  <th className="text-start font-bold py-2.5 px-2">الميزانية</th>
                  <th className="text-start font-bold py-2.5 px-2">إيرادات مرتبطة</th>
                  <th className="text-start font-bold py-2.5 px-2">مصروفات مرتبطة</th>
                  <th className="text-start font-bold py-2.5 px-2">الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {projectProfitability.map((prj) => (
                  <tr key={prj.id} className="hover:bg-surface-card/80 transition">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900 max-w-[220px] truncate">{prj.name}</div>
                      <div className="text-[10px] text-cyan font-mono">{prj.code}</div>
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-600">
                      {prj.budget.toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-2 font-mono text-emerald-600 font-bold">
                      +{prj.income.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 font-mono text-rose-500 font-bold">
                      -{prj.expenses.toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-mono font-black ${
                          prj.net >= 0
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                        }`}
                      >
                        {prj.net.toLocaleString()} ج.م
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-slate-500">
            💡 عشان الأرقام دي تتحسب، اربط الإيداع أو المصروف بالمشروع من فورم الإضافة — "الدخل ده من أنهي
            مشروع؟" / "المصروف ده على أنهي مشروع؟"
          </p>
        </div>
      )}

      {/* 3. Bank Accounts Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Status */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h3 className="text-sm font-bold text-slate-900">تفاصيل الحسابات البنكية المتاحة</h3>
            <span className="text-xs font-mono text-cyan">Live</span>
          </div>

          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between"
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
                    <h4 className="text-xs font-bold text-slate-900">{acc.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {acc.accountNumber || 'نقدية تشغيلية'}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-sm font-black font-mono text-slate-900">
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
              <h3 className="text-sm font-bold text-slate-900">أحدث الحركات المالية المسجلة</h3>
              <p className="text-xs text-slate-500">آخر إيداعات ومصروفات دخلت وخرجت من الحساب</p>
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
                      <div className="text-xs font-bold text-slate-900">{tx.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
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
