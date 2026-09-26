import { Decimal } from 'decimal.js';
import { prisma } from './db';
import { getActiveCompensationPlanVersion, calculateRuleGrossAmount, calculateWalletAllocations, WalletAllocationConfig } from './compensation';
import { getSponsorUpline } from './genealogy';
import { createLedgerEntry } from './ledger';

export interface ProcessEventInput {
  eventType: string;
  sourceMemberId?: string;
  targetMemberId?: string;
  sourceSystem: string;
  externalReference: string;
  monetaryBasis?: number | string | Decimal;
  metadataJson?: string;
}

export async function processRewardEvent(input: ProcessEventInput) {
  const monetaryBasisDecimal = new Decimal((input.monetaryBasis || 0).toString());

  const existingEvent = await prisma.rewardEvent.findUnique({
    where: {
      sourceSystem_externalReference: {
        sourceSystem: input.sourceSystem,
        externalReference: input.externalReference,
      },
    },
    include: {
      commissionAwards: true,
    },
  });

  if (existingEvent && existingEvent.status === 'PROCESSED') {
    return {
      event: existingEvent,
      alreadyProcessed: true,
      awardsCount: existingEvent.commissionAwards.length,
    };
  }

  return await prisma.$transaction(async (txPrisma) => {
    const rewardEvent = await txPrisma.rewardEvent.upsert({
      where: {
        sourceSystem_externalReference: {
          sourceSystem: input.sourceSystem,
          externalReference: input.externalReference,
        },
      },
      update: {
        eventType: input.eventType,
        sourceMemberId: input.sourceMemberId,
        targetMemberId: input.targetMemberId,
        monetaryBasis: monetaryBasisDecimal.toString(),
        metadataJson: input.metadataJson,
        status: 'PENDING',
      },
      create: {
        eventType: input.eventType,
        sourceMemberId: input.sourceMemberId,
        targetMemberId: input.targetMemberId,
        sourceSystem: input.sourceSystem,
        externalReference: input.externalReference,
        monetaryBasis: monetaryBasisDecimal.toString(),
        metadataJson: input.metadataJson,
        status: 'PENDING',
      },
    });

    const activeVersion = await getActiveCompensationPlanVersion(txPrisma as any);
    if (!activeVersion) {
      await txPrisma.rewardEvent.update({
        where: { id: rewardEvent.id },
        data: {
          status: 'FAILED',
          failureReason: 'No active compensation plan version found',
        },
      });
      throw new Error('UNCONFIGURED_COMPENSATION_PLAN: No active compensation plan version found.');
    }

    const matchingRules = activeVersion.rules.filter(
      (r) => r.eventType === input.eventType && r.isActive
    );

    if (matchingRules.length === 0) {
      const updated = await txPrisma.rewardEvent.update({
        where: { id: rewardEvent.id },
        data: {
          status: 'PROCESSED',
          failureReason: 'No active matching commission rules for event type',
          processedAt: new Date(),
        },
      });
      return { event: updated, alreadyProcessed: false, awardsCount: 0 };
    }

    const createdAwards = [];

    for (const rule of matchingRules) {
      let recipientMemberId: string | null = null;

      if (rule.genealogyLevel === 0) {
        recipientMemberId = input.targetMemberId || input.sourceMemberId || null;
      } else {
        const sourceForUpline = input.sourceMemberId || input.targetMemberId;
        if (sourceForUpline) {
          const upline = await getSponsorUpline(sourceForUpline, rule.genealogyLevel + 1, txPrisma as any);
          const levelMatch = upline.find((u) => u.level === rule.genealogyLevel);
          if (levelMatch) {
            recipientMemberId = levelMatch.memberId;
          }
        }
      }

      if (!recipientMemberId) {
        continue;
      }

      let allocationsConfig: WalletAllocationConfig[] = [];
      try {
        allocationsConfig = JSON.parse(rule.walletAllocationsJson);
      } catch {
        allocationsConfig = [];
      }

      const grossRuleAmount = calculateRuleGrossAmount(rule, monetaryBasisDecimal);
      if (grossRuleAmount.isZero() || grossRuleAmount.isNegative()) {
        continue;
      }

      const walletAllocations = await calculateWalletAllocations(
        grossRuleAmount,
        allocationsConfig,
        recipientMemberId,
        txPrisma as any
      );

      const totalAwarded = walletAllocations.reduce(
        (sum, item) => sum.plus(item.cappedAmount),
        new Decimal(0)
      );

      const award = await txPrisma.commissionAward.create({
        data: {
          rewardEventId: rewardEvent.id,
          planVersionId: activeVersion.id,
          ruleId: rule.id,
          memberId: recipientMemberId,
          genealogyLevel: rule.genealogyLevel,
          amount: totalAwarded.toString(),
          walletBreakdownJson: JSON.stringify(walletAllocations),
          status: 'AWARDED',
        },
      });

      for (const alloc of walletAllocations) {
        if (alloc.cappedAmount.greaterThan(0)) {
          await createLedgerEntry(
            {
              memberId: recipientMemberId,
              walletCode: alloc.walletCode,
              amount: alloc.cappedAmount,
              direction: 'CREDIT',
              type: 'COMMISSION_CREDIT',
              source: 'REWARD_ENGINE',
              description: `Commission award for ${input.eventType} (Rule ID: ${rule.id}, Level: ${rule.genealogyLevel})`,
              externalReference: input.externalReference,
              ruleId: rule.id,
              planVersionId: activeVersion.id,
              rewardEventId: rewardEvent.id,
            },
            txPrisma as any
          );
        }
      }

      createdAwards.push(award);
    }

    const finalEvent = await txPrisma.rewardEvent.update({
      where: { id: rewardEvent.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    return {
      event: finalEvent,
      alreadyProcessed: false,
      awardsCount: createdAwards.length,
      awards: createdAwards,
    };
  });
}
