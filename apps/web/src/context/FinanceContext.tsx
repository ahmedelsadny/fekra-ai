'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'BANK' | 'CASH';
  accountNumber?: string;
  balance: number;
  currency: string;
}

export interface TransactionRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  title: string;
  amount: number;
  currency: string;
  accountId: string;
  accountName: string;
  category: string;
  sourceOrRequester: string;
  date: string;
  description?: string;
  status: 'COMPLETED' | 'PENDING_APPROVAL';
  /** Linked project for incomes coming from a specific client project */
  projectId?: string;
  projectName?: string;
}

export interface FinancialCategoryOption {
  id: string;
  name: string;
  transactionType: string;
}

interface FinanceContextType {
  accounts: FinancialAccount[];
  totalBalance: number;
  thisMonthExpenses: number;
  lastMonthExpenses: number;
  thisMonthRevenue: number;
  netCashFlow: number;
  transactions: TransactionRecord[];
  /** True when data is served live from the backend API. */
  isLiveMode: boolean;
  /** Financial categories from the backend (for deposit/expense pickers). */
  categories: FinancialCategoryOption[];
  /** Re-hydrates finance data from the backend (no-op in offline mode). */
  refreshFinance: () => Promise<void>;
  addDeposit: (params: {
    amount: number;
    accountId: string;
    source: string;
    category: string;
    description?: string;
    createdBy: string;
    projectId?: string;
    projectName?: string;
  }) => void;
  addExpense: (params: {
    amount: number;
    accountId: string;
    title: string;
    category: string;
    description: string;
    requester: string;
    projectId?: string;
    projectName?: string;
  }) => void;
}

// Company treasury structure — balances start at ZERO (no fake data).
const INITIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'acc-cib',
    name: 'حساب CIB الرئيسي للشركة',
    type: 'BANK',
    accountNumber: '',
    balance: 0,
    currency: 'ج.م',
  },
  {
    id: 'acc-cash',
    name: 'خزينة النقدية والتشغيل (Petty Cash)',
    type: 'CASH',
    balance: 0,
    currency: 'ج.م',
  },
];

