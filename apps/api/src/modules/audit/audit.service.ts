import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Immutable audit trail — most recent actions first.
   */
  async list(organizationId: string, take = 50) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      include: {
        actor: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 200),
    });
  }
}
