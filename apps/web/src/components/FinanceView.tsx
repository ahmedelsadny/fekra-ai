'use client';

import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  Building,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  TrendingUp,
  Receipt,
  AlertCircle,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { accounts, totalBalance, transactions, addDeposit, addExpense } = useFinance();
  const { user } = useAuth();

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccount, setDepositAccount] = useState('acc-cib');
  const [depositSource, setDepositSource] = useState('');
  const [depositCategory, setDepositCategory] = useState('عقود برمجيات وحلول ذكية');
  const [depositNotes, setDepositNotes] = useState('');

  // Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseAccount, setExpenseAccount] = useState('acc-cib');
  const [expenseCategory, setExpenseCategory] = useState('سيرفرات وبنية تحتية');
  const [expenseDesc, setExpenseDesc] = useState('');

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(depositAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    addDeposit({
      amount: parsedAmount,
      accountId: depositAccount,
      source: depositSource || 'إيداع رصيد جديد',
      category: depositCategory,
      description: depositNotes,
      createdBy: user?.name || 'أحد الشركاء',
    });

    setSuccessMessage(`تم إضافة مبلغ ${parsedAmount.toLocaleString()} ج.م إلى رصيد الخزينة بنجاح!`);
    setDepositAmount('');
    setDepositSource('');
    setDepositNotes('');
    setIsDepositModalOpen(false);

    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    addExpense({
      amount: parsedAmount,
      accountId: expenseAccount,
      title: expenseTitle,
      category: expenseCategory,
      description: expenseDesc,
      requester: user?.name || 'طلب مصروف جديد',
    });

    setSuccessMessage(`تم تسجيل المصروف بمبلغ ${parsedAmount.toLocaleString()} ج.م وإحالته لاعتماد الشركاء.`);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseDesc('');
    setIsExpenseModalOpen(false);

    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter = filterType === 'ALL' || tx.type === filterType;
    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sourceOrRequester.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Treasury Summary */}
      <div className="glass-panel-cyan rounded-3xl p-6 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-dim text-cyan border border-cyan/40 text-xs font-bold mb-2">
            <Building className="w-3.5 h-3.5" />
            <span>إدارة المالية والخزينة المركزية</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-wide">الخزينة والحسابات البنكية</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            متابعة دقيقة وفورية للأرصدة النقدية في البنك والخزينة، وتسجيل إيداعات الإيرادات والمصروفات.
          </p>
        </div>

        {/* Action Buttons: Add Deposit & Register Expense */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="electric-gradient-btn px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-glow-cyan"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إيداع رصيد جديد في حسابنا</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-navy-900 hover:bg-navy-800 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 text-xs font-bold transition flex items-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>تسجيل مصروف جديد</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Accounts Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Treasury */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 border border-cyan/40 shadow-glow-card relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-cyan">إجمالي رصيد الشركة (معانا كام دلوقتي)</span>
            <Wallet className="w-5 h-5 text-cyan" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {totalBalance.toLocaleString()} <span className="text-sm font-sans font-normal text-cyan">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            مجموع الرصيد المتاح حالياً في البنك والخزينة
          </p>
        </div>

        {/* Bank Account (CIB) */}
        {accounts.map((acc) => (
          <div key={acc.id} className="p-6 rounded-2xl bg-navy-900/80 border border-surface-border">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-slate-200">{acc.name}</span>
              {acc.type === 'BANK' ? (
                <CreditCard className="w-5 h-5 text-electric-500" />
              ) : (
                <Wallet className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {acc.balance.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">{acc.currency}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              {acc.accountNumber ? `رقم الحساب: ${acc.accountNumber}` : 'نقدية تشغيلية داخل المقر'}
            </p>
          </div>
        ))}
      </div>

      {/* Transactions History Header & Filters */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <h3 className="text-base font-bold text-white">سجل العمليات والإيداعات المالية</h3>
            <p className="text-xs text-slate-400">كشف حساب مباشر لجميع الإيداعات والمصروفات المسجلة</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center bg-navy-950 p-1 rounded-xl border border-surface-border text-xs font-bold">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterType === 'ALL' ? 'bg-cyan text-navy-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل ({transactions.length})
              </button>
              <button
                onClick={() => setFilterType('INCOME')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterType === 'INCOME' ? 'bg-emerald-500 text-navy-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                إيداعات وإيرادات
              </button>
              <button
                onClick={() => setFilterType('EXPENSE')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterType === 'EXPENSE' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                مصروفات
              </button>
            </div>

            {/* Search */}
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في السجل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-950 border border-surface-border rounded-xl ps-8 pe-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan/50"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-surface-border/60 text-slate-400 font-bold">
                <th className="py-3 px-3 text-start">العملية / البيان</th>
                <th className="py-3 px-3 text-start">الحساب المودع فيه / المصروف منه</th>
                <th className="py-3 px-3 text-start">التصنيف</th>
                <th className="py-3 px-3 text-start">التاريخ</th>
                <th className="py-3 px-3 text-end">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/40">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                return (
                  <tr key={tx.id} className="hover:bg-navy-800/40 transition">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{tx.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            المصدر: <span className="text-slate-300">{tx.sourceOrRequester}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">{tx.accountName}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-navy-950 text-slate-300 border border-surface-border text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">{tx.date}</td>
                    <td className="py-3.5 px-3 text-end">
                      <span
                        className={`font-black font-mono text-sm ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {tx.amount.toLocaleString()} {tx.currency}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Deposit New Funds */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel-cyan rounded-3xl p-6 w-full max-w-lg border border-cyan/40 shadow-glow-card animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan" />
                <h3 className="text-base font-bold text-white">إيداع رصيد جديد في حسابنا</h3>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المبلغ المودع (بالجنيه المصري) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="مثال: 150000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الحساب المودع فيه *
                </label>
                <select
                  value={depositAccount}
                  onChange={(e) => setDepositAccount(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (الرصيد الحالي: {acc.balance.toLocaleString()} {acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المصدر / اسم العميل أو الشريك المودع *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دفعة تعاقد شركة كذا / إيداع شريك..."
                  value={depositSource}
                  onChange={(e) => setDepositSource(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">بند الإيراد</label>
                <select
                  value={depositCategory}
                  onChange={(e) => setDepositCategory(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan"
                >
                  <option value="عقود برمجيات وحلول ذكية">عقود برمجيات وحلول ذكية</option>
                  <option value="استشارات رقمية وتطوير أعمال">استشارات رقمية وتطوير أعمال</option>
                  <option value="زيادة رأس مال واستثمار شركاء">زيادة رأس مال واستثمار شركاء</option>
                  <option value="إيرادات أخرى متنوعة">إيرادات أخرى متنوعة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ملاحظات أو تفاصيل الدفعة (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="أي تفاصيل أو رقم إيصال تحويل..."
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="electric-gradient-btn px-6 py-2.5 rounded-xl text-xs font-black shadow-glow-cyan"
                >
                  تأكيد الإيداع وإضافة الرصيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register New Expense */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 w-full max-w-lg border border-rose-500/40 shadow-glow-card animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">تسجيل مصروف جديد للاعتماد</h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  عنوان المصروف / البيان *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شراء تراخيص برمجيات / صيانة خوادم..."
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المبلغ (بالجنيه المصري) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="مثال: 45000"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  التصنيف المحاسبي *
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                >
                  <option value="سيرفرات وبنية تحتية">سيرفرات وبنية تحتية</option>
                  <option value="مرتبات ومكافآت هندسية">مرتبات ومكافآت هندسية</option>
                  <option value="تشغيل ومقر الشركة">تشغيل ومقر الشركة</option>
                  <option value="تسويق وإعلانات">تسويق وإعلانات</option>
                  <option value="قانوني وتراخيص">قانوني وتراخيص</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الوصف وسبب الصرف *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="تفاصيل الاحتياج والمستفيد..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                ></textarea>
              </div>

              <div className="p-3 rounded-xl bg-navy-950 border border-surface-border text-[11px] text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-cyan shrink-0" />
                <span>سيتم إحالة المصروف مباشرة لصفحة اعتمادات الشركاء للتصويت عليه.</span>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl text-xs font-black transition"
                >
                  إرسال المصروف للاعتماد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
