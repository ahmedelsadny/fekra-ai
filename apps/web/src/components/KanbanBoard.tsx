'use client';

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  Plus,
  UserCheck,
} from 'lucide-react';

interface TaskItem {
  id: string;
  projectCode: string;
  title: string;
  assignee: string;
  assigneeAvatar: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  estimatedHours: number;
  dueDate: string;
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'TSK-101',
    projectCode: 'AI-CORE',
    title: 'Implement Multi-Tenant Organization Isolation Middleware in NestJS',
    assignee: 'Khaled Omar (Backend Lead)',
    assigneeAvatar: '👨‍💻',
    priority: 'URGENT',
    status: 'IN_REVIEW',
    estimatedHours: 16,
    dueDate: '2026-11-03',
  },
  {
    id: 'TSK-102',
    projectCode: 'FIN-GOV',
    title: 'Atomic 4-Partner Unanimous Expense Approval Service with Prisma $transaction',
    assignee: 'Sarah El-Sayed (CTO)',
    assigneeAvatar: '👩‍💻',
    priority: 'HIGH',
    status: 'DONE',
    estimatedHours: 12,
    dueDate: '2026-11-01',
  },
  {
    id: 'TSK-103',
    projectCode: 'AI-CORE',
    title: 'Arabic RTL & English LTR Tailwind Theme Tokens & Navigation Components',
    assignee: 'Laila Mostafa (UI/UX)',
    assigneeAvatar: '🎨',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    estimatedHours: 10,
    dueDate: '2026-11-04',
  },
  {
    id: 'TSK-104',
    projectCode: 'DTC-ERP',
    title: 'Daily Accomplishment Report Submission & Blocker Alert Engine',
    assignee: 'Youssef Adel (Full-Stack)',
    assigneeAvatar: '⚡',
    priority: 'HIGH',
    status: 'TODO',
    estimatedHours: 14,
    dueDate: '2026-11-06',
  },
];

export const KanbanBoard: React.FC = () => {
  const { t, language } = useLanguage();
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);

  const moveTask = (taskId: string, nextStatus: TaskItem['status']) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
    );
  };

  const columns: { id: TaskItem['status']; title: string; color: string; border: string }[] = [
    { id: 'TODO', title: t('columnTodo'), color: 'text-slate-300', border: 'border-slate-700' },
    { id: 'IN_PROGRESS', title: t('columnInProgress'), color: 'text-cyan', border: 'border-cyan/40' },
    { id: 'IN_REVIEW', title: t('columnInReview'), color: 'text-amber-400', border: 'border-amber-500/40' },
    { id: 'DONE', title: t('columnDone'), color: 'text-emerald-400', border: 'border-emerald-500/40' },
  ];

  const getPriorityBadge = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-cyan-dim text-cyan border-cyan/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">{t('projectBoard')}</h3>
          <p className="text-xs text-slate-400">
            Sprint 3 Workflow • Review gates enforce manager approval before marking DONE
          </p>
        </div>
        <button className="electric-gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-navy-900/60 rounded-2xl border border-surface-border p-4 flex flex-col min-h-[460px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.border} bg-current ${col.color}`}></span>
                  <h4 className={`text-xs font-bold tracking-wide ${col.color}`}>{col.title}</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-navy-800 text-xs font-mono text-slate-300 border border-surface-border">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-navy-800/80 border border-surface-border hover:border-cyan/40 hover:shadow-glow-card transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-cyan font-bold bg-cyan-dim px-2 py-0.5 rounded border border-cyan/20">
                        {task.projectCode} • {task.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                          task.priority,
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-white leading-snug group-hover:text-cyan transition-colors">
                      {task.title}
                    </h5>

                    <div className="mt-3 pt-3 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{task.assigneeAvatar}</span>
                        <span className="truncate max-w-[110px]">{task.assignee.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{task.estimatedHours}h</span>
                      </div>
                    </div>

                    {/* Stage Transition Control */}
                    <div className="mt-2.5 pt-2 flex items-center justify-end gap-1.5 border-t border-surface-border/40">
                      {col.id === 'TODO' && (
                        <button
                          onClick={() => moveTask(task.id, 'IN_PROGRESS')}
                          className="text-[10px] text-cyan hover:underline font-bold flex items-center gap-1"
                        >
                          Start Task <ArrowRight className={`w-2.5 h-2.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      {col.id === 'IN_PROGRESS' && (
                        <button
                          onClick={() => moveTask(task.id, 'IN_REVIEW')}
                          className="text-[10px] text-amber-400 hover:underline font-bold flex items-center gap-1"
                        >
                          Submit Review <UserCheck className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {col.id === 'IN_REVIEW' && (
                        <button
                          onClick={() => moveTask(task.id, 'DONE')}
                          className="text-[10px] text-emerald-400 hover:underline font-bold flex items-center gap-1"
                        >
                          Approve & Complete <CheckCircle2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {col.id === 'DONE' && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
