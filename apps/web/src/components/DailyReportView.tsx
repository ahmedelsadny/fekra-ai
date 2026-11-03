'use client';

import React, { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, AUTHORIZED_PARTNERS } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { usePersistentState } from '../hooks/usePersistentState';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRightCircle,
  Calendar,
  CalendarCheck,
  PlusCircle,
  MessageSquare,
  Send,
  X,
  Clock,
  Inbox,
  FileEdit,
} from 'lucide-react';

/* ============================================================
   Types
   ============================================================ */

interface ReportComment {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  content: string;
  timestamp: string;
}

interface DailyReportItem {
  id: string;
  authorId: string;
  userName: string;
  userRole: string;
  initials: string;
  date: string; // YYYY-MM-DD
  submittedAt: string; // HH:MM
  hoursWorked?: number;
  accomplishments: string;
  nextSteps: string;
  blockers: string | null;
  status: 'SUBMITTED' | 'REVIEWED';
  comments: ReportComment[];
}

const todayKey = () => new Date().toISOString().split('T')[0];

/* ============================================================
   Component
   ============================================================ */

export const DailyReportView: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { pushNotification } = useProjects();

  const myDirId = useMemo(() => {
    const me = AUTHORIZED_PARTNERS.find(
      (p) => p.email.toLowerCase() === (user?.email || '').toLowerCase(),
    );
    return me?.id || 'p1';
  }, [user?.email]);

  const otherPartnerIds = useMemo(
    () => AUTHORIZED_PARTNERS.filter((p) => p.id !== myDirId).map((p) => p.id),
    [myDirId],
  );

  // Persistent reports — survive refresh, organized per day
  const [reports, setReports] = usePersistentState<DailyReportItem[]>('fekra_daily_reports', []);

  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Report form state
  const [fAccomplishments, setFAccomplishments] = useState('');
  const [fNextSteps, setFNextSteps] = useState('');
  const [fBlockers, setFBlockers] = useState('');
  const [fHours, setFHours] = useState('');

  // Comment state: { reportId: text }
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const dayReports = reports.filter((r) => r.date === selectedDate);
  const myReportToday = reports.find((r) => r.date === todayKey() && r.authorId === myDirId);
  const isToday = selectedDate === todayKey();

  /** Opens the report modal (fresh or edit mode) */
  const openReportModal = () => {
    if (myReportToday) {
      setFAccomplishments(myReportToday.accomplishments);
      setFNextSteps(myReportToday.nextSteps);
      setFBlockers(myReportToday.blockers || '');
      setFHours(myReportToday.hoursWorked ? String(myReportToday.hoursWorked) : '');
    } else {
      setFAccomplishments('');
      setFNextSteps('');
      setFBlockers('');
      setFHours('');
    }
    setIsModalOpen(true);
  };

  /** Submits / updates my report for today + notifies the other partners */
  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fAccomplishments.trim() || !fNextSteps.trim()) return;

    const isEdit = !!myReportToday;
    const report: DailyReportItem = {
      id: isEdit ? myReportToday.id : `REP-${Date.now()}`,
      authorId: myDirId,
      userName: user?.name || 'شريك',
      userRole: user?.role || 'Founding Partner',
      initials: user?.initials || 'P',
      date: todayKey(),
      submittedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      hoursWorked: fHours ? parseFloat(fHours) : undefined,
      accomplishments: fAccomplishments.trim(),
      nextSteps: fNextSteps.trim(),
      blockers: fBlockers.trim() || null,
      status: 'SUBMITTED',
      comments: isEdit ? myReportToday.comments : [],
    };

    setReports((prev) => (isEdit ? prev.map((r) => (r.id === report.id ? report : r)) : [report, ...prev]));

    // Notify the other partners
    pushNotification(
      otherPartnerIds,
      isEdit ? 'تحديث على تقرير يومي' : 'تقرير يومي جديد',
      `${user?.name || 'شريك'} ${isEdit ? 'حدّث' : 'رفع'} تقرير يوم ${todayKey()} — شوف الإنجازات والعوائق.`,
    );

    setIsModalOpen(false);
  };

  /** Adds a comment on a report + notifies its author */
  const addComment = (report: DailyReportItem) => {
    const draft = (commentDrafts[report.id] || '').trim();
    if (!draft) return;

    const comment: ReportComment = {
      id: `cmt-${Date.now()}`,
      authorId: myDirId,
      authorName: user?.name || 'شريك',
      authorInitials: user?.initials || 'P',
      content: draft,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, comments: [...r.comments, comment] } : r)),
    );
    setCommentDrafts((prev) => ({ ...prev, [report.id]: '' }));

    // Notify the report author (not myself)
    if (report.authorId !== myDirId) {
      pushNotification(
        [report.authorId],
        'كومنت جديد على تقريرك',
        `${user?.name || 'شريك'} علّق على تقرير يوم ${report.date}: "${draft.slice(0, 60)}"`,
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* ================= Header: Title + Date Filter + Submit Button ================= */}
      <div className="glass-panel rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t('dailyReportTitle')}</h3>
          <p className="text-xs text-slate-500">
            كل يوم صفحة جديدة — التقارير بتظهر أول ما الشركاء يرفعوها، وكل حركة بتوصل إشعار للباقين.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date filter */}
          <div className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-cyan shrink-0" />
            <input
              type="date"
              value={selectedDate}
              max={todayKey()}
              onChange={(e) => setSelectedDate(e.target.value || todayKey())}
              className="bg-transparent text-xs text-slate-900 focus:outline-none font-mono"
            />
            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayKey())}
                className="text-[10px] font-bold text-cyan hover:underline whitespace-nowrap"
              >
                رجّعني للنهاردة
              </button>
            )}
          </div>

          {/* Submit my report (today only) */}
          <button
            onClick={openReportModal}
            disabled={!isToday}
            title={!isToday ? 'المشاهدة فقط — الرفع متاح في تاريخ النهاردة بس' : undefined}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl electric-gradient-btn text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {myReportToday ? <FileEdit className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            <span>{myReportToday ? 'تعديل تقريري للنهاردة' : 'رفع تقرير النهاردة'}</span>
          </button>
        </div>
      </div>

      {/* ================= Day Summary Bar ================= */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-dim text-cyan border border-cyan/30 font-bold font-mono">
          <CalendarCheck className="w-3.5 h-3.5" />
          {selectedDate} {isToday && '(النهاردة)'}
        </span>
        <span className="text-slate-500">
          {dayReports.length > 0
            ? `${dayReports.length} من 4 شركاء رفعوا تقاريرهم`
            : 'مفيش تقارير اترفعت في اليوم ده لسه'}
        </span>
        {isToday && myReportToday && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold">
            ✅ تقريرك مرفوع
          </span>
        )}
      </div>

      {/* ================= Reports Grid ================= */}
      {dayReports.length === 0 ? (
        <div className="glass-panel rounded-3xl p-14 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-3xl bg-cyan-dim border border-cyan/30 text-cyan flex items-center justify-center">
            <Inbox className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            {isToday ? 'يوم جديد فاضي — أول واحد يرفع تقريره 🎉' : `مفيش تقارير يوم ${selectedDate}`}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            {isToday
              ? 'الصفحة بتقفل كل يوم وتفتح من جديد — اضغط "رفع تقرير النهاردة" فوق وسجّل إنجازاتك، وهتوصل إشعار لباقي الشركاء فوراً.'
              : 'اختر تاريخ تاني من الفلتر فوق — أو رجّعني للنهاردة عشان تشوف/ترفع تقرير اليوم.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dayReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isMine={report.authorId === myDirId}
              commentDraft={commentDrafts[report.id] || ''}
              onCommentDraft={(v) => setCommentDrafts((prev) => ({ ...prev, [report.id]: v }))}
              onAddComment={() => addComment(report)}
            />
          ))}
        </div>
      )}

      {/* ================= Report Modal ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B2447]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel-cyan rounded-3xl p-6 w-full max-w-lg border border-cyan/40 shadow-glow-card animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan" />
                <h3 className="text-base font-bold text-slate-900">
                  {myReportToday ? 'تعديل تقريري — يوم النهاردة' : 'رفع تقرير النهاردة'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitReport} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  إنجازات النهاردة {t('accomplishments')} *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="إيه اللي اتإنجز النهاردة؟ (مشروع، مكالمة عميل، كود...)"
                  value={fAccomplishments}
                  onChange={(e) => setFAccomplishments(e.target.value)}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  الخطوة الجاية {t('nextSteps')} *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="خطتك لبكرة / الخطوة الجاية في الشغل..."
                  value={fNextSteps}
                  onChange={(e) => setFNextSteps(e.target.value)}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  عوائق أو محتاج مساعدة؟ ({t('blockers')} — اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="فيه حاجة واقفة قدامك؟ الشركاء هيتابعوها معاك..."
                  value={fBlockers}
                  onChange={(e) => setFBlockers(e.target.value)}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ساعات الشغل النهاردة (اختياري)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="مثال: 8"
                  value={fHours}
                  onChange={(e) => setFHours(e.target.value)}
                  className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-card border border-surface-border text-[11px] text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan shrink-0" />
                <span>أول ما ترفع التقرير، هتوصل إشعارات لباقي الشركاء وهقدروا يعلقوا عليه.</span>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="electric-gradient-btn px-6 py-2.5 rounded-xl text-xs font-black"
                >
                  {myReportToday ? 'حفظ التعديلات' : 'رفع التقرير'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   Report Card (with comments)
   ============================================================ */

const ReportCard: React.FC<{
  report: DailyReportItem;
  isMine: boolean;
  commentDraft: string;
  onCommentDraft: (value: string) => void;
  onAddComment: () => void;
}> = ({ report, isMine, commentDraft, onCommentDraft, onAddComment }) => {
  const { t } = useLanguage();
  const [showComments, setShowComments] = useState(false);

  return (
    <div
      className={`p-5 rounded-3xl border transition-all space-y-4 ${
        isMine
          ? 'bg-cyan-dim/60 border-cyan/40 shadow-glow-cyan'
          : 'bg-white border-surface-border hover:border-cyan/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-card border border-cyan/40 text-cyan flex items-center justify-center font-mono font-bold text-xs">
            {report.initials}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {report.userName}
              {isMine && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-dim text-cyan border border-cyan/30">
                  أنت
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500">{report.userRole}</p>
          </div>
        </div>

        <div className="text-end">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
            مرفوع
          </span>
          <p className="text-[10px] text-slate-500 mt-1 font-mono flex items-center gap-1 justify-end">
            <Clock className="w-2.5 h-2.5" />
            {report.submittedAt}
            {report.hoursWorked ? ` • ${report.hoursWorked} ساعة` : ''}
          </p>
        </div>
      </div>

      {/* Accomplishments */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('accomplishments')}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed bg-surface-card p-2.5 rounded-xl border border-surface-border/60">
          {report.accomplishments}
        </p>
      </div>

      {/* Next Steps */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan mb-1">
          <ArrowRightCircle className="w-3.5 h-3.5" />
          <span>{t('nextSteps')}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed bg-surface-card p-2.5 rounded-xl border border-surface-border/60">
          {report.nextSteps}
        </p>
      </div>

      {/* Blockers */}
      {report.blockers && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('blockers')}</span>
          </div>
          <p className="text-xs text-rose-400 leading-relaxed bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
            {report.blockers}
          </p>
        </div>
      )}

      {/* Comments */}
      <div className="pt-3 border-t border-surface-border space-y-3">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-xs font-bold text-cyan hover:underline"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>
            {report.comments.length > 0
              ? `${report.comments.length} تعليق على التقرير`
              : 'علّق على التقرير'}
          </span>
        </button>

        {showComments && (
          <div className="space-y-2.5 animate-fadeIn">
            {report.comments.map((cmt) => (
              <div
                key={cmt.id}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-card border border-surface-border"
              >
                <div className="w-7 h-7 rounded-lg bg-navy-800 text-cyan border border-surface-border flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                  {cmt.authorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-900">{cmt.authorName}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{cmt.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed break-words">{cmt.content}</p>
                </div>
              </div>
            ))}

            {/* Add comment */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddComment();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => onCommentDraft(e.target.value)}
                placeholder="اكتب تعليقك على التقرير..."
                className="flex-1 bg-surface-card border border-surface-border rounded-xl px-3.5 py-2 text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan"
              />
              <button
                type="submit"
                disabled={!commentDraft.trim()}
                className="p-2 rounded-xl electric-gradient-btn disabled:opacity-40 shrink-0"
                title="إرسال التعليق"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
