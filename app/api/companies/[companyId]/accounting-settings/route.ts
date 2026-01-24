import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ companyId: string }> }
) {
    const session = await auth();
    const { companyId } = await params;

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user has access to this company
    // In a real app, you might want more granular permission checks
    if (session.user.companyId !== companyId && session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const settings = await prisma.accountingSettings.findUnique({
            where: { companyId: companyId },
        });

        // Return default settings if none exist
        if (!settings) {
            return NextResponse.json({
                settlementValidationMode: 'FLEXIBLE',
                requirePodUploaded: false,
                requireReadyForSettlementFlag: false,
                requireDeliveredDate: true,
                requireMcNumberMatch: true,
                warnOnMissingPod: true,
                warnOnMissingBol: true,
                warnOnOldDeliveryDate: true,
                oldDeliveryThresholdDays: 30,
                requirePodForInvoicing: false,
                requireBolForInvoicing: false,
                allowPartialBatches: true,
                autoMarkReadyForSettlement: false,
                autoMarkReadyForInvoicing: false,
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching accounting settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ companyId: string }> }
) {
    const session = await auth();
    const { companyId } = await params;

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.companyId !== companyId && session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const data = await req.json();

        // Validate mode if needed
        if (data.settlementValidationMode &&
            !['STRICT', 'FLEXIBLE', 'CUSTOM'].includes(data.settlementValidationMode)) {
            return NextResponse.json(
                { error: 'Invalid validation mode' },
                { status: 400 }
            );
        }

        const settings = await prisma.accountingSettings.upsert({
            where: { companyId: companyId },
            update: {
                settlementValidationMode: data.settlementValidationMode,
                requirePodUploaded: data.requirePodUploaded,
                requireReadyForSettlementFlag: data.requireReadyForSettlementFlag,
                requireDeliveredDate: data.requireDeliveredDate,
                requireMcNumberMatch: data.requireMcNumberMatch,
                warnOnMissingPod: data.warnOnMissingPod,
                warnOnMissingBol: data.warnOnMissingBol,
                warnOnOldDeliveryDate: data.warnOnOldDeliveryDate,
                oldDeliveryThresholdDays: data.oldDeliveryThresholdDays,
                requirePodForInvoicing: data.requirePodForInvoicing,
                requireBolForInvoicing: data.requireBolForInvoicing,
                allowPartialBatches: data.allowPartialBatches,
                autoMarkReadyForSettlement: data.autoMarkReadyForSettlement,
                autoMarkReadyForInvoicing: data.autoMarkReadyForInvoicing,
            },
            create: {
                companyId: companyId,
                settlementValidationMode: data.settlementValidationMode,
                requirePodUploaded: data.requirePodUploaded,
                requireReadyForSettlementFlag: data.requireReadyForSettlementFlag,
                requireDeliveredDate: data.requireDeliveredDate,
                requireMcNumberMatch: data.requireMcNumberMatch,
                warnOnMissingPod: data.warnOnMissingPod,
                warnOnMissingBol: data.warnOnMissingBol,
                warnOnOldDeliveryDate: data.warnOnOldDeliveryDate,
                oldDeliveryThresholdDays: data.oldDeliveryThresholdDays,
                requirePodForInvoicing: data.requirePodForInvoicing,
                requireBolForInvoicing: data.requireBolForInvoicing,
                allowPartialBatches: data.allowPartialBatches,
                autoMarkReadyForSettlement: data.autoMarkReadyForSettlement,
                autoMarkReadyForInvoicing: data.autoMarkReadyForInvoicing,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error saving accounting settings:', error);
        return NextResponse.json(
            { error: 'Failed to save settings' },
            { status: 500 }
        );
    }
}
