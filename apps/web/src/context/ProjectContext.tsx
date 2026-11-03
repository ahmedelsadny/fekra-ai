'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, AUTHORIZED_PARTNERS } from './AuthContext';
import { usePersistentState } from '../hooks/usePersistentState';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export interface ProjectItem {
  id: string;
  name: string;
  code: string;
  businessUnit: string;
  managerName: string;
  managerInitials: string;
  budget: number;
  currency: string;
  startDate: string;
  dueDate: string;
  status: 'ACTIVE' | 'PLANNING' | 'COMPLETED';
  description: string;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  content: string;
  timestamp: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId: string;
  assigneeName: string;
  assigneeInitials: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  dueDate: string;
  estimatedHours: number;
  mentionedPartnerId?: string;
}

export interface SystemNotification {
  id: string;
  recipientId: string;
  senderName: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  projectId?: string;
}

// ============================================================
// NO MOCK DATA — the whole system starts completely EMPTY.
// Real data comes from the backend API (live mode);
// offline/demo mode starts from zero and grows with user actions.
// ============================================================

interface ProjectContextType {
  projects: ProjectItem[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  activeProject: ProjectItem | undefined;
  addProject: (data: Omit<ProjectItem, 'id'>) => void;
  /** True when projects/tasks are served from the backend API */
  isLiveMode: boolean;
  messages: ProjectMessage[];
  sendMessage: (projectId: string, content: string) => void;
  tasks: ProjectTask[];
  addTask: (task: Omit<ProjectTask, 'id'>) => void;
  updateTaskStatus: (taskId: string, status: ProjectTask['status']) => void;
  notifications: SystemNotification[];
  userNotifications: SystemNotification[];
  unreadCount: number;
  markNotificationsAsRead: () => void;
  /**
   * Offline notifier — stores a local notification for the given recipients.
   * In live mode, real cross-device notifications are handled by the backend.
   */
  pushNotification: (recipientIds: string[], title: string, message: string) => void;
  /** Re-hydrates projects & tasks from the backend (no-op in offline mode) */
  refreshFromApi: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user, isLiveMode: authLive } = useAuth();

  // Persisted state (v2 keys — clean break from any legacy mock data)
  const [projects, setProjects] = usePersistentState<ProjectItem[]>('fekra_projects_v2', []);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [messages, setMessages] = usePersistentState<ProjectMessage[]>('fekra_project_messages_v2', []);
  const [tasks, setTasks] = usePersistentState<ProjectTask[]>('fekra_project_tasks_v2', []);
  const [notifications, setNotifications] = usePersistentState<SystemNotification[]>('fekra_notifications_v2', []);
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Directory id (p1..p4) ↔ API user id maps for live-mode task assignment
  const dirToUser = useRef<Record<string, string>>({});

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const myDirId = AUTHORIZED_PARTNERS.find(
    (p) => p.email.toLowerCase() === (user?.email || '').toLowerCase(),
  )?.id;

  /** Hydrates projects & tasks from the backend (live mode) */
  const refreshFromApi = useCallback(async () => {
    try {
      const [apiProjects, apiTasks, apiPartners] = await Promise.all([
        api<any[]>('/projects'),
        api<any[]>('/tasks'),
        api<any[]>('/partners'),
      ]);

      // Build directory-id → user-id map (for task assignment)
      const map: Record<string, string> = {};
      for (const partner of apiPartners) {
        const dir = AUTHORIZED_PARTNERS.find(
          (p) => p.email.toLowerCase() === (partner.email || '').toLowerCase(),
        );
        if (dir) map[dir.id] = partner.userId;
      }
      dirToUser.current = map;

      setProjects(
        apiProjects.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          businessUnit: p.businessUnit || '—',
          managerName: '—',
          managerInitials: '—',
          budget: p.budget ?? 0,
          currency: 'ج.م',
          startDate: (p.startDate || '').slice(0, 10),
          dueDate: (p.dueDate || '').slice(0, 10),
          status: (['PLANNING', 'ACTIVE', 'COMPLETED'].includes(p.status) ? p.status : 'PLANNING') as ProjectItem['status'],
          description: p.description || '',
        })),
      );

