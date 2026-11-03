'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, AUTHORIZED_PARTNERS } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { Search, Bell, LogOut, CheckCheck, X, AtSign, Menu } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { t } = useLanguage();
  const { user, logout, isLiveMode } = useAuth();
  const { userNotifications, unreadCount, markNotificationsAsRead } = useProjects();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ---------- LIVE notifications (backend + Socket.IO) ----------
  const [liveNotifs, setLiveNotifs] = useState<any[]>([]);

  const fetchLiveNotifs = () => {
    api<any[]>('/notifications?take=50')
      .then((list) => setLiveNotifs(list))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isLiveMode || !user?.id) return;
    fetchLiveNotifs();

    const sock = getSocket();
    if (!sock) return;
    const handler = (payload: { userIds?: string[]; title: string; body: string }) => {
      if (!payload?.userIds?.includes(user.id)) return;
      setToast(`🔔 ${payload.title} — ${payload.body}`);
      setTimeout(() => setToast(null), 7000);
      fetchLiveNotifs();
    };
    sock.on('notif:new', handler);
    return () => {
      sock.off('notif:new', handler);
    };
  }, [isLiveMode, user?.id]);

  /** Unified mark-as-read for both modes */
  const handleMarkRead = () => {
    if (isLiveMode) {
      api('/notifications/read-all', { method: 'POST' })
        .then(() => fetchLiveNotifs())
        .catch(() => {});
    } else {
      markNotificationsAsRead();
    }
  };

  // Unified notification list for the dropdown (live API list OR offline local list)
  const displayNotifs = isLiveMode
    ? liveNotifs.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.body,
        timestamp: new Date(n.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        isRead: !!n.readAt,
      }))
    : userNotifications;
  const displayUnread = isLiveMode
    ? liveNotifs.filter((n) => !n.readAt).length
    : unreadCount;

  const currentPartner = user || AUTHORIZED_PARTNERS[0];

  return (
    <header className="h-16 bg-navy-900 border-b border-surface-border px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2.5 rounded-xl bg-navy-950 text-slate-600 hover:text-slate-900 border border-surface-border transition"
        title="فتح القائمة الجانبية"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Global Search Bar */}
      <div className="flex items-center gap-3 w-80 lg:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث في المشاريع، المهام، المعاملات المالية..."
            className="w-full bg-navy-950 border border-surface-border rounded-xl ps-9 pe-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cyan/50 transition font-sans"
          />
        </div>
      </div>

      {/* Right Controls: Notifications, User Profile & Logout */}
      <div className="flex items-center gap-4 relative">
        {/* Notifications Bell & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen) handleMarkRead();
            }}
            className="relative p-2.5 rounded-xl bg-navy-950 hover:bg-navy-800 text-slate-600 hover:text-slate-900 border border-surface-border transition"
            title="الإشعارات"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {displayUnread > 0 && (
              <span className="absolute -top-1 -end-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[9px] font-black border border-navy-900 animate-pulse">
                {displayUnread}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute end-0 mt-3 w-80 sm:w-96 glass-panel rounded-2xl border border-surface-border shadow-2xl p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan" />
                  <h4 className="text-xs font-bold text-slate-900">تنبيهات وإشعارات الشريك</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkRead}
                    className="text-[10px] text-cyan hover:underline flex items-center gap-1 font-bold"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>تحديد كمقروء</span>
                  </button>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-surface-border/50 max-h-72 overflow-y-auto mt-2">
                {displayNotifs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    لا توجد إشعارات جديدة حالياً.
                  </div>
                ) : (
                  displayNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl transition my-1 ${
                        notif.isRead ? 'bg-transparent' : 'bg-cyan-dim border border-cyan/20'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-navy-950 border border-cyan/40 text-cyan flex items-center justify-center shrink-0 mt-0.5">
                          <AtSign className="w-3 h-3" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-900 leading-snug">
                            {notif.title}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="text-[9px] text-slate-500 font-mono mt-1">
                            {notif.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Authenticated Partner Profile */}
        <div className="flex items-center gap-3 ps-3 border-s border-surface-border">
          <div className="w-9 h-9 rounded-xl bg-navy-950 border border-cyan/40 text-cyan flex items-center justify-center font-mono font-bold text-xs shadow-sm">
            {currentPartner.initials}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>{currentPartner.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-dim text-cyan text-[10px] border border-cyan/30">
                شريك مؤسس
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] border ${
                  isLiveMode
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                }`}
                title={isLiveMode ? 'متصل بقاعدة البيانات — كل الحركات حقيقية ومحفوظة' : 'السيرفر مش متصل — بتشتغل على نسخة محلية تجريبية'}
              >
                {isLiveMode ? 'متصل بالسيرفر' : 'وضع تجريبي'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{currentPartner.email}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="تسجيل الخروج من الحساب"
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition flex items-center gap-1.5 text-xs font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>
      {/* Live notification toast (Socket.IO) */}
      {toast && (
        <div className="fixed bottom-5 start-5 z-[100] max-w-md glass-panel-cyan rounded-2xl p-4 shadow-glow-card border border-cyan/40 animate-fadeInUp">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-bold text-slate-800 leading-relaxed">{toast}</p>
            <button onClick={() => setToast(null)} className="text-slate-500 hover:text-slate-900 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
