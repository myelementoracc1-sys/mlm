import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from './lib/db';
import { hashPassword, comparePassword, signToken, verifyToken } from './lib/auth';
import { calculateWalletBalance, createLedgerEntry, createReversalTransaction } from './lib/ledger';
import { placeMemberInMatrixDirect, attemptAutomaticSpilloverPlacement, getSponsorUpline } from './lib/genealogy';
import { calculateRuleGrossAmount, calculateWalletAllocations } from './lib/compensation';
import { processRewardEvent } from './lib/event-processor';
import { evaluateMemberPhase } from './lib/progression';
import { Decimal } from 'decimal.js';

describe('Fast Forward Core Domain Unit & Integration Tests', () => {
  let testUser: any;
  let testMember: any;
  let sponsorMember: any;

  beforeAll(async () => {
    const hashedPassword = await hashPassword('TestPass123!');

    sponsorMember = await prisma.member.create({
      data: {
        memberCode: `TEST_SPONSOR_${Date.now()}`,
        firstName: 'Sponsor',
        lastName: 'User',
        user: {
          create: {
            email: `sponsor_${Date.now()}@test.com`,
            passwordHash: hashedPassword,
            role: 'MEMBER',
          },
        },
      },
    });

    testMember = await prisma.member.create({
      data: {
        memberCode: `TEST_MEMBER_${Date.now()}`,
        firstName: 'Test',
        lastName: 'Member',
        user: {
          create: {
            email: `member_${Date.now()}@test.com`,
            passwordHash: hashedPassword,
            role: 'MEMBER',
          },
        },
        sponsoredBy: {
          create: {
            sponsorId: sponsorMember.id,
          },
        },
      },
      include: { user: true },
    });

    // Create wallet definitions
    await prisma.walletDefinition.upsert({
      where: { code: 'FF' },
      update: {},
      create: { code: 'FF', name: 'FF Wallet', cap: '100', overflowDestinationCode: 'CASH' },
    });
    await prisma.walletDefinition.upsert({
      where: { code: 'CASH' },
      update: {},
      create: { code: 'CASH', name: 'Cash Wallet' },
    });

    // Create an active compensation plan & version for event processing tests
    const plan = await prisma.compensationPlan.create({
      data: {
        name: 'Test Plan',
        matrixWidth: 5,
        earningDepth: 3,
        status: 'PUBLISHED',
      },
    });

    await prisma.compensationPlanVersion.create({
      data: {
        planId: plan.id,
        versionNumber: 1,
        status: 'ACTIVE',
        rules: {
          create: [
            {
              eventType: 'PASSENGER_RIDE',
              calculationType: 'PERCENTAGE',
              value: '10.00',
              calculationBasis: 'TOTAL_VALUE',
              genealogyLevel: 0,
              walletAllocationsJson: JSON.stringify([{ walletCode: 'CASH', percentage: 100 }]),
              isActive: true,
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Auth Tests
  describe('Authentication & Authorization', () => {
    it('should correctly hash and verify passwords', async () => {
      const password = 'SecretPassword123!';
      const hash = await hashPassword(password);
      expect(await comparePassword(password, hash)).toBe(true);
      expect(await comparePassword('WrongPassword', hash)).toBe(false);
    });

    it('should sign and verify valid JWT tokens', () => {
      const payload = { userId: 'u123', email: 'test@ff.com', role: 'MEMBER' };
      const token = signToken(payload);
      const verified = verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('u123');
      expect(verified?.role).toBe('MEMBER');
    });
  });

  // 2. Matrix & Genealogy Tests
  describe('Genealogy & Matrix Domain', () => {
    it('should validate matrix width when placing direct child', async () => {
      await expect(
        placeMemberInMatrixDirect(sponsorMember.id, testMember.id, 6, 5)
      ).rejects.toThrow(/invalid for matrix width 5/);
    });

    it('should explicitly reject unresolved automatic spillover algorithm', async () => {
      await expect(
        attemptAutomaticSpilloverPlacement(sponsorMember.id, testMember.id)
      ).rejects.toThrow(/UNRESOLVED_BUSINESS_RULE/);
    });

    it('should correctly resolve sponsor upline hierarchy', async () => {
      const upline = await getSponsorUpline(testMember.id);
      expect(upline.length).toBe(1);
      expect(upline[0].memberId).toBe(sponsorMember.id);
    });
  });

  // 3. Compensation Engine Tests
  describe('Compensation Calculation Engine', () => {
    it('should evaluate percentage and fixed commission amounts', () => {
      const basis = new Decimal('100.00');

      const fixedRule = { calculationType: 'FIXED', value: '15.00', calculationBasis: 'FIXED_BASE' };
      const fixedAmount = calculateRuleGrossAmount(fixedRule, basis);
      expect(fixedAmount.toString()).toBe('15');

      const percentRule = { calculationType: 'PERCENTAGE', value: '10.00', calculationBasis: 'TOTAL_VALUE' };
      const percentAmount = calculateRuleGrossAmount(percentRule, basis);
      expect(percentAmount.toString()).toBe('10');
    });

    it('should enforce wallet caps and route overflow to specified overflow wallet', async () => {
      const grossAmount = new Decimal('100.00');
      const allocationsConfig = [
        { walletCode: 'FF', percentage: 50, cap: 20, overflowWalletCode: 'CASH' },
        { walletCode: 'CASH', percentage: 50 },
      ];

      const allocations = await calculateWalletAllocations(
        grossAmount,
        allocationsConfig,
        testMember.id
      );

      const ffAlloc = allocations.find((a: any) => a.walletCode === 'FF');
      const cashAlloc = allocations.find((a: any) => a.walletCode === 'CASH');

      expect(ffAlloc?.cappedAmount.toString()).toBe('20');
      expect(ffAlloc?.overflowAmount.toString()).toBe('30');
      expect(cashAlloc?.amount.toString()).toBe('80');
    });
  });

  // 4. Ledger & Financial Immutability
  describe('Auditable Double-Entry Ledger', () => {
    it('should derive wallet balance from ledger transactions and support reversals', async () => {
      const tx1 = await createLedgerEntry({
        memberId: testMember.id,
        walletCode: 'CASH',
        amount: 50,
        direction: 'CREDIT',
        type: 'COMMISSION_CREDIT',
        source: 'TEST',
        description: 'Test commission credit',
      });

      let balance = await calculateWalletBalance(testMember.id, 'CASH');
      expect(balance.toNumber()).toBe(50);

      await createReversalTransaction(
        tx1.id,
        testMember.user.id,
        'Test administrative correction reversal'
      );

      balance = await calculateWalletBalance(testMember.id, 'CASH');
      expect(balance.toNumber()).toBe(0);
    });
  });

  // 5. Reward Event Processor & Idempotency
  describe('Reward Event Processor & Idempotency', () => {
    it('should process events idempotently and reject duplicate submissions', async () => {
      const extRef = `ride_event_${Date.now()}`;

      const res1 = await processRewardEvent({
        eventType: 'PASSENGER_RIDE',
        sourceMemberId: testMember.id,
        sourceSystem: 'E_HAILING_TEST',
        externalReference: extRef,
        monetaryBasis: 100,
      });

      expect(res1.alreadyProcessed).toBe(false);
      expect(res1.event.status).toBe('PROCESSED');

      const res2 = await processRewardEvent({
        eventType: 'PASSENGER_RIDE',
        sourceMemberId: testMember.id,
        sourceSystem: 'E_HAILING_TEST',
        externalReference: extRef,
        monetaryBasis: 100,
      });

      expect(res2.alreadyProcessed).toBe(true);
    });
  });

  // 6. Progression Engine Tests
  describe('Phase Progression Engine', () => {
    it('should evaluate phase status based on accumulated earnings', async () => {
      const result = await evaluateMemberPhase(testMember.id);
      expect(result).toHaveProperty('currentPhase');
      expect(result).toHaveProperty('nextPhase');
    });
  });
});
