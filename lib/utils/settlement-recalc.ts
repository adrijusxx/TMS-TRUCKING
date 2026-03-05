import { prisma } from '@/lib/prisma';

/**
 * Recalculate settlement totals after deduction/addition changes.
 * Uses amount * quantity for each line item.
 */
export async function recalculateSettlementTotals(settlementId: string) {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  });
  if (!settlement) return null;

  const allDeductions = await prisma.settlementDeduction.findMany({
    where: { settlementId, category: 'deduction' },
  });
  const totalDeductions = allDeductions.reduce(
    (sum, d) => sum + d.amount * (d.quantity ?? 1), 0
  );

  const allAdditions = await prisma.settlementDeduction.findMany({
    where: { settlementId, category: 'addition' },
  });
  const totalAdditions = allAdditions.reduce(
    (sum, a) => sum + a.amount * (a.quantity ?? 1), 0
  );

  const advances = await prisma.driverAdvance.findMany({
    where: { settlementId },
  });
  const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

  const netPay = settlement.grossPay + totalAdditions - totalDeductions - totalAdvances;

  await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      deductions: totalDeductions,
      netPay: netPay < 0 ? 0 : netPay,
    },
  });

  return { totalDeductions, totalAdditions, totalAdvances, netPay };
}
