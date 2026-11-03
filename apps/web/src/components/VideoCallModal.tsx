'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Users,
  ShieldCheck,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Volume2,
} from 'lucide-react';

interface VideoCallModalProps {
  roomSlug: string;
  roomTitle: string;
  roomType: 'GROUP' | 'DM';
  currentUserName?: string;
  onClose: () => void;
}

interface PeerInfo {
  peerId: string;
  userId?: string;
  fullName?: string;
  stream?: MediaStream;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
];

/**
 * Individual participant video card component
 */
const ParticipantTile: React.FC<{
  stream?: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenShare?: boolean;
}> = ({ stream, name, isLocal = false, isMuted = false, isVideoOff = false, isScreenShare = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '؟';

  return (
    <div className="relative group w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-navy-900/90 border border-white/10 shadow-xl flex items-center justify-center transition-all duration-300">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Mute own video to prevent local audio echo feedback
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isVideoOff ? 'opacity-0' : 'opacity-100'
        } ${isLocal && !isScreenShare ? '-scale-x-100' : ''}`}
      />

      {/* Fallback Avatar when camera is disabled */}
      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-[#0B2447] p-6 text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-cyan via-electric-500 to-electric-600 text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-glow-cyan animate-pulse">
              {initials}
            </div>
            {isMuted && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center border-2 border-navy-900 shadow">
                <MicOff className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          <span className="text-sm font-bold text-white tracking-wide">{name}</span>
          <span className="text-[11px] text-slate-400 mt-1">الكاميرا متوقفة</span>
        </div>
      )}

      {/* Top Participant Badge */}
      <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-950/70 backdrop-blur-md border border-white/10 text-white text-xs font-semibold z-10">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
        <span className="truncate max-w-[140px]">{name} {isLocal ? '(أنت)' : ''}</span>
      </div>

      {/* Bottom Status Indicators */}
      <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1.5">
          {isMuted && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/80 backdrop-blur-md text-white text-[11px] font-medium border border-rose-400/30">
              <MicOff className="w-3 h-3" />
              <span>مكتوم</span>
            </span>
          )}
          {isScreenShare && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan/80 backdrop-blur-md text-navy-950 text-[11px] font-bold">
              <Monitor className="w-3 h-3" />
              <span>مشاركة شاشة</span>
            </span>
          )}
        </div>

        <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-[10px] text-slate-300 font-mono" dir="ltr">
          {isLocal ? 'LOCAL' : 'P2P ENCRYPTED'}
        </span>
      </div>
    </div>
  );
};

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  roomSlug,
  roomTitle,
  roomType,
  currentUserName = 'أنت',
  onClose,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, PeerInfo>>(new Map());
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // Keep ref synchronized
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Helper: create a PeerConnection for a specific target socket
  const createPeerConnection = useCallback((targetSocketId: string, peerName?: string): RTCPeerConnection => {
    // If connection already exists, return it
    if (peersRef.current.has(targetSocketId)) {
      return peersRef.current.get(targetSocketId)!;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // 1. Add existing local tracks to this connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // 2. Handle remote track event
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemotePeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(targetSocketId) || { peerId: targetSocketId };
        next.set(targetSocketId, {
          ...existing,
          fullName: peerName || existing.fullName || 'شريك',
          stream: remoteStream,
        });
        return next;
      });
    };

    // 3. Handle ICE candidates generated locally -> forward via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket?.emit('call:ice-candidate', {
          targetSocketId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // 4. Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(targetSocketId);
      }
    };

    peersRef.current.set(targetSocketId, pc);
    return pc;
  }, []);

  // Helper: cleanup a peer connection
  const cleanupPeer = useCallback((socketId: string) => {
    const pc = peersRef.current.get(socketId);
    if (pc) {
      pc.close();
      peersRef.current.delete(socketId);
    }
    pendingCandidatesRef.current.delete(socketId);
    setRemotePeers((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  // Helper: flush queued candidates after remote description is set
  const flushCandidates = async (socketId: string, pc: RTCPeerConnection) => {
    const queue = pendingCandidatesRef.current.get(socketId) || [];
    for (const cand of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch {
        /* ignore invalid candidates */
      }
    }
    pendingCandidatesRef.current.delete(socketId);
  };

  // Initialize media & WebRTC signaling
  useEffect(() => {
    let isCancelled = false;

    // Check secure context
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setWarningMsg('المتصفح يشترط اتصال HTTPS آمن لتشغيل الكاميرا والميكروفون.');
    }

    const startCall = async () => {
      let stream: MediaStream;
      try {
        // Try requesting both camera and audio
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch (err: any) {
        console.warn('Camera failed, falling back to audio only', err);
        try {
          // Fallback: audio only if camera is unavailable or denied
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          setIsCameraOff(true);
        } catch (e: any) {
          setWarningMsg('تعذر الوصول إلى الكاميرا أو الميكروفون. يرجى السماح بالصلاحيات من إعدادات المتصفح.');
          // Create empty silent stream so signaling can still join room
          stream = new MediaStream();
        }
      }

      if (isCancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;

      const socket = getSocket();
      if (!socket) {
        setWarningMsg('غير متصل بالسيرفر — تأكد من الاتصال.');
        return;
      }

      // Join the call signaling room
      socket.emit('call:join', { roomSlug });

      // 1. Existing peers already in the room: initiate offer to each
      const handleExistingPeers = async ({ peers }: { peers: Array<{ peerId: string; fullName?: string }> }) => {
        for (const peer of peers) {
          const pc = createPeerConnection(peer.peerId, peer.fullName);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('call:offer', {
              targetSocketId: peer.peerId,
              offer,
              roomSlug,
            });
          } catch (err) {
            console.error('Failed to create offer for peer', peer.peerId, err);
          }
        }
      };

      // 2. A new peer joined: prepare placeholder in UI
      const handlePeerJoined = ({ peerId, fullName }: { peerId: string; fullName?: string }) => {
        setRemotePeers((prev) => {
          const next = new Map(prev);
          if (!next.has(peerId)) {
            next.set(peerId, { peerId, fullName });
          }
          return next;
        });
      };

      // 3. Receive an offer from another peer: answer it
      const handleOffer = async ({
        offer,
        fromSocketId,
        fromName,
      }: {
        offer: any;
        fromSocketId: string;
        fromName?: string;
      }) => {
        const pc = createPeerConnection(fromSocketId, fromName);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushCandidates(fromSocketId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:answer', {
            targetSocketId: fromSocketId,
            answer,
          });
        } catch (err) {
          console.error('Error handling offer from', fromSocketId, err);
        }
      };

      // 4. Receive answer
      const handleAnswer = async ({ answer, fromSocketId }: { answer: any; fromSocketId: string }) => {
        const pc = peersRef.current.get(fromSocketId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await flushCandidates(fromSocketId, pc);
          } catch (err) {
            console.error('Error setting remote description from answer', err);
          }
        }
      };

      // 5. Receive ICE candidate
      const handleIceCandidate = async ({ candidate, fromSocketId }: { candidate: any; fromSocketId: string }) => {
        const pc = peersRef.current.get(fromSocketId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding received ice candidate', err);
          }
        } else {
          // Queue candidate until remote description is set
          const q = pendingCandidatesRef.current.get(fromSocketId) || [];
          q.push(candidate);
          pendingCandidatesRef.current.set(fromSocketId, q);
        }
      };

      // 6. Peer left
      const handlePeerLeft = ({ peerId }: { peerId: string }) => {
        cleanupPeer(peerId);
      };

      socket.on('call:existing-peers', handleExistingPeers);
      socket.on('call:peer-joined', handlePeerJoined);
      socket.on('call:offer', handleOffer);
      socket.on('call:answer', handleAnswer);
      socket.on('call:ice-candidate', handleIceCandidate);
      socket.on('call:peer-left', handlePeerLeft);
    };

    startCall();

    return () => {
      isCancelled = true;
      const socket = getSocket();
      if (socket) {
        socket.emit('call:leave', { roomSlug });
        socket.off('call:existing-peers');
        socket.off('call:peer-joined');
        socket.off('call:offer');
        socket.off('call:answer');
        socket.off('call:ice-candidate');
        socket.off('call:peer-left');
      }

      // Close all peer connections
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      pendingCandidatesRef.current.clear();

      // Stop all media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomSlug, createPeerConnection, cleanupPeer]);

  // Toggle Microphone
  const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicMuted(!audioTrack.enabled);
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  };

  // Replace video track across all active peer connections
  const replaceVideoTrack = (newTrack: MediaStreamTrack | null) => {
    peersRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      if (videoSender && newTrack) {
        videoSender.replaceTrack(newTrack);
      }
    });
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (cameraTrackRef.current) {
        replaceVideoTrack(cameraTrackRef.current);
        // Replace in local stream
        if (localStream) {
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack && oldTrack !== cameraTrackRef.current) {
            oldTrack.stop();
            localStream.removeTrack(oldTrack);
            localStream.addTrack(cameraTrackRef.current);
          }
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        replaceVideoTrack(screenTrack);

        if (localStream) {
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) {
            localStream.removeTrack(oldTrack);
          }
          localStream.addTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share cancelled or failed', err);
      }
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const peersArray = Array.from(remotePeers.values());
  const totalCount = peersArray.length + 1; // peers + local

  // Determine grid columns
  const getGridClass = () => {
    if (totalCount === 1) return 'grid-cols-1';
    if (totalCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalCount === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2';
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#051329]/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-scaleIn">
      <div
        ref={containerRef}
        className="relative w-full max-w-7xl h-[92vh] max-h-[950px] rounded-3xl bg-[#071936] border border-cyan/25 shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-navy-950/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan via-electric-500 to-electric-600 text-white flex items-center justify-center shadow-glow-cyan shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">{roomTitle}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-dim border border-cyan/40 text-cyan">
                  {roomType === 'GROUP' ? 'مكالمة جماعية' : 'محادثة خاصة'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono" dir="ltr">
                Room: {roomSlug} • {totalCount} {totalCount === 1 ? 'مشارك' : 'مشاركون'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition"
              title={isFullscreen ? 'خروج من الشاشة الكاملة' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-bold transition shadow-lg shadow-rose-950/30"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">إنهاء المكالمة</span>
            </button>
          </div>
        </div>

        {/* Warning notification banner if any */}
        {warningMsg && (
          <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{warningMsg}</span>
          </div>
        )}

        {/* Video Tiles Grid */}
        <div className={`flex-1 p-3 sm:p-5 overflow-y-auto grid ${getGridClass()} gap-3 sm:gap-4 items-stretch content-center bg-gradient-to-b from-[#071936] to-[#040e1f]`}>
          {/* 1. Local Participant Tile (Always Shown) */}
          <ParticipantTile
            stream={localStream}
            name={currentUserName}
            isLocal={true}
            isMuted={isMicMuted}
            isVideoOff={isCameraOff}
            isScreenShare={isScreenSharing}
          />

          {/* 2. Remote Participant Tiles */}
          {peersArray.map((peer) => (
            <ParticipantTile
              key={peer.peerId}
              stream={peer.stream}
              name={peer.fullName || 'شريك'}
              isLocal={false}
              isMuted={false}
              isVideoOff={!peer.stream || peer.stream.getVideoTracks().length === 0}
            />
          ))}

          {/* Empty state hint if only local user is in the room */}
          {peersArray.length === 0 && (
            <div className="hidden lg:flex flex-col items-center justify-center p-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-cyan-dim border border-cyan/30 text-cyan flex items-center justify-center mb-3">
                <Users className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">في انتظار انضمام الشركاء...</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                أي شريك يدخل غرفة الاجتماعات ويضغط &quot;فتح المكالمة&quot; سينضم إليك في هذا الميتنج مباشرة وبشكل مشفر P2P.
              </p>
            </div>
          )}
        </div>

        {/* Floating Bottom Toolbar */}
        <div className="px-6 py-4 bg-navy-950/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan" />
            <span>اتصال مباشر مشفر 100% بدون خوادم وسيطة</span>
          </div>

          {/* Center Call Control Buttons */}
          <div className="flex items-center gap-3 mx-auto">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 ${
                isMicMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
              title={isMicMuted ? 'تشغيل الميكروفون' : 'كتم الميكروفون'}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-cyan" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 ${
                isCameraOff
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
              title={isCameraOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5 text-cyan" />}
            </button>

            {/* Screen Share Toggle */}
            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 ${
                isScreenSharing
                  ? 'bg-cyan text-navy-950 shadow-glow-cyan'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
              title={isScreenSharing ? 'إيقاف مشاركة الشاشة' : 'مشاركة الشاشة'}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </button>

            {/* Leave / Hang Up */}
            <button
              onClick={onClose}
              className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-rose-950/50 transition-all hover:scale-105"
              title="مغادرة المكالمة"
            >
              <PhoneOff className="w-5 h-5" />
              <span>مغادرة</span>
            </button>
          </div>

          <div className="hidden sm:block text-xs font-mono text-slate-400" dir="ltr">
            FEKRA WebRTC v2.0
          </div>
        </div>
      </div>
    </div>
  );
};