      setTasks(
        apiTasks.map((t) => ({
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          description: t.description || '',
          assigneeId: t.assigneeId || '',
          assigneeName: t.assigneeName || '—',
          assigneeInitials: t.assigneeInitials || '—',
          priority: (['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(t.priority) ? t.priority : 'MEDIUM') as ProjectTask['priority'],
          status: (['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(t.status) ? t.status : 'TODO') as ProjectTask['status'],
          dueDate: t.dueDate || '',
          estimatedHours: t.estimatedHours ?? 0,
        })),
      );

      setIsLiveMode(true);
    } catch {
      setIsLiveMode(false);
    }
  }, []);

  // Fetch live data once the session is authenticated with the backend
  useEffect(() => {
    if (authLive) refreshFromApi();
  }, [authLive, refreshFromApi]);

  /** Live project chat — socket room `project-<projectId>` */
  useEffect(() => {
    if (!authLive) return;
    const sock = getSocket();
    if (!sock) return;

    const handler = (msg: any) => {
      if (!msg?.roomSlug?.startsWith('project-')) return;
      const projectId = msg.roomSlug.replace('project-', '');
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id)
          ? prev
          : [
              ...prev,
              {
                id: msg.id,
                projectId,
                senderId: msg.senderId,
                senderName: msg.senderName,
                senderInitials: msg.senderInitials || '؟',
                content: msg.content || (msg.fileName ? `📎 ${msg.fileName}` : ''),
                timestamp: new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
              },
            ],
      );
    };

    sock.on('chat:new', handler);
    return () => {
      sock.off('chat:new', handler);
    };
  }, [authLive]);

  const addProject = (data: Omit<ProjectItem, 'id'>) => {
    // LIVE MODE: create on the backend, then refresh from the source of truth
    if (isLiveMode) {
      api('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          budget: data.budget || undefined,
          startDate: data.startDate || undefined,
          dueDate: data.dueDate || undefined,
        }),
      })
        .then(() => refreshFromApi())
        .catch((err) => console.error('Create project failed:', err));
      return;
    }

    // OFFLINE MODE
    const newPrj: ProjectItem = { id: `prj-${Date.now().toString().slice(-6)}`, ...data };
    setProjects((prev) => [newPrj, ...prev]);
    setActiveProjectId(newPrj.id);
  };

  const sendMessage = (projectId: string, content: string) => {
    if (!content.trim() || !user) return;

    // LIVE MODE: send via the socket room `project-<projectId>`
    if (isLiveMode) {
      const slug = `project-${projectId}`;
      const push = (dto: any) =>
        setMessages((prev) =>
          prev.some((m) => m.id === dto.id)
            ? prev
            : [
                ...prev,
                {
                  id: dto.id,
                  projectId,
                  senderId: dto.senderId,
                  senderName: dto.senderName,
                  senderInitials: dto.senderInitials || user.initials,
                  content: dto.content || (dto.fileName ? `📎 ${dto.fileName}` : ''),
                  timestamp: new Date(dto.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                },
              ],
        );

      const sock = getSocket();
      if (sock) {
        sock.emit('chat:join', { slug, type: 'PROJECT' });
        sock.emit('chat:send', { slug, type: 'PROJECT', content: content.trim() }, (dto: any) => push(dto));
      } else {
        api(`/chat/rooms/${slug}/messages`, {
          method: 'POST',
          body: JSON.stringify({ type: 'PROJECT', content: content.trim() }),
        })
          .then(push)
          .catch((err) => console.error('Send message failed:', err));
      }
      return;
    }

    // OFFLINE MODE (local cache)
    const newMsg: ProjectMessage = {
      id: `msg-${Date.now()}`,
      projectId,
      senderId: user.id,
      senderName: user.name,
      senderInitials: user.initials,
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const addTask = (taskData: Omit<ProjectTask, 'id'>) => {
    // LIVE MODE: create on the backend (server notifies the assignee in real time)
    if (isLiveMode) {
      const assignedUserId = taskData.assigneeId ? dirToUser.current[taskData.assigneeId] : undefined;
      api('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          projectId: taskData.projectId,
          title: taskData.title,
          description: taskData.description || undefined,
          priority: taskData.priority,
          dueDate: taskData.dueDate || undefined,
          estimatedHours: taskData.estimatedHours || undefined,
          assignedToId: assignedUserId || undefined,
        }),
      })
        .then(() => refreshFromApi())
        .catch((err) => console.error('Create task failed:', err));
      return;
    }

    // OFFLINE MODE
    const newTask: ProjectTask = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      ...taskData,
    };
    setTasks((prev) => [newTask, ...prev]);

    // Local notification if a partner is mentioned/assigned
    const targetRecipientId = taskData.mentionedPartnerId || taskData.assigneeId;
    if (targetRecipientId) {
      const prj = projects.find((p) => p.id === taskData.projectId);
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          recipientId: targetRecipientId,
          senderName: user?.name || 'أحد الشركاء',
          title: 'إسناد وإشارة في مهمة جديدة',
          message: `قام ${user?.name || 'شريك'} بالإشارة إليك وإسناد مهمة "${taskData.title}" بمشروع "${prj?.name || 'المشروع'}".`,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
          projectId: taskData.projectId,
        },
        ...prev,
      ]);
    }
  };

  const updateTaskStatus = (taskId: string, status: ProjectTask['status']) => {
    // LIVE MODE
    if (isLiveMode) {
      api(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
        .then(() => refreshFromApi())
        .catch((err) => console.error('Update task failed:', err));
      return;
    }

    // OFFLINE MODE
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  };

  // Filter notifications for the current authenticated partner.
  // Matches by API user id (live mode), directory id (p1..p4) and 'all' broadcasts.
  const userNotifications = notifications.filter(
    (n) =>
      !user ||
      n.recipientId === user.id ||
      n.recipientId === myDirId ||
      n.recipientId === 'all',
  );
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  /** Offline notifier — local notifications for the given recipients */
  const pushNotification = (recipientIds: string[], title: string, message: string) => {
    if (!user || recipientIds.length === 0) return;
    setNotifications((prev) => [
      ...recipientIds.map((recipientId) => ({
        id: `notif-${Date.now()}-${recipientId}`,
        recipientId,
        senderName: user.name,
        title,
        message,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
      })),
      ...prev,
    ]);
  };

  const markNotificationsAsRead = () => {
    if (!user) return;
    setNotifications((prev) =>
      prev.map((n) => (n.recipientId === user.id ? { ...n, isRead: true } : n)),
    );
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        setActiveProjectId,
        activeProject,
        addProject,
        isLiveMode,
        messages,
        sendMessage,
        tasks,
        addTask,
        updateTaskStatus,
        notifications,
        userNotifications,
        unreadCount,
        markNotificationsAsRead,
        pushNotification,
        refreshFromApi,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
