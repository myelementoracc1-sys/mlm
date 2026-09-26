import { Decimal } from 'decimal.js';
import { prisma } from './db';
import { calculateWalletBalance } from './ledger';

export interface WalletAllocationConfig {
  walletCode: string;
  percentage: number;
  cap?: number;
  overflowWalletCode?: string;
}

export interface CalculatedAwardAllocation {
  walletCode: string;
  amount: Decimal;
  isCapped: boolean;
  cappedAmount: Decimal;
  overflowAmount: Decimal;
  overflowDestination?: string;
}

export async function getActiveCompensationPlanVersion(txPrisma = prisma) {
  const version = await txPrisma.compensationPlanVersion.findFirst({
    where: { status: 'ACTIVE' },
    include: {
      plan: true,
      rules: {
        where: { isActive: true },
      },
    },
    orderBy: { versionNumber: 'desc' },
  });

  return version;
}

export function calculateRuleGrossAmount(
  rule: { calculationType: string; value: any; calculationBasis: string },
  monetaryBasis: Decimal
): Decimal {
  const ruleVal = new Decimal(rule.value.toString());

  if (rule.calculationType === 'FIXED') {
    return ruleVal;
  } else if (rule.calculationType === 'PERCENTAGE') {
    return monetaryBasis.times(ruleVal).dividedBy(100);
  }

  throw new Error(`Unsupported calculation type: ${rule.calculationType}`);
}

export async function calculateWalletAllocations(
  grossAmount: Decimal,
  allocationsConfig: WalletAllocationConfig[],
  memberId: string,
  txPrisma = prisma
): Promise<CalculatedAwardAllocation[]> {
  const results: CalculatedAwardAllocation[] = [];
  let overflowPool = new Decimal(0);

  for (const config of allocationsConfig) {
    const rawWalletAmount = grossAmount.times(config.percentage).dividedBy(100);
    const walletDef = await txPrisma.walletDefinition.findUnique({
      where: { code: config.walletCode },
    });

    const capValue = config.cap !== undefined ? config.cap : (walletDef?.cap ? Number(walletDef.cap) : undefined);
    const overflowDestination = config.overflowWalletCode || walletDef?.overflowDestinationCode || undefined;

    if (capValue !== undefined && capValue !== null) {
      const currentBalance = await calculateWalletBalance(memberId, config.walletCode, txPrisma);
      const capDecimal = new Decimal(capValue);
      const availableCapRoom = Decimal.max(0, capDecimal.minus(currentBalance));

      if (rawWalletAmount.greaterThan(availableCapRoom)) {
        const cappedAmount = availableCapRoom;
        const overflow = rawWalletAmount.minus(availableCapRoom);

        results.push({
          walletCode: config.walletCode,
          amount: rawWalletAmount,
          isCapped: true,
          cappedAmount,
          overflowAmount: overflow,
          overflowDestination,
        });

        if (overflowDestination) {
          let destAllocation = results.find((r) => r.walletCode === overflowDestination);
          if (destAllocation) {
            destAllocation.amount = destAllocation.amount.plus(overflow);
          } else {
            results.push({
              walletCode: overflowDestination,
              amount: overflow,
              isCapped: false,
              cappedAmount: overflow,
              overflowAmount: new Decimal(0),
            });
          }
        } else {
          overflowPool = overflowPool.plus(overflow);
        }
        continue;
      }
    }

    let existingAlloc = results.find((r) => r.walletCode === config.walletCode);
    if (existingAlloc) {
      existingAlloc.amount = existingAlloc.amount.plus(rawWalletAmount);
      existingAlloc.cappedAmount = existingAlloc.cappedAmount.plus(rawWalletAmount);
    } else {
      results.push({
        walletCode: config.walletCode,
        amount: rawWalletAmount,
        isCapped: false,
        cappedAmount: rawWalletAmount,
        overflowAmount: new Decimal(0),
      });
    }
  }

  if (overflowPool.greaterThan(0)) {
    let cashAlloc = results.find((r) => r.walletCode === 'CASH');
    if (cashAlloc) {
      cashAlloc.amount = cashAlloc.amount.plus(overflowPool);
      cashAlloc.cappedAmount = cashAlloc.cappedAmount.plus(overflowPool);
    } else {
      results.push({
        walletCode: 'CASH',
        amount: overflowPool,
        isCapped: false,
        cappedAmount: overflowPool,
        overflowAmount: new Decimal(0),
      });
    }
  }

  return results;
}