// Transactions start EMPTY — real records come from user actions / the API.
const INITIAL_TRANSACTIONS: TransactionRecord[] = [];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { isLiveMode: authLive } = useAuth();

  // Persisted state — survives page refresh via localStorage (offline cache)
  const [accounts, setAccounts] = usePersistentState<FinancialAccount[]>('fekra_finance_accounts_v2', INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = usePersistentState<TransactionRecord[]>('fekra_finance_transactions_v2', INITIAL_TRANSACTIONS);

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [categories, setCategories] = useState<FinancialCategoryOption[]>([]);

  /**
   * Hydrate finance data from the live backend API.
   * Falls back silently to the offline cache when the API is unreachable.
   */
  const refreshFinance = useCallback(async () => {
    try {
      const [accs, txs, cats] = await Promise.all([
        api<any[]>('/finance/accounts'),
        api<any[]>('/finance/transactions?take=200'),
        api<any[]>('/finance/categories'),
      ]);

      const mappedAccounts: FinancialAccount[] = accs.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.accountType === 'BANK' ? 'BANK' : 'CASH',
        accountNumber: undefined,
        balance: a.currentBalance ?? Number(a.openingBalance ?? 0),
        currency: 'ج.م',
      }));

      const mappedTxs: TransactionRecord[] = txs.map((t) => ({
        id: t.id,
        type: t.type,
        title: t.description,
        amount: Number(t.amount),
        currency: 'ج.م',
        accountId: t.accountId,
        accountName: t.account?.name || '',
        category: t.category?.name || '',
        sourceOrRequester: t.createdBy?.fullName || '',
        date: (t.transactionDate || '').slice(0, 10),
        description: t.description,
        status: t.approvalStatus === 'APPROVED' ? 'COMPLETED' : 'PENDING_APPROVAL',
      }));

      setAccounts(mappedAccounts);
      setTransactions(mappedTxs);
      setCategories(
        cats.map((c) => ({ id: c.id, name: c.name, transactionType: c.transactionType })),
      );
      setIsLiveMode(true);
    } catch {
      setIsLiveMode(false);
    }
  }, []);

  // Fetch live data once the user session is authenticated with the backend
  useEffect(() => {
    if (authLive) {
      refreshFinance();
    }
  }, [authLive, refreshFinance]);

  // Financial analytics calculations
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Real monthly analytics derived from actual recorded transactions
  const now = new Date();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const thisKey = monthKey(now);
  const lastKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const thisMonthExpenses = transactions
    .filter((t) => t.type === 'EXPENSE' && t.date.slice(0, 7) === thisKey)
    .reduce((sum, t) => sum + t.amount, 0);
  const lastMonthExpenses = transactions
    .filter((t) => t.type === 'EXPENSE' && t.date.slice(0, 7) === lastKey)
    .reduce((sum, t) => sum + t.amount, 0);
  const thisMonthRevenue = transactions
    .filter((t) => t.type === 'INCOME' && t.date.slice(0, 7) === thisKey)
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = thisMonthRevenue - thisMonthExpenses;

  const addDeposit = (params: {
    amount: number;
    accountId: string;
    source: string;
    category: string;
    description?: string;
    createdBy: string;
    projectId?: string;
    projectName?: string;
  }) => {
    // LIVE MODE: create the deposit on the backend, then re-hydrate from source of truth
    if (isLiveMode) {
      const matchedCategory = categories.find(
        (c) => c.transactionType === 'INCOME' && (c.name === params.category || !params.category),
      );
      api('/finance/deposits', {
        method: 'POST',
        body: JSON.stringify({
          accountId: params.accountId,
          amount: params.amount,
          categoryId: matchedCategory?.id,
          source: params.source,
          description: params.projectName
            ? `${params.description || ''} (مشروع: ${params.projectName})`.trim()
            : params.description,
        }),
      })
        .then(() => refreshFinance())
        .catch((err) => console.error('Deposit failed on server:', err));
      return;
    }

    // OFFLINE MODE: update the local persisted cache
    const targetAcc = accounts.find((a) => a.id === params.accountId) || accounts[0];

    // Update account balance
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === targetAcc.id ? { ...acc, balance: acc.balance + params.amount } : acc,
      ),
    );

    // Record new transaction
    const newTx: TransactionRecord = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      type: 'INCOME',
      title: params.projectName
        ? `إيداع جديد: ${params.source} (مشروع: ${params.projectName})`
        : `إيداع جديد: ${params.source}`,
      amount: params.amount,
      currency: 'ج.م',
      accountId: targetAcc.id,
      accountName: targetAcc.name,
      category: params.category || 'إيداع رصيد / إيراد جديد',
      sourceOrRequester: params.source,
      date: new Date().toISOString().split('T')[0],
      description: params.description || `تم الإيداع بواسطة ${params.createdBy}`,
      status: 'COMPLETED',
      projectId: params.projectId,
      projectName: params.projectName,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  const addExpense = (params: {
    amount: number;
    accountId: string;
    title: string;
    category: string;
    description: string;
    requester: string;
    projectId?: string;
    projectName?: string;
  }) => {
    // LIVE MODE: submit to the backend → enters the 4/4 unanimous approval flow
    if (isLiveMode) {
      const matchedCategory = categories.find(
        (c) => c.transactionType === 'EXPENSE' && (c.name === params.category || !params.category),
      );
      api('/finance/expenses', {
        method: 'POST',
        body: JSON.stringify({
          accountId: params.accountId,
          amount: params.amount,
          categoryId: matchedCategory?.id,
          title: params.title,
          description: params.projectName
            ? `${params.description || ''} (مشروع: ${params.projectName})`.trim()
            : params.description,
        }),
      })
        .then(() => refreshFinance())
        .catch((err) => console.error('Expense submission failed on server:', err));
      return;
    }

    // OFFLINE MODE: record in the local persisted cache
    const targetAcc = accounts.find((a) => a.id === params.accountId) || accounts[0];

    const newTx: TransactionRecord = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      type: 'EXPENSE',
      title: params.projectName
        ? `${params.title} (مشروع: ${params.projectName})`
        : params.title,
      amount: params.amount,
      currency: 'ج.م',
      accountId: targetAcc.id,
      accountName: targetAcc.name,
      category: params.category,
      sourceOrRequester: params.requester,
      date: new Date().toISOString().split('T')[0],
      description: params.description,
      status: 'PENDING_APPROVAL',
      projectId: params.projectId,
      projectName: params.projectName,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        totalBalance,
        thisMonthExpenses,
        lastMonthExpenses,
        thisMonthRevenue,
        netCashFlow,
        transactions,
        isLiveMode,
        categories,
        refreshFinance,
        addDeposit,
        addExpense,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
