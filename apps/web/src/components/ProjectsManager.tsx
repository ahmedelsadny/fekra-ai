'use client';

import React, { useState } from 'react';
import { useProjects, ProjectItem, ProjectTask } from '../context/ProjectContext';
import { useAuth, AUTHORIZED_PARTNERS } from '../context/AuthContext';
import {
  FolderKanban,
  Plus,
  MessageSquare,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  AtSign,
  ArrowRight,
  User,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';

export const ProjectsManager: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    addProject,
    messages,
    sendMessage,
    tasks,
    addTask,
    updateTaskStatus,
  } = useProjects();

  const { user } = useAuth();

  // Modals & Sub-tab state
  const [projectSubTab, setProjectSubTab] = useState<'KANBAN' | 'CHAT' | 'DETAILS'>('KANBAN');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newProjectUnit, setNewProjectUnit] = useState('حلول الذكاء الاصطناعي (BU-AI)');
  const [newProjectManager, setNewProjectManager] = useState(user?.name || 'Ahmed Elsadny');
  const [newProjectBudget, setNewProjectBudget] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // New Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState(AUTHORIZED_PARTNERS[0].id);
  const [taskPriority, setTaskPriority] = useState<ProjectTask['priority']>('HIGH');
  const [taskHours, setTaskHours] = useState('12');
  const [taskDueDate, setTaskDueDate] = useState('2026-11-15');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const mgr = AUTHORIZED_PARTNERS.find((p) => p.name === newProjectManager) || AUTHORIZED_PARTNERS[0];

    addProject({
      name: newProjectName.trim(),
      code: newProjectCode.trim() || `PRJ-${Math.floor(10 + Math.random() * 90)}`,
      businessUnit: newProjectUnit,
      managerName: mgr.name,
      managerInitials: mgr.initials,
      budget: parseFloat(newProjectBudget) || 0,
      currency: 'ج.م',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: newProjectDueDate || '2026-12-31',
      status: 'ACTIVE',
      description: newProjectDesc.trim(),
    });

    setSuccessToast(`تم إنشاء المشروع "${newProjectName}" بنجاح.`);
    setNewProjectName('');
    setNewProjectCode('');
    setNewProjectBudget('');
    setNewProjectDesc('');
    setIsNewProjectModalOpen(false);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !activeProject) return;

    const assignee = AUTHORIZED_PARTNERS.find((p) => p.id === taskAssigneeId) || AUTHORIZED_PARTNERS[0];

    addTask({
      projectId: activeProject.id,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      assigneeInitials: assignee.initials,
      priority: taskPriority,
      status: 'TODO',
      dueDate: taskDueDate,
      estimatedHours: parseFloat(taskHours) || 8,
      mentionedPartnerId: assignee.id, // Mentions and notifies this partner
    });

    setSuccessToast(`تم إنشاء المهمة وإرسال إشعار فوري إلى ${assignee.name}`);
    setTaskTitle('');
    setTaskDescription('');
    setIsNewTaskModalOpen(false);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeProject) return;

    sendMessage(activeProject.id, chatInput);
    setChatInput('');
  };

  const currentProjectTasks = tasks.filter((t) => t.projectId === activeProject?.id);
  const currentProjectMessages = messages.filter((m) => m.projectId === activeProject?.id);

  const columns: { id: ProjectTask['status']; title: string; color: string }[] = [
    { id: 'TODO', title: 'قيد الانتظار', color: 'text-slate-500' },
    { id: 'IN_PROGRESS', title: 'جاري العمل', color: 'text-cyan' },
    { id: 'IN_REVIEW', title: 'مراجعة واعتماد', color: 'text-amber-400' },
    { id: 'DONE', title: 'مكتمل', color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-cyan-dim border border-cyan/40 text-cyan text-xs flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-500 hover:text-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Projects Selection & Header */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <h2 className="text-lg font-black text-slate-900">إدارة ومتابعة المشاريع</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة المهام، النقاشات الداخلية لكل مشروع، والميزانيات المعتمدة
            </p>
          </div>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="electric-gradient-btn px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm self-start"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مشروع جديد</span>
          </button>
        </div>

        {/* Project Selector Horizontal Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {projects.map((prj) => {
            const isSelected = activeProjectId === prj.id;
            return (
              <button
                key={prj.id}
                onClick={() => setActiveProjectId(prj.id)}
                className={`p-4 rounded-2xl border text-start transition-all ${
                  isSelected
                    ? 'bg-navy-800 border-cyan/60 shadow-sm'
                    : 'bg-navy-950/60 border-surface-border hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-cyan font-bold bg-cyan-dim px-2 py-0.5 rounded border border-cyan/20">
                    {prj.code}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    تسليم: {prj.dueDate}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{prj.name}</h4>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-surface-border/60">
                  <span>المسؤول: {prj.managerName}</span>
                  <span className="font-mono text-cyan">{prj.budget.toLocaleString()} ج.م</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Project Workspace */}
      {activeProject && (
        <div className="glass-panel rounded-3xl p-6 space-y-6">
          {/* Active Project Sub-Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-cyan font-bold bg-cyan-dim px-2 py-0.5 rounded border border-cyan/30">
                  {activeProject.code}
                </span>
                <span className="text-xs text-slate-500">• {activeProject.businessUnit}</span>
              </div>
              <h3 className="text-base font-black text-slate-900">{activeProject.name}</h3>
            </div>

            {/* Sub-Tabs: Tasks / Chat / Details */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-navy-950 border border-surface-border">
              <button
                onClick={() => setProjectSubTab('KANBAN')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  projectSubTab === 'KANBAN'
                    ? 'bg-cyan text-navy-950'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>المهام والكانبان ({currentProjectTasks.length})</span>
              </button>
              <button
                onClick={() => setProjectSubTab('CHAT')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  projectSubTab === 'CHAT'
                    ? 'bg-cyan text-navy-950'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>دردشة المشروع ({currentProjectMessages.length})</span>
              </button>
              <button
                onClick={() => setProjectSubTab('DETAILS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  projectSubTab === 'DETAILS'
                    ? 'bg-cyan text-navy-950'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>تفاصيل المشروع</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: KANBAN TASKS WITH MENTION & NOTIFICATIONS */}
          {projectSubTab === 'KANBAN' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  لوحة المهام المخصصة لمشروع {activeProject.name}
                </p>
                <button
                  onClick={() => setIsNewTaskModalOpen(true)}
                  className="electric-gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مهمة جديدة مع منشن</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {columns.map((col) => {
                  const colTasks = currentProjectTasks.filter((t) => t.status === col.id);
                  return (
                    <div
                      key={col.id}
                      className="bg-navy-950/70 rounded-2xl border border-surface-border p-3.5 flex flex-col min-h-[360px]"
                    >
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-surface-border">
                        <span className={`text-xs font-bold ${col.color}`}>{col.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-navy-900 text-[10px] font-mono text-slate-600">
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {colTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 rounded-xl bg-navy-900 border border-surface-border hover:border-cyan/40 transition group"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-[9px] text-cyan font-bold bg-cyan-dim px-1.5 py-0.5 rounded border border-cyan/20">
                                {task.id}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-amber-400 bg-amber-500/10 border border-amber-500/20">
                                {task.priority}
                              </span>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 leading-tight">
                              {task.title}
                            </h5>

                            {task.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="mt-2.5 pt-2 border-t border-surface-border/60 flex items-center justify-between text-[10px] text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-navy-950 border border-cyan/30 text-cyan flex items-center justify-center font-mono font-bold text-[9px]">
                                  {task.assigneeInitials}
                                </span>
                                <span className="truncate max-w-[90px]">{task.assigneeName.split(' ')[0]}</span>
                              </div>
                              <span className="font-mono">{task.dueDate}</span>
                            </div>

                            {/* Status transitions */}
                            <div className="mt-2 pt-1.5 border-t border-surface-border/40 flex items-center justify-end gap-1 text-[10px]">
                              {col.id === 'TODO' && (
                                <button
                                  onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                  className="text-cyan hover:underline font-bold"
                                >
                                  بدء العمل
                                </button>
                              )}
                              {col.id === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => updateTaskStatus(task.id, 'IN_REVIEW')}
                                  className="text-amber-400 hover:underline font-bold"
                                >
                                  إرسال للمراجعة
                                </button>
                              )}
                              {col.id === 'IN_REVIEW' && (
                                <button
                                  onClick={() => updateTaskStatus(task.id, 'DONE')}
                                  className="text-emerald-400 hover:underline font-bold"
                                >
                                  اعتماد واكتمال
                                </button>
                              )}
                              {col.id === 'DONE' && (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> مكتمل
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
          )}

          {/* VIEW 2: PROJECT CHAT & DISCUSSIONS */}
          {projectSubTab === 'CHAT' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-card border border-surface-border h-[380px] flex flex-col justify-between">
                {/* Messages stream */}
                <div className="overflow-y-auto space-y-3 pe-2">
                  {currentProjectMessages.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs">
                      لا توجد نقاشات سابقة في هذا المشروع. ابدأ المحادثة الآن.
                    </div>
                  ) : (
                    currentProjectMessages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                        >
                          <div className="w-7 h-7 rounded-xl bg-navy-900 border border-cyan/40 text-cyan text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            {msg.senderInitials}
                          </div>
                          <div
                            className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed ${
                              isMe
                                ? 'bg-cyan text-navy-950 font-medium'
                                : 'bg-navy-900 border border-surface-border text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-1 text-[10px]">
                              <span className={`font-bold ${isMe ? 'text-navy-950' : 'text-cyan'}`}>
                                {msg.senderName}
                              </span>
                              <span className={isMe ? 'text-navy-900/80' : 'text-slate-500'}>
                                {msg.timestamp}
                              </span>
                            </div>
                            <p>{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat message input form */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-surface-border flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`اكتب رسالة أو استفسار في مشروع ${activeProject.name}...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-navy-900 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan"
                  />
                  <button
                    type="submit"
                    className="electric-gradient-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>إرسال</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* VIEW 3: PROJECT DETAILS & BUDGET */}
          {projectSubTab === 'DETAILS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-navy-950/60 border border-surface-border">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-cyan">نطاق العمل ووصف المشروع</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-navy-900 p-3 rounded-xl border border-surface-border">
                  {activeProject.description || 'لا يوجد وصف مدخل لهذا المشروع.'}
                </p>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>وحدة الأعمال: <span className="text-slate-900">{activeProject.businessUnit}</span></div>
                  <div>الشريك المشرف: <span className="text-slate-900">{activeProject.managerName}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-cyan">الميزانية والجدول الزمني</h4>
                <div className="p-3 rounded-xl bg-navy-900 border border-surface-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">الميزانية المعتمدة:</span>
                    <span className="font-mono text-cyan font-bold">{activeProject.budget.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">تاريخ الانطلاق:</span>
                    <span className="font-mono text-slate-900">{activeProject.startDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">الموعد النهائي للتسليم:</span>
                    <span className="font-mono text-slate-900">{activeProject.dueDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Add New Project */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B2447]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 w-full max-w-lg border border-cyan/40 shadow-glow-card animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-cyan" />
                <h3 className="text-base font-bold text-slate-900">إضافة مشروع جديد للشركة</h3>
              </div>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم المشروع *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نظام إدارة العملاء والذكاء الاصطناعي"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">كود المشروع</label>
                  <input
                    type="text"
                    placeholder="PRJ-AI-03"
                    value={newProjectCode}
                    onChange={(e) => setNewProjectCode(e.target.value)}
                    className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الميزانية (ج.م)</label>
                  <input
                    type="number"
                    placeholder="350000"
                    value={newProjectBudget}
                    onChange={(e) => setNewProjectBudget(e.target.value)}
                    className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الشريك المسؤول</label>
                  <select
                    value={newProjectManager}
                    onChange={(e) => setNewProjectManager(e.target.value)}
                    className="w-full bg-navy-950 border border-surface-border rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan"
                  >
                    {AUTHORIZED_PARTNERS.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ التسليم</label>
                  <input
                    type="date"
                    value={newProjectDueDate}
                    onChange={(e) => setNewProjectDueDate(e.target.value)}
                    className="w-full bg-navy-950 border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">وصف المشروع وأهدافه</label>
                <textarea
                  rows={2}
                  placeholder="نطاق العمل ومخرجات المشروع الأساسية..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="electric-gradient-btn px-6 py-2.5 rounded-xl text-xs font-black"
                >
                  حفظ وإنشاء المشروع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Task With @Mention */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B2447]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 w-full max-w-lg border border-cyan/40 shadow-glow-card animate-scaleIn">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <AtSign className="w-5 h-5 text-cyan" />
                <h3 className="text-base font-bold text-slate-900">إضافة مهمة جديدة مع منشن للشريك</h3>
              </div>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">عنوان المهمة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مراجعة خطة التسليم وتدقيق البيانات"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan"
                />
              </div>

              {/* Mention Selector */}
              <div>
                <label className="block text-xs font-bold text-cyan mb-1 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5" />
                  <span>المسند إليه / عمل منشن له (سيصل له إشعار فوري) *</span>
                </label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="w-full bg-navy-950 border border-cyan/40 rounded-xl px-3 py-2.5 text-xs text-cyan font-bold focus:outline-none focus:border-cyan"
                >
                  {AUTHORIZED_PARTNERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      @{p.name} ({p.role.split('&')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الأولوية</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-navy-950 border border-surface-border rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-cyan"
                  >
                    <option value="URGENT">عاجل جداً</option>
                    <option value="HIGH">أولوية عالية</option>
                    <option value="MEDIUM">أولوية متوسطة</option>
                    <option value="LOW">منخفضة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-navy-950 border border-surface-border rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">تفاصيل المهمة</label>
                <textarea
                  rows={2}
                  placeholder="شرح المطلوب والمخرجات المتوقعة من المهمة..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-navy-950 border border-surface-border rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan"
                ></textarea>
              </div>

              <div className="p-3 rounded-xl bg-navy-950 border border-cyan/20 text-[11px] text-slate-600 flex items-center gap-2">
                <AtSign className="w-4 h-4 text-cyan shrink-0" />
                <span>
                  بمجرد إنشاء المهمة، سيظهر تنبيه فوري في جرس الإشعارات بحساب الشريك المذكور.
                </span>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="electric-gradient-btn px-6 py-2.5 rounded-xl text-xs font-black"
                >
                  إسناد المهمة وإرسال المنشن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
