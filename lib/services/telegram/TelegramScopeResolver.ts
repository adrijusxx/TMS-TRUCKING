import { prisma } from '@/lib/prisma';

export type TelegramScopeKey = string; // "company:<companyId>" | "mc:<mcNumberId>"

export interface ResolvedScope {
  key: TelegramScopeKey;
  companyId: string;
  mcNumberId: string | null;
  mode: 'COMPANY' | 'MC';
}

/**
 * Resolves the effective Telegram scope for a given company/MC context.
 *
 * - COMPANY mode: one shared connection per company
 * - MC mode: independent connection per MC number
 */
export async function resolveTelegramScope(
  companyId: string,
  mcNumberId?: string | null
): Promise<ResolvedScope> {
  const companySettings = await prisma.telegramSettings.findFirst({
    where: { companyId, mcNumberId: null },
    select: { telegramScope: true },
  });

  const mode = companySettings?.telegramScope ?? 'COMPANY';

  if (mode === 'MC' && mcNumberId) {
    return {
      key: `mc:${mcNumberId}`,
      companyId,
      mcNumberId,
      mode: 'MC',
    };
  }

  return {
    key: `company:${companyId}`,
    companyId,
    mcNumberId: null,
    mode: 'COMPANY',
  };
}

/**
 * Build scope-aware where clause for Telegram DB queries.
 */
export function buildTelegramScopeWhere(scope: ResolvedScope) {
  return {
    companyId: scope.companyId,
    mcNumberId: scope.mcNumberId ?? null,
  };
}
