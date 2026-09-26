import { Decimal } from 'decimal.js';
import { prisma } from './db';
import { calculateWalletBalance } from './ledger';

export interface PhaseEvaluationResult {
  currentPhase: {
    id: string;
    name: string;
    ordering: number;
    threshold: Decimal;
    benefits?: string | null;
  } | null;
  metricValue: Decimal;
  nextPhase: {
    id: string;
    name: string;
    threshold: Decimal;
    progressPercentage: number;
  } | null;
}

export async function evaluateMemberPhase(memberId: string, txPrisma = prisma): Promise<PhaseEvaluationResult> {
  const activePhases = await txPrisma.phaseDefinition.findMany({
    where: { isActive: true },
    orderBy: { ordering: 'asc' },
  });

  if (activePhases.length === 0) {
    return {
      currentPhase: null,
      metricValue: new Decimal(0),
      nextPhase: null,
    };
  }

  const walletDefs = await txPrisma.walletDefinition.findMany();
  let accumulatedEarnings = new Decimal(0);

  for (const w of walletDefs) {
    const bal = await calculateWalletBalance(memberId, w.code, txPrisma);
    if (bal.greaterThan(0)) {
      accumulatedEarnings = accumulatedEarnings.plus(bal);
    }
  }

  let matchedPhase: typeof activePhases[0] | null = null;
  let nextPhase: typeof activePhases[0] | null = null;

  for (let i = 0; i < activePhases.length; i++) {
    const phase = activePhases[i];
    const threshold = new Decimal(phase.qualificationThreshold.toString());

    if (accumulatedEarnings.greaterThanOrEqualTo(threshold)) {
      matchedPhase = phase;
    } else if (!nextPhase) {
      nextPhase = phase;
    }
  }

  if (matchedPhase) {
    await txPrisma.memberPhase.upsert({
      where: {
        memberId_phaseId: { memberId, phaseId: matchedPhase.id },
      },
      update: { status: 'ACTIVE' },
      create: {
        memberId,
        phaseId: matchedPhase.id,
        status: 'ACTIVE',
      },
    });
  }

  let nextPhaseInfo = null;
  if (nextPhase) {
    const targetThreshold = new Decimal(nextPhase.qualificationThreshold.toString());
    const progress = accumulatedEarnings.dividedBy(targetThreshold).times(100).toNumber();
    nextPhaseInfo = {
      id: nextPhase.id,
      name: nextPhase.name,
      threshold: targetThreshold,
      progressPercentage: Math.min(100, Math.round(progress * 10) / 10),
    };
  }

  return {
    currentPhase: matchedPhase
      ? {
          id: matchedPhase.id,
          name: matchedPhase.name,
          ordering: matchedPhase.ordering,
          threshold: new Decimal(matchedPhase.qualificationThreshold.toString()),
          benefits: matchedPhase.benefitsDescription,
        }
      : null,
    metricValue: accumulatedEarnings,
    nextPhase: nextPhaseInfo,
  };
}
