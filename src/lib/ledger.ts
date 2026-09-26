import { Decimal } from 'decimal.js';
import { prisma } from './db';

export interface LedgerInput {
  memberId: string;
  walletCode: string;
  amount: number | string | Decimal;
  direction: 'CREDIT' | 'DEBIT';
  type: string;
  source: string;
  description: string;
  externalReference?: string;
  actorUserId?: string;
  ruleId?: string;
  planVersionId?: string;
  rewardEventId?: string;
}

export async function createLedgerEntry(input: LedgerInput, txPrisma = prisma) {
  const amountDecimal = new Decimal(input.amount.toString());
  if (amountDecimal.isNegative() || amountDecimal.isZero()) {
    throw new Error('Ledger transaction amount must be greater than zero');
  }

  const transaction = await txPrisma.ledgerTransaction.create({
    data: {
      memberId: input.memberId,
      walletCode: input.walletCode,
      amount: amountDecimal.toString(),
      direction: input.direction,
      type: input.type,
      source: input.source,
      externalReference: input.externalReference,
      description: input.description,
      actorUserId: input.actorUserId,
      ruleId: input.ruleId,
      planVersionId: input.planVersionId,
      rewardEventId: input.rewardEventId,
    },
  });

  await updateMemberWalletBalance(input.memberId, input.walletCode, txPrisma);

  return transaction;
}

export async function calculateWalletBalance(
  memberId: string,
  walletCode: string,
  txPrisma = prisma
): Promise<Decimal> {
  const transactions = await txPrisma.ledgerTransaction.findMany({
    where: { memberId, walletCode },
    select: { amount: true, direction: true },
  });

  let balance = new Decimal(0);
  for (const tx of transactions) {
    const txAmount = new Decimal(tx.amount.toString());
    if (tx.direction === 'CREDIT') {
      balance = balance.plus(txAmount);
    } else if (tx.direction === 'DEBIT') {
      balance = balance.minus(txAmount);
    }
  }

  return balance;
}

export async function updateMemberWalletBalance(
  memberId: string,
  walletCode: string,
  txPrisma = prisma
): Promise<Decimal> {
  const balance = await calculateWalletBalance(memberId, walletCode, txPrisma);

  await txPrisma.memberWallet.upsert({
    where: {
      memberId_walletCode: { memberId, walletCode },
    },
    update: { cachedBalance: balance.toString() },
    create: { memberId, walletCode, cachedBalance: balance.toString() },
  });

  return balance;
}

export async function getMemberBalances(memberId: string, txPrisma = prisma) {
  const walletDefs = await txPrisma.walletDefinition.findMany({
    where: { isActive: true },
  });

  const balances: Record<string, { definition: typeof walletDefs[0]; balance: Decimal }> = {};

  for (const walletDef of walletDefs) {
    const balance = await calculateWalletBalance(memberId, walletDef.code, txPrisma);
    balances[walletDef.code] = {
      definition: walletDef,
      balance,
    };
  }

  return balances;
}

export async function createReversalTransaction(
  originalTransactionId: string,
  actorUserId: string,
  reason: string,
  txPrisma = prisma
) {
  const original = await txPrisma.ledgerTransaction.findUnique({
    where: { id: originalTransactionId },
  });

  if (!original) {
    throw new Error('Original ledger transaction not found');
  }

  const oppositeDirection = original.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT';

  const reversal = await createLedgerEntry(
    {
      memberId: original.memberId,
      walletCode: original.walletCode,
      amount: original.amount,
      direction: oppositeDirection,
      type: 'REVERSAL',
      source: 'ADMIN_REVERSAL',
      description: `Reversal of transaction ${original.id}: ${reason}`,
      externalReference: original.id,
      actorUserId,
    },
    txPrisma
  );

  return reversal;
}
