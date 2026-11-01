'use client';

import React, { createContext, useContext, useState } from 'react';

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
}

interface FinanceContextType {
  accounts: FinancialAccount[];
  totalBalance: number;
  thisMonthExpenses: number;
  lastMonthExpenses: number;
  thisMonthRevenue: number;
  netCashFlow: number;
  transactions: TransactionRecord[];
  addDeposit: (params: {
    amount: number;
    accountId: string;
    source: string;
    category: string;
    description?: string;
    createdBy: string;
  }) => void;
  addExpense: (params: {
    amount: number;
    accountId: string;
    title: string;
    category: string;
    description: string;
    requester: string;
  }) => void;
}

const INITIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'acc-cib',
    name: 'حساب CIB الرئيسي للشركة',
    type: 'BANK',
    accountNumber: 'EG-1900-8844-01',
    balance: 1850000,
    currency: 'ج.م',
  },
  {
    id: 'acc-cash',
    name: 'خزينة النقدية والتشغيل (Petty Cash)',
    type: 'CASH',
    balance: 120000,
    currency: 'ج.م',
  },
];

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TX-901',
    type: 'INCOME',
    title: 'دفعة تعاقد مشروع الذكاء الاصطناعي - شركة النيل',
    amount: 350000,
    currency: 'ج.م',
    accountId: 'acc-cib',
    accountName: 'حساب CIB الرئيسي للشركة',
    category: 'عقود برمجيات وحلول ذكية',
    sourceOrRequester: 'Nile Enterprises LLC',
    date: '2026-10-28',
    description: 'دفعة مقدمة 40% من العقد السنوي',
    status: 'COMPLETED',
  },
  {
    id: 'TX-902',
    type: 'EXPENSE',
    title: 'تجديد اشتراكات سيرفرات GPU ومعالجات الذكاء الاصطناعي',
    amount: 85000,
    currency: 'ج.م',
    accountId: 'acc-cib',
    accountName: 'حساب CIB الرئيسي للشركة',
    category: 'سيرفرات وبنية تحتية',
    sourceOrRequester: 'فريق الهندسة والتقنية',
    date: '2026-10-25',
    description: 'خوادم التدريب الشهري AWS & RunPod',
    status: 'COMPLETED',
  },
  {
    id: 'TX-903',
    type: 'INCOME',
    title: 'استشارات التحول الرقمي وتطوير الأعمال',
    amount: 130000,
    currency: 'ج.م',
    accountId: 'acc-cib',
    accountName: 'حساب CIB الرئيسي للشركة',
    category: 'استشارات رقمية',
    sourceOrRequester: 'Delta Logistics Holding',
    date: '2026-10-20',
    description: 'المرحلة الأولى من دراسة الجدوى وتخطيط الأنظمة',
    status: 'COMPLETED',
  },
  {
    id: 'TX-904',
    type: 'EXPENSE',
    title: 'مصاريف تشغيلية ومقر الشركة وتجهيزات العمل',
    amount: 60000,
    currency: 'ج.م',
    accountId: 'acc-cash',
    accountName: 'خزينة النقدية والتشغيل (Petty Cash)',
    category: 'تشغيل ومرافق مقر',
    sourceOrRequester: 'إدارة العمليات',
    date: '2026-10-15',
    description: 'فواتير إنترنت فايبر وتجهيزات تقنية داخلية',
    status: 'COMPLETED',
  },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);

  // Financial analytics calculations
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const thisMonthExpenses = 145000;
  const lastMonthExpenses = 195000;
  const thisMonthRevenue = 480000;
  const netCashFlow = thisMonthRevenue - thisMonthExpenses;

  const addDeposit = (params: {
    amount: number;
    accountId: string;
    source: string;
    category: string;
    description?: string;
    createdBy: string;
  }) => {
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
      title: `إيداع جديد: ${params.source}`,
      amount: params.amount,
      currency: 'ج.م',
      accountId: targetAcc.id,
      accountName: targetAcc.name,
      category: params.category || 'إيداع رصيد / إيراد جديد',
      sourceOrRequester: params.source,
      date: new Date().toISOString().split('T')[0],
      description: params.description || `تم الإيداع بواسطة ${params.createdBy}`,
      status: 'COMPLETED',
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
  }) => {
    const targetAcc = accounts.find((a) => a.id === params.accountId) || accounts[0];

    const newTx: TransactionRecord = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      type: 'EXPENSE',
      title: params.title,
      amount: params.amount,
      currency: 'ج.م',
      accountId: targetAcc.id,
      accountName: targetAcc.name,
      category: params.category,
      sourceOrRequester: params.requester,
      date: new Date().toISOString().split('T')[0],
      description: params.description,
      status: 'PENDING_APPROVAL',
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
