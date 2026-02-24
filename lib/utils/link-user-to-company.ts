import type { PrismaClient, UserRole, UserCompany } from '@prisma/client';

/**
 * Links an existing user to a company via UserCompany.
 * Uses upsert so it's idempotent — safe to call multiple times.
 */
export async function linkUserToCompany(
    prisma: PrismaClient,
    userId: string,
    companyId: string,
    role: UserRole
): Promise<UserCompany> {
    return prisma.userCompany.upsert({
        where: { userId_companyId: { userId, companyId } },
        update: { role, isActive: true },
        create: { userId, companyId, role },
    });
}
