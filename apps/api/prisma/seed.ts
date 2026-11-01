import { PrismaClient, MemberType, MemberStatus, AccountType, TransactionType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FEKRA AI Database Seed...');

  // 1. Create Default Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'fekra-ai' },
    update: {},
    create: {
      name: 'Fekra AI',
      slug: 'fekra-ai',
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      defaultLang: 'ar',
    },
  });

  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // Default default password hash for local development
  const defaultPasswordHash = await argon2.hash('Fekra@2026!');

  // 2. Create the 4 Equal Founding Partners (25% ownership each)
  const partnersData = [
    {
      fullName: 'Mahmoud Ashraf',
      email: 'Mahmoud@fekra.com',
      passwordPlain: '20101510',
      title: 'Managing Partner & Strategy',
      ownership: 25.0,
      phone: '+201015100000',
    },
    {
      fullName: 'Ahmed Elsadny',
      email: 'Elsadny@fekra.com',
      passwordPlain: 'ahmed01285217746',
      title: 'Technical Partner & Technology',
      ownership: 25.0,
      phone: '+201285217746',
    },
    {
      fullName: 'Ahmed Fouda',
      email: 'Fouda@fekra.com',
      passwordPlain: 'fouda11111fekra',
      title: 'Commercial & Financial Partner',
      ownership: 25.0,
      phone: '+201111100000',
    },
    {
      fullName: 'Mohamed Monem',
      email: 'Monem@fekra.com',
      passwordPlain: 'monem1214##fekra',
      title: 'Operations & Execution Partner',
      ownership: 25.0,
      phone: '+201214000000',
    },
  ];

  const createdPartnerMembers: string[] = [];

  for (const p of partnersData) {
    const passwordHash = await argon2.hash(p.passwordPlain);
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        passwordHash,
      },
      create: {
        fullName: p.fullName,
        email: p.email,
        passwordHash,
        phone: p.phone,
        locale: 'ar',
        isActive: true,
      },
    });

    const member = await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        userId: user.id,
        memberType: MemberType.PARTNER,
        status: MemberStatus.ACTIVE,
      },
    });

    createdPartnerMembers.push(member.id);

    await prisma.partner.upsert({
      where: { memberId: member.id },
      update: {
        ownership: p.ownership,
        title: p.title,
      },
      create: {
        organizationId: org.id,
        memberId: member.id,
        ownership: p.ownership,
        title: p.title,
      },
    });

    console.log(`✅ Partner initialized: ${p.fullName} (25% ownership)`);
  }

  // 3. System Roles & Core Permissions
  const permissionsList = [
    { key: 'dashboard.view', module: 'dashboard', description: 'View dashboard metrics' },
    { key: 'partners.view', module: 'partners', description: 'View partner profiles & contributions' },
    { key: 'partners.manage', module: 'partners', description: 'Manage partners and voting' },
    { key: 'employees.view', module: 'employees', description: 'View company employees' },
    { key: 'employees.invite', module: 'employees', description: 'Invite new employees' },
    { key: 'employees.manage', module: 'employees', description: 'Update employee roles and status' },
    { key: 'projects.view', module: 'projects', description: 'View all projects' },
    { key: 'projects.create', module: 'projects', description: 'Create new project' },
    { key: 'projects.update', module: 'projects', description: 'Update project details' },
    { key: 'projects.archive', module: 'projects', description: 'Archive project' },
    { key: 'tasks.view', module: 'tasks', description: 'View tasks' },
    { key: 'tasks.create', module: 'tasks', description: 'Create task' },
    { key: 'tasks.assign', module: 'tasks', description: 'Assign task' },
    { key: 'tasks.review', module: 'tasks', description: 'Review and approve task completion' },
    { key: 'work_logs.create', module: 'work_logs', description: 'Log working hours' },
    { key: 'work_logs.view', module: 'work_logs', description: 'View team working hours' },
    { key: 'work_logs.approve', module: 'work_logs', description: 'Approve submitted working hours' },
    { key: 'daily_reports.create', module: 'daily_reports', description: 'Submit daily report' },
    { key: 'daily_reports.view', module: 'daily_reports', description: 'Review team daily reports' },
    { key: 'finance.view', module: 'finance', description: 'Full access to company financial records' },
    { key: 'finance.transactions.create', module: 'finance', description: 'Register income or expense' },
    { key: 'finance.transactions.approve', module: 'finance', description: 'Vote on partner expense approval' },
    { key: 'decisions.create', module: 'decisions', description: 'Create company governance decision' },
    { key: 'decisions.vote', module: 'decisions', description: 'Vote on governance decisions' },
    { key: 'audit_logs.view', module: 'audit_logs', description: 'View security and change logs' },
    { key: 'settings.manage', module: 'settings', description: 'Configure organization settings' },
  ];

  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }

  // Create Partner Role with all permissions
  const partnerRole = await prisma.role.upsert({
    where: {
      organizationId_name: {
        organizationId: org.id,
        name: 'Partner',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Partner',
      description: 'Founding Partner with equal voting rights and full financial transparency',
      isSystem: true,
    },
  });

  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: partnerRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: partnerRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign Partner role to the 4 partners
  for (const memberId of createdPartnerMembers) {
    await prisma.userRole.upsert({
      where: {
        memberId_roleId_businessUnitId_departmentId: {
          memberId,
          roleId: partnerRole.id,
          businessUnitId: null as any,
          departmentId: null as any,
        },
      },
      update: {},
      create: {
        memberId,
        roleId: partnerRole.id,
      },
    });
  }

  // 4. Default Business Units
  const buAI = await prisma.businessUnit.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'BU-AI' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Artificial Intelligence & Software Solutions',
      code: 'BU-AI',
      description: 'Core AI products and custom software engineering unit',
    },
  });

  const buConsulting = await prisma.businessUnit.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'BU-DTC' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Digital Transformation & Strategic Consulting',
      code: 'BU-DTC',
      description: 'Consulting, architecture design, and enterprise advisory unit',
    },
  });

  // 5. Default Departments
  await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'ENG' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Engineering & Development',
      code: 'ENG',
      description: 'Software development, cloud architecture, and QA',
    },
  });

  await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'FIN-OPS' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Finance & Operations',
      code: 'FIN-OPS',
      description: 'Operational tracking, partner governance, and company treasury',
    },
  });

  // 6. Financial Accounts
  const cibAccount = await prisma.financialAccount.create({
    data: {
      organizationId: org.id,
      name: 'CIB Corporate Main Account',
      accountType: AccountType.BANK,
      currency: 'EGP',
      openingBalance: 750000.0,
      isActive: true,
    },
  });

  await prisma.financialAccount.create({
    data: {
      organizationId: org.id,
      name: 'Main Operating Cash Wallet',
      accountType: AccountType.CASH,
      currency: 'EGP',
      openingBalance: 35000.0,
      isActive: true,
    },
  });

  // 7. Financial Categories
  await prisma.financialCategory.createMany({
    skipDuplicates: true,
    data: [
      { organizationId: org.id, name: 'Client Software Contracts', transactionType: TransactionType.INCOME },
      { organizationId: org.id, name: 'AI Advisory Retainers', transactionType: TransactionType.INCOME },
      { organizationId: org.id, name: 'Cloud Infrastructure & Servers', transactionType: TransactionType.EXPENSE },
      { organizationId: org.id, name: 'Engineering Salaries & Contractors', transactionType: TransactionType.EXPENSE },
      { organizationId: org.id, name: 'Office & Facilities', transactionType: TransactionType.EXPENSE },
      { organizationId: org.id, name: 'Legal, Licensing & Compliance', transactionType: TransactionType.EXPENSE },
    ],
  });

  console.log('🎉 Seed completed successfully! 4 Equal Partners & initial structure active.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
