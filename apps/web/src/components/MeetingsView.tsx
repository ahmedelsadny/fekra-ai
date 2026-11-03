'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useAuth, AUTHORIZED_PARTNERS } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { usePersistentState } from '../hooks/usePersistentState';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import {
  Video,
  VideoOff,
  Phone,
  Users,
  UserRound,
  Send,
  Paperclip,
  Download,
  FileIcon,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { VideoCallModal } from './VideoCallModal';

/* ============================================================
   Types
   ============================================================ */

interface MeetMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content?: string;
  // File attachment (data URL) — kept small so localStorage stays healthy
  fileName?: string;
  fileType?: string;
  dataUrl?: string;
  timestamp: string;
}

interface ChatRoom {
  id: string;
  /** Jitsi room slug — deterministic so every partner opens the same call room */
  slug: string;
  type: 'GROUP' | 'DM';
  title: string;
  subtitle: string;
  initials: string;
}

const MAX_FILE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB per attachment

/** Group call room — shared by all four founding partners */
const GROUP_ROOM: ChatRoom = {
  id: 'room-partners-hq',
  slug: 'fekra-partners-hq-2026',
  type: 'GROUP',
  title: 'غرفة الشركاء الجماعية',
  subtitle: 'ميتنج دائم للشركاء الأربعة — مكالمة جماعية',
  initials: 'FQ',
};

/* ============================================================
   Component
   ============================================================ */

