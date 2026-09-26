import { prisma } from './db';

export interface GenealogyNode {
  memberId: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  status: string;
  level: number;
  sponsorId?: string;
  sponsorCode?: string;
  matrixParentId?: string;
  matrixParentCode?: string;
  position?: number;
  directReferralsCount: number;
  matrixChildrenCount: number;
  children?: GenealogyNode[];
}

export async function getSponsorUpline(
  memberId: string,
  maxDepth: number = 10,
  txPrisma = prisma
) {
  const upline: Array<{ memberId: string; level: number; memberCode: string; name: string }> = [];
  let currentMemberId = memberId;
  let currentLevel = 1;

  while (currentLevel <= maxDepth) {
    const rel = await txPrisma.sponsorRelationship.findUnique({
      where: { referredMemberId: currentMemberId },
      include: {
        sponsor: {
          select: {
            id: true,
            memberCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!rel || !rel.sponsor) break;

    upline.push({
      memberId: rel.sponsor.id,
      level: currentLevel,
      memberCode: rel.sponsor.memberCode,
      name: `${rel.sponsor.firstName} ${rel.sponsor.lastName}`,
    });

    currentMemberId = rel.sponsor.id;
    currentLevel++;
  }

  return upline;
}

export async function getMatrixUpline(
  memberId: string,
  maxDepth: number = 10,
  txPrisma = prisma
) {
  const upline: Array<{ memberId: string; level: number; memberCode: string; name: string; position: number }> = [];
  let currentMemberId = memberId;
  let currentLevel = 1;

  while (currentLevel <= maxDepth) {
    const placement = await txPrisma.matrixPlacement.findUnique({
      where: { childMemberId: currentMemberId },
      include: {
        parentMember: {
          select: {
            id: true,
            memberCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!placement || !placement.parentMember) break;

    upline.push({
      memberId: placement.parentMember.id,
      level: currentLevel,
      memberCode: placement.parentMember.memberCode,
      name: `${placement.parentMember.firstName} ${placement.parentMember.lastName}`,
      position: placement.position,
    });

    currentMemberId = placement.parentMember.id;
    currentLevel++;
  }

  return upline;
}

export async function getSponsorTree(
  memberId: string,
  currentDepth: number = 0,
  maxDepth: number = 3,
  txPrisma = prisma
): Promise<GenealogyNode> {
  const member = await txPrisma.member.findUnique({
    where: { id: memberId },
    include: {
      sponsoredBy: {
        include: { sponsor: { select: { id: true, memberCode: true } } },
      },
      matrixPlacedUnder: {
        include: { parentMember: { select: { id: true, memberCode: true } } },
      },
      _count: {
        select: {
          sponsoredMembers: true,
          matrixChildren: true,
        },
      },
    },
  });

  if (!member) {
    throw new Error(`Member with ID ${memberId} not found`);
  }

  const node: GenealogyNode = {
    memberId: member.id,
    memberCode: member.memberCode,
    firstName: member.firstName,
    lastName: member.lastName,
    status: member.status,
    level: currentDepth,
    sponsorId: member.sponsoredBy?.sponsor.id,
    sponsorCode: member.sponsoredBy?.sponsor.memberCode,
    matrixParentId: member.matrixPlacedUnder?.parentMember.id,
    matrixParentCode: member.matrixPlacedUnder?.parentMember.memberCode,
    position: member.matrixPlacedUnder?.position,
    directReferralsCount: member._count.sponsoredMembers,
    matrixChildrenCount: member._count.matrixChildren,
    children: [],
  };

  if (currentDepth < maxDepth) {
    const referrals = await txPrisma.sponsorRelationship.findMany({
      where: { sponsorId: memberId },
      select: { referredMemberId: true },
    });

    for (const ref of referrals) {
      const childNode = await getSponsorTree(ref.referredMemberId, currentDepth + 1, maxDepth, txPrisma);
      node.children?.push(childNode);
    }
  }

  return node;
}

export async function placeMemberInMatrixDirect(
  parentMemberId: string,
  childMemberId: string,
  position: number,
  maxMatrixWidth: number = 5,
  txPrisma = prisma
) {
  if (position < 1 || position > maxMatrixWidth) {
    throw new Error(`Position ${position} is invalid for matrix width ${maxMatrixWidth}`);
  }

  const existingOccupant = await txPrisma.matrixPlacement.findUnique({
    where: {
      parentMemberId_position: { parentMemberId, position },
    },
  });

  if (existingOccupant) {
    throw new Error(`Position ${position} under parent ${parentMemberId} is already occupied`);
  }

  const parentPlacement = await txPrisma.matrixPlacement.findUnique({
    where: { childMemberId: parentMemberId },
  });

  const parentLevel = parentPlacement ? parentPlacement.level : 0;
  const childLevel = parentLevel + 1;

  const placement = await txPrisma.matrixPlacement.create({
    data: {
      parentMemberId,
      childMemberId,
      position,
      level: childLevel,
    },
  });

  return placement;
}

export async function attemptAutomaticSpilloverPlacement(
  sponsorMemberId: string,
  childMemberId: string
): Promise<never> {
  throw new Error(
    'UNRESOLVED_BUSINESS_RULE: Matrix spillover placement algorithm is currently unconfirmed. Automatic spillover placement is disabled until the rule is explicitly defined by administrators.'
  );
}
