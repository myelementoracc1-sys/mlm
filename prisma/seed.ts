import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Fast Forward database seeding...');

  // 1. Create Wallet Definitions
  console.log('Creating wallet definitions...');
  await prisma.walletDefinition.upsert({
    where: { code: 'FF' },
    update: {},
    create: {
      code: 'FF',
      name: 'Fast Forward Wallet',
      description: 'Primary Fast Forward brand rewards wallet (50% default allocation, configurable cap)',
      cap: '100.00',
      overflowDestinationCode: 'CASH',
      isActive: true,
    },
  });

  await prisma.walletDefinition.upsert({
    where: { code: 'RIDE' },
    update: {},
    create: {
      code: 'RIDE',
      name: 'Ride Wallet',
      description: 'Passenger ride credits wallet (20% default allocation, configurable cap)',
      cap: '50.00',
      overflowDestinationCode: 'CASH',
      isActive: true,
    },
  });

  await prisma.walletDefinition.upsert({
    where: { code: 'CASH' },
    update: {},
    create: {
      code: 'CASH',
      name: 'Cash Wallet',
      description: 'Uncapped cash earnings wallet (30% default allocation + overflow receiver)',
      cap: null,
      isActive: true,
    },
  });

  await prisma.walletDefinition.upsert({
    where: { code: 'PETROL_CARD' },
    update: {},
    create: {
      code: 'PETROL_CARD',
      name: 'Petrol Card Wallet',
      description: 'Driver fuel allocation wallet (50% driver subscription split)',
      cap: null,
      isActive: true,
    },
  });

  // 2. Create Users & Members
  console.log('Creating system users & members...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@fastforward.com' },
    update: {},
    create: {
      email: 'superadmin@fastforward.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@fastforward.com' },
    update: {},
    create: {
      email: 'admin@fastforward.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // Members Hierarchy
  const memberData = [
    { email: 'member.root@fastforward.com', code: 'FF100000', first: 'Arthur', last: 'Pendleton' },
    { email: 'member.alpha@fastforward.com', code: 'FF100001', first: 'Alice', last: 'Vance' },
    { email: 'member.beta@fastforward.com', code: 'FF100002', first: 'Bob', last: 'Builder' },
    { email: 'member.gamma@fastforward.com', code: 'FF100003', first: 'Charlie', last: 'Crown' },
    { email: 'member.delta@fastforward.com', code: 'FF100004', first: 'David', last: 'Duke' },
    { email: 'member.epsilon@fastforward.com', code: 'FF100005', first: 'Eve', last: 'Elm' },
    { email: 'member.zeta@fastforward.com', code: 'FF100006', first: 'Frank', last: 'Foster' },
  ];

  const createdMembers: Record<string, any> = {};

  for (const m of memberData) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        passwordHash,
        role: 'MEMBER',
      },
    });

    const mem = await prisma.member.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        memberCode: m.code,
        firstName: m.first,
        lastName: m.last,
        phone: '+27123456789',
        status: 'ACTIVE',
      },
    });

    createdMembers[m.code] = mem;

    for (const wCode of ['FF', 'RIDE', 'CASH', 'PETROL_CARD']) {
      await prisma.memberWallet.upsert({
        where: { memberId_walletCode: { memberId: mem.id, walletCode: wCode } },
        update: {},
        create: {
          memberId: mem.id,
          walletCode: wCode,
          cachedBalance: '0',
        },
      });
    }
  }

  // 3. Establish Sponsorship & Matrix Relationships
  console.log('Establishing sponsorship & matrix tree...');
  const rootMember = createdMembers['FF100000'];

  const level1Codes = ['FF100001', 'FF100002', 'FF100003', 'FF100004', 'FF100005'];
  for (let i = 0; i < level1Codes.length; i++) {
    const childMem = createdMembers[level1Codes[i]];

    await prisma.sponsorRelationship.upsert({
      where: { referredMemberId: childMem.id },
      update: {},
      create: {
        sponsorId: rootMember.id,
        referredMemberId: childMem.id,
      },
    });

    await prisma.matrixPlacement.upsert({
      where: { childMemberId: childMem.id },
      update: {},
      create: {
        parentMemberId: rootMember.id,
        childMemberId: childMem.id,
        position: i + 1,
        level: 1,
      },
    });
  }

  const zetaMember = createdMembers['FF100006'];
  const alphaMember = createdMembers['FF100001'];

  await prisma.sponsorRelationship.upsert({
    where: { referredMemberId: zetaMember.id },
    update: {},
    create: {
      sponsorId: alphaMember.id,
      referredMemberId: zetaMember.id,
    },
  });

  await prisma.matrixPlacement.upsert({
    where: { childMemberId: zetaMember.id },
    update: {},
    create: {
      parentMemberId: alphaMember.id,
      childMemberId: zetaMember.id,
      position: 1,
      level: 2,
    },
  });

  // 4. Create Compensation Plan Version 1
  console.log('Creating compensation plan & rules...');
  const compPlan = await prisma.compensationPlan.upsert({
    where: { id: 'plan_default_ff' },
    update: {},
    create: {
      id: 'plan_default_ff',
      name: 'Fast Forward Standard Compensation Plan',
      description: 'Default 5-wide matrix compensation plan with multi-wallet splits',
      matrixWidth: 5,
      earningDepth: 3,
      status: 'PUBLISHED',
    },
  });

  const planVersion = await prisma.compensationPlanVersion.upsert({
    where: { planId_versionNumber: { planId: compPlan.id, versionNumber: 1 } },
    update: { status: 'ACTIVE' },
    create: {
      planId: compPlan.id,
      versionNumber: 1,
      status: 'ACTIVE',
      effectiveFrom: new Date(),
      notes: 'Initial production launch plan version',
    },
  });

  await prisma.commissionRule.createMany({
    data: [
      {
        planVersionId: planVersion.id,
        eventType: 'MEMBER_REFERRAL',
        calculationType: 'FIXED',
        value: '10.00',
        calculationBasis: 'FIXED_BASE',
        genealogyLevel: 1,
        walletAllocationsJson: JSON.stringify([{ walletCode: 'CASH', percentage: 100 }]),
        isActive: true,
      },
      {
        planVersionId: planVersion.id,
        eventType: 'PASSENGER_RIDE',
        calculationType: 'PERCENTAGE',
        value: '10.00',
        calculationBasis: 'TOTAL_VALUE',
        genealogyLevel: 1,
        walletAllocationsJson: JSON.stringify([
          { walletCode: 'FF', percentage: 50, cap: 100, overflowWalletCode: 'CASH' },
          { walletCode: 'RIDE', percentage: 20, cap: 50, overflowWalletCode: 'CASH' },
          { walletCode: 'CASH', percentage: 30 },
        ]),
        isActive: true,
      },
      {
        planVersionId: planVersion.id,
        eventType: 'DRIVER_SUBSCRIPTION',
        calculationType: 'PERCENTAGE',
        value: '20.00',
        calculationBasis: 'TOTAL_VALUE',
        genealogyLevel: 1,
        walletAllocationsJson: JSON.stringify([
          { walletCode: 'FF', percentage: 50 },
          { walletCode: 'PETROL_CARD', percentage: 50 },
        ]),
        isActive: true,
      },
    ],
  });

  // 5. Create Progression Phase Definitions
  console.log('Creating progression phase definitions...');
  await prisma.phaseDefinition.upsert({
    where: { ordering: 1 },
    update: {},
    create: {
      name: 'Bronze Level',
      ordering: 1,
      qualificationThreshold: '100.00',
      qualificationMetric: 'ACCUMULATED_EARNINGS',
      benefitsDescription: 'Bronze badge & direct referral eligibility',
      isActive: true,
    },
  });

  await prisma.phaseDefinition.upsert({
    where: { ordering: 2 },
    update: {},
    create: {
      name: 'Silver Level',
      ordering: 2,
      qualificationThreshold: '500.00',
      qualificationMetric: 'ACCUMULATED_EARNINGS',
      benefitsDescription: 'Silver badge & level 2 earning depth eligibility',
      isActive: true,
    },
  });

  await prisma.phaseDefinition.upsert({
    where: { ordering: 3 },
    update: {},
    create: {
      name: 'Gold Level',
      ordering: 3,
      qualificationThreshold: '2000.00',
      qualificationMetric: 'ACCUMULATED_EARNINGS',
      benefitsDescription: 'Gold badge & level 3 full matrix earning depth eligibility',
      isActive: true,
    },
  });

  // 6. Generate Seed API Key
  console.log('Generating seed API key...');
  const rawKey = 'ff_live_demo_key_99887766554433221100aabbccdd';
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  await prisma.apiKey.upsert({
    where: { keyHash },
    update: {},
    create: {
      name: 'Seed E-Hailing Production Service Key',
      keyHash,
      prefix: 'ff_live_demo',
      permissions: 'EVENTS_WRITE',
      isActive: true,
    },
  });

  console.log('✅ Fast Forward database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