export const MeetingsView: React.FC = () => {
  const { user, isLiveMode } = useAuth();
  const { pushNotification } = useProjects();

  // Resolve which directory partner I am (by email) so DM room ids are
  // identical on both partners' devices
  const myDirId = useMemo(() => {
    const me = AUTHORIZED_PARTNERS.find(
      (p) => p.email.toLowerCase() === (user?.email || '').toLowerCase(),
    );
    return me?.id || 'p1';
  }, [user?.email]);

  const rooms: ChatRoom[] = useMemo(() => {
    const dms = AUTHORIZED_PARTNERS.filter((p) => p.id !== myDirId).map((p) => ({
      id: `dm-${[myDirId, p.id].sort().join('-')}`,
      slug: `fekra-dm-${[myDirId, p.id].sort().join('-')}`,
      type: 'DM' as const,
      title: p.name,
      subtitle: p.role.split('&')[0],
      initials: p.initials,
    }));
    return [GROUP_ROOM, ...dms];
  }, [myDirId]);

  const [activeRoomId, setActiveRoomId] = useState<string>(GROUP_ROOM.id);
  const activeRoom = rooms.find((r) => r.id === activeRoomId) || GROUP_ROOM;

  // Per-room persisted chat history
  const [messages, setMessages] = usePersistentState<MeetMessage[]>(
    `fekra_meet_chat_${activeRoomId}`,
    [],
  );

  const [input, setInput] = useState('');
  const [callRoom, setCallRoom] = useState<ChatRoom | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeRoomId]);

  // Sender id in BOTH modes: API uuid (live) or directory id p1..p4 (offline)
  const mySenderId = user?.id || myDirId;

  /** Maps a backend chat DTO to the local MeetMessage shape */
  const mapLive = (msg: any): MeetMessage => ({
    id: msg.id,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderInitials: msg.senderInitials || '؟',
    content: msg.content,
    fileName: msg.fileName,
    fileType: msg.fileType,
    dataUrl: msg.dataUrl,
    timestamp: new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  // LIVE MODE: load history from the API + join the socket room
  useEffect(() => {
    if (!isLiveMode) return;
    let cancelled = false;

    api<any[]>(`/chat/rooms/${activeRoom.slug}/messages?take=100`)
      .then((list) => {
        if (!cancelled) setMessages(list.map(mapLive));
      })
      .catch(() => {});

    const sock = getSocket();
    if (!sock) return () => { cancelled = true; };

    sock.emit('chat:join', { slug: activeRoom.slug, type: activeRoom.type, name: activeRoom.title });

    const handler = (msg: any) => {
      if (msg.roomSlug !== activeRoom.slug) return;
      if (msg.senderId === mySenderId) return; // own messages come back via the send-ack
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, mapLive(msg)],
      );
    };
    sock.on('chat:new', handler);

    return () => {
      cancelled = true;
      sock.off('chat:new', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, activeRoomId]);

  const sendMessage = (extra?: Partial<MeetMessage>) => {
    const hasText = input.trim().length > 0;
    if (!hasText && !extra) return;

    const payload = {
      slug: activeRoom.slug,
      type: activeRoom.type,
      name: activeRoom.title,
      content: hasText ? input.trim() : undefined,
      fileName: extra?.fileName,
      fileType: extra?.fileType,
      dataUrl: extra?.dataUrl,
    };

    // LIVE MODE: persist + broadcast via the backend (cross-device, real time)
    if (isLiveMode) {
      const push = (dto: any) =>
        setMessages((prev) =>
          prev.some((m) => m.id === dto.id) ? prev : [...prev, mapLive(dto)],
        );
      const sock = getSocket();
      if (sock) {
        sock.emit('chat:join', { slug: activeRoom.slug, type: activeRoom.type });
        sock.emit('chat:send', payload, (dto: any) => push(dto));
      } else {
        api(`/chat/rooms/${activeRoom.slug}/messages`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
          .then(push)
          .catch((err) => console.error('Send failed:', err));
      }
      setInput('');
      return;
    }

    // OFFLINE MODE: local persisted cache + local notifications
    const msg: MeetMessage = {
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderId: myDirId,
      senderName: user?.name || 'شريك',
      senderInitials: user?.initials || 'P',
      content: hasText ? input.trim() : undefined,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      ...extra,
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');

    // Notify the other participants in this room (offline — local notifications)
    const recipientIds =
      activeRoom.type === 'GROUP'
        ? AUTHORIZED_PARTNERS.filter((p) => p.id !== myDirId).map((p) => p.id)
        : [activeRoom.id.replace('dm-', '').split('-').find((x) => x !== myDirId) || ''];
    pushNotification(
      recipientIds,
      'رسالة جديدة',
      `${user?.name || 'شريك'} بعت رسالة في "${activeRoom.title}"${msg.fileName ? ' (مع ملف مرفق)' : ''} — افتح صفحة الاجتماعات وشوفها.`,
    );
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileError(null);
    if (file.size > MAX_FILE_BYTES) {
      setFileError('الملف أكبر من 1.5 ميجا — ارفع ملفات أصغر أو شاركها من داخل المكالمة.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      sendMessage({
        content: input.trim() || undefined,
        fileName: file.name,
        fileType: file.type,
        dataUrl: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeInUp">
      {/* ================= Rooms Sidebar ================= */}
      <div className="glass-panel rounded-3xl p-4 space-y-3 h-fit lg:sticky lg:top-24">
        <div className="flex items-center gap-2 px-2 pt-1 pb-2 border-b border-surface-border">
          <div className="w-8 h-8 rounded-xl bg-cyan-dim border border-cyan/40 text-cyan flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">غرف الاجتماعات والمحادثات</h3>
            <p className="text-[10px] text-slate-500">محادثة خاصة أو مكالمة مع أي شريك ف أي وقت</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {rooms.map((room) => {
            const isActive = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-start transition-all ${
                  isActive
                    ? 'bg-cyan-dim border-cyan/50 shadow-glow-cyan'
                    : 'bg-white border-surface-border hover:border-cyan/30 hover:bg-surface-card'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                    room.type === 'GROUP'
                      ? 'bg-gradient-to-tr from-cyan to-electric-600 text-white'
                      : 'bg-navy-800 text-cyan border border-surface-border'
                  }`}
                >
                  {room.type === 'GROUP' ? <Users className="w-4 h-4" /> : room.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    {room.title}
                    {room.type === 'GROUP' && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                        جماعية
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{room.subtitle}</p>
                </div>
                <ChevronLeft className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        <div className="p-2.5 rounded-xl bg-surface-card border border-surface-border text-[10px] text-slate-500 flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan shrink-0 mt-0.5" />
          <span>
            نظام مكالمات الفيديو مستقل 100% ومشفر (WebRTC P2P) — كاميرا وميكروفون ومشاركة شاشة بدون أي طرف ثالث أو تسجيل دخول إضافي.
          </span>
        </div>
      </div>

      {/* ================= Chat Panel ================= */}
      <div className="glass-panel rounded-3xl flex flex-col overflow-hidden lg:col-span-3 h-[calc(100vh-240px)] min-h-[480px]">
        {/* Chat header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between gap-3 bg-white/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                activeRoom.type === 'GROUP'
                  ? 'bg-gradient-to-tr from-cyan to-electric-600 text-white'
                  : 'bg-navy-800 text-cyan border border-surface-border'
              }`}
            >
              {activeRoom.type === 'GROUP' ? <Users className="w-4 h-4" /> : activeRoom.initials}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{activeRoom.title}</h3>
              <p className="text-[11px] text-slate-500">
                {activeRoom.type === 'GROUP'
                  ? 'غرفة جماعية دائمة — مكالمة الفيديو مفتوحة للشركاء الأربعة طول الوقت'
                  : 'محادثة خاصة بينك وبين الشريك'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCallRoom(activeRoom)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl electric-gradient-btn text-xs shrink-0"
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">
              {activeRoom.type === 'GROUP' ? 'فتح/انضمام المكالمة الجماعية' : 'بدء مكالمة فيديو'}
            </span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-card/60">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
              <div className="w-14 h-14 rounded-3xl bg-cyan-dim border border-cyan/30 text-cyan flex items-center justify-center">
                {activeRoom.type === 'GROUP' ? <Users className="w-7 h-7" /> : <UserRound className="w-7 h-7" />}
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {activeRoom.type === 'GROUP' ? 'أول واحد يكتب في الغرفة الجماعية 🎉' : 'ابدأ محادثتك الخاصة'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                ابعت نصوص أو ملفات (صور، مستندات، أي حاجة)، أو اضغط زرار المكالمة فوق لفتح فيديو كول
                فيه كاميرا ومشاركة شاشة.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.senderId === mySenderId;
            const isImage = !!msg.dataUrl && (msg.fileType || '').startsWith('image/');
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[78%] space-y-1.5">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-bold text-slate-600">{msg.senderName}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      isMine
                        ? 'bg-cyan text-white rounded-ee-sm'
                        : 'bg-white border border-surface-border text-slate-800 rounded-es-sm'
                    }`}
                  >
                    {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                    {msg.dataUrl && isImage && (
                      <a href={msg.dataUrl} download={msg.fileName} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.dataUrl}
                          alt={msg.fileName}
                          className="mt-2 rounded-xl max-h-44 object-cover border border-black/10"
                        />
                      </a>
                    )}
                    {msg.dataUrl && !isImage && (
                      <a
                        href={msg.dataUrl}
                        download={msg.fileName}
                        className={`mt-2 flex items-center gap-2.5 p-2.5 rounded-xl border ${
                          isMine ? 'bg-white/15 border-white/25' : 'bg-black/5 border-black/10'
                        }`}
                      >
                        <FileIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate font-bold text-[11px]">{msg.fileName}</span>
                        <Download className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-surface-border bg-white">
          {fileError && (
            <p className="px-2 pb-2 text-[10px] text-rose-500 font-bold">{fileError}</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="إرفاق ملف"
              className="p-2.5 rounded-xl bg-surface-card border border-surface-border text-cyan hover:border-cyan/50 transition shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك هنا... (نص، ملاحظة، أي حاجة)"
              className="flex-1 bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan/60 transition"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 rounded-xl electric-gradient-btn disabled:opacity-40 shrink-0"
              title="إرسال"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ================= Call Modal (Self-Hosted WebRTC) ================= */}
      {callRoom && (
        <VideoCallModal
          roomSlug={callRoom.slug}
          roomTitle={callRoom.title}
          roomType={callRoom.type}
          currentUserName={user?.name || 'أنت'}
          onClose={() => setCallRoom(null)}
        />
      )}
    </div>
  );
};
