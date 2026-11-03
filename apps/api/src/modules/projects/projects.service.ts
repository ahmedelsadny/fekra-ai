import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectStatus, TaskStatus, Priority, NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** List all organization projects */
  async listProjects(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        businessUnit: { select: { name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description ?? '',
      budget: p.budget ? Number(p.budget) : 0,
      currency: p.currency,
      status: p.status,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
      businessUnit: p.businessUnit?.name ?? '',
      tasksCount: p._count.tasks,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /** Create a project — auto-code + default business unit when not provided */
  async createProject(params: {
    organizationId: string;
    userId: string;
    name: string;
    code?: string;
    description?: string;
    budget?: number;
    startDate?: string;
    dueDate?: string;
    businessUnitId?: string;
  }) {
    const businessUnit = params.businessUnitId
      ? await this.prisma.businessUnit.findFirst({
          where: { id: params.businessUnitId, organizationId: params.organizationId },
        })
      : await this.prisma.businessUnit.findFirst({ where: { organizationId: params.organizationId } });
    if (!businessUnit) {
      throw new BadRequestException('No business unit found — run the database seed first');
    }

    const project = await this.prisma.project.create({
      data: {
        organizationId: params.organizationId,
        businessUnitId: businessUnit.id,
        name: params.name,
        code: params.code || `PRJ-${Date.now().toString().slice(-6)}`,
        description: params.description ?? null,
        budget: params.budget ?? null,
        currency: 'EGP',
        status: ProjectStatus.PLANNING,
        startDate: params.startDate ? new Date(params.startDate) : new Date(),
        dueDate: params.dueDate ? new Date(params.dueDate) : null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.userId,
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: project.id,
        newValues: { name: project.name, code: project.code },
      },
    });

    return project;
  }

  /** List tasks (optionally per project) */
  async listTasks(organizationId: string, projectId?: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        organizationId,
        ...(projectId ? { projectId } : {}),
        deletedAt: null,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      projectName: t.project?.name ?? '',
      title: t.title,
      description: t.description ?? '',
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
      estimatedHours: t.estimatedHours ? Number(t.estimatedHours) : null,
      assigneeId: t.assignedTo?.id ?? null,
      assigneeName: t.assignedTo?.fullName ?? '',
      assigneeInitials: (t.assignedTo?.fullName || '')
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      createdById: t.createdById,
      createdByName: t.createdBy?.fullName ?? '',
      createdAt: t.createdAt.toISOString(),
    }));
  }

  /** Create a task + notify the assignee in real time */
  async createTask(params: {
    organizationId: string;
    userId: string;
    projectId: string;
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: string;
    estimatedHours?: number;
    assignedToId?: string;
  }) {
    const project = await this.prisma.project.findFirst({
      where: { id: params.projectId, organizationId: params.organizationId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found in this organization');

    const task = await this.prisma.task.create({
      data: {
        organizationId: params.organizationId,
        projectId: project.id,
        createdById: params.userId,
        title: params.title,
        description: params.description ?? null,
        priority: params.priority ?? Priority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: params.dueDate ? new Date(params.dueDate) : null,
        estimatedHours: params.estimatedHours ?? null,
        assignedToId: params.assignedToId ?? null,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.userId,
        action: 'TASK_CREATED',
        entityType: 'Task',
        entityId: task.id,
        newValues: { title: task.title, projectId: project.id, assignedToId: task.assignedToId },
      },
    });

    // Real-time + persistent notification for the assignee
    if (task.assignedToId && task.assignedToId !== params.userId) {
      await this.notifications.notifyUsers(params.organizationId, [task.assignedToId], {
        title: 'إسناد مهمة جديدة',
        body: `تم إسناد مهمة "${task.title}" في مشروع "${project.name}" لك — راجع صفحة المشاريع والمهام.`,
        type: NotificationType.TASK_ASSIGNED,
        referenceId: task.id,
      });
    }

    return task;
  }

  /** Update task status (+ notify the assignee when someone else changes it) */
  async updateTaskStatus(params: {
    organizationId: string;
    userId: string;
    taskId: string;
    status: TaskStatus;
  }) {
    const task = await this.prisma.task.findFirst({
      where: { id: params.taskId, organizationId: params.organizationId, deletedAt: null },
      include: { project: { select: { name: true } } },
    });
    if (!task) throw new NotFoundException('Task not found in this organization');

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        status: params.status,
        completedAt: params.status === TaskStatus.DONE ? new Date() : null,
      },
    });

    await this.prisma.taskStatusHistory.create({
      data: {
        taskId: task.id,
        changedById: params.userId,
        oldStatus: task.status,
        newStatus: params.status,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.userId,
        action: 'TASK_STATUS_UPDATED',
        entityType: 'Task',
        entityId: task.id,
        newValues: { from: task.status, to: params.status },
      },
    });

    if (task.assignedToId && task.assignedToId !== params.userId) {
      await this.notifications.notifyUsers(params.organizationId, [task.assignedToId], {
        title: 'تحديث على مهمتك',
        body: `حالة مهمة "${task.title}" في مشروع "${task.project?.name}" اتغيرت إلى: ${params.status}`,
        type: NotificationType.TASK_UPDATED,
        referenceId: task.id,
      });
    }

    return updated;
  }
}
