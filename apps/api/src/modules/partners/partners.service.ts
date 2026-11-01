import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPartners(organizationId: string) {
    const partners = await this.prisma.partner.findMany({
      where: { organizationId },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                lastLoginAt: true,
              },
            },
          },
        },
      },
    });

    return partners.map((p) => ({
      id: p.id,
      memberId: p.memberId,
      userId: p.member.user.id,
      fullName: p.member.user.fullName,
      email: p.member.user.email,
      phone: p.member.user.phone,
      avatarUrl: p.member.user.avatarUrl,
      title: p.title,
      ownership: Number(p.ownership),
      lastLoginAt: p.member.user.lastLoginAt,
    }));
  }

  async getPartnerDetails(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: {
        member: {
          include: {
            user: true,
          },
        },
        votes: {
          include: { decision: true },
          take: 10,
        },
        approvals: {
          include: { transaction: true },
          take: 10,
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Partner record not found');
    }

    return partner;
  }
}
