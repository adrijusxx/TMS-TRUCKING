import { PrismaClient } from '@prisma/client';

interface ConversionInput {
    leadId: string;
    companyId: string;
    userId: string;
    payType?: string;
    payRate?: number;
    driverType?: string;
    mcNumberId?: string;
}

interface ConversionResult {
    success: boolean;
    driverId?: string;
    checklistId?: string;
    error?: string;
}

const DEFAULT_ONBOARDING_STEPS = [
    { stepType: 'DOCUMENT_UPLOAD', label: 'Upload CDL Copy', required: true, sortOrder: 1 },
    { stepType: 'DOCUMENT_UPLOAD', label: 'Upload Medical Card', required: true, sortOrder: 2 },
    { stepType: 'BACKGROUND_CHECK', label: 'Background Check', required: true, sortOrder: 3 },
    { stepType: 'DRUG_TEST', label: 'Pre-Employment Drug Test', required: true, sortOrder: 4 },
    { stepType: 'MVR_CHECK', label: 'MVR Review', required: true, sortOrder: 5 },
    { stepType: 'FORM_COMPLETION', label: 'Complete W-9 / Tax Forms', required: true, sortOrder: 6 },
    { stepType: 'FORM_COMPLETION', label: 'Direct Deposit Setup', required: false, sortOrder: 7 },
    { stepType: 'EQUIPMENT_ASSIGNMENT', label: 'Truck Assignment', required: false, sortOrder: 8 },
    { stepType: 'TRAINING', label: 'Safety Orientation', required: true, sortOrder: 9 },
    { stepType: 'POLICY_ACKNOWLEDGMENT', label: 'Acknowledge Company Policies', required: true, sortOrder: 10 },
    { stepType: 'ORIENTATION', label: 'First Day Orientation', required: false, sortOrder: 11 },
] as const;

export class LeadConversionManager {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async convert(input: ConversionInput): Promise<ConversionResult> {
        const { leadId, companyId, userId, payType, payRate, driverType, mcNumberId } = input;

        // Fetch the lead
        const lead = await this.prisma.lead.findFirst({
            where: { id: leadId, companyId, deletedAt: null },
        });

        if (!lead) return { success: false, error: 'Lead not found' };
        if (lead.driverId) return { success: false, error: 'Lead has already been converted to a driver' };
        if (lead.status === 'REJECTED') return { success: false, error: 'Cannot hire a rejected lead' };

        // Generate a driver number
        const lastDriver = await this.prisma.driver.findFirst({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            select: { driverNumber: true },
        });
        let nextNum = 1;
        if (lastDriver?.driverNumber) {
            const match = lastDriver.driverNumber.match(/(\d+)/);
            if (match) nextNum = parseInt(match[1]) + 1;
        }
        const driverNumber = `DRV-${String(nextNum).padStart(3, '0')}`;

        // Resolve MC number
        const resolvedMcNumberId = mcNumberId || lead.mcNumberId || await this.findDefaultMcNumber(companyId);
        if (!resolvedMcNumberId) return { success: false, error: 'No MC number available' };

        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        // Create user account for the driver
        const userRecord = await this.prisma.user.create({
            data: {
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email || `${driverNumber.toLowerCase()}@placeholder.local`,
                phone: lead.phone,
                role: 'DRIVER',
                companyId,
                mcNumberId: resolvedMcNumberId,
                password: '', // Will need reset
            },
        });

        // Create driver, link lead, create onboarding — all in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const driver = await tx.driver.create({
                data: {
                    userId: userRecord.id,
                    companyId,
                    mcNumberId: resolvedMcNumberId,
                    driverNumber,
                    driverType: (driverType as any) || 'COMPANY_DRIVER',
                    payType: (payType as any) || 'PER_MILE',
                    payRate: payRate || 0.65,
                    licenseNumber: lead.cdlNumber || 'PENDING',
                    licenseState: lead.state || 'XX',
                    licenseExpiry: lead.cdlExpiration || futureDate,
                    medicalCardExpiry: futureDate,
                    hireDate: new Date(),
                    status: 'AVAILABLE',
                    city: lead.city || undefined,
                    state: lead.state || undefined,
                    zipCode: lead.zip || undefined,
                    address1: lead.address || undefined,
                    dlClass: lead.cdlClass || undefined,
                    endorsements: lead.endorsements || [],
                },
            });

            // Link lead → driver and update status
            await tx.lead.update({
                where: { id: leadId },
                data: {
                    driverId: driver.id,
                    status: 'HIRED',
                },
            });

            // Log activity
            await tx.leadActivity.create({
                data: {
                    leadId,
                    type: 'HIRED',
                    content: `Lead converted to driver ${driverNumber}`,
                    userId,
                    metadata: { driverId: driver.id, driverNumber },
                },
            });

            // Create onboarding checklist
            const checklist = await tx.onboardingChecklist.create({
                data: {
                    companyId,
                    driverId: driver.id,
                    leadId,
                    status: 'NOT_STARTED',
                    steps: {
                        create: DEFAULT_ONBOARDING_STEPS.map((step) => ({
                            stepType: step.stepType as any,
                            label: step.label,
                            required: step.required,
                            sortOrder: step.sortOrder,
                            status: 'PENDING',
                        })),
                    },
                },
            });

            return { driverId: driver.id, checklistId: checklist.id };
        });

        return { success: true, driverId: result.driverId, checklistId: result.checklistId };
    }

    private async findDefaultMcNumber(companyId: string): Promise<string | null> {
        const mc = await this.prisma.mcNumber.findFirst({
            where: { companyId, isDefault: true, deletedAt: null },
            select: { id: true },
        });
        if (mc) return mc.id;

        const first = await this.prisma.mcNumber.findFirst({
            where: { companyId, deletedAt: null },
            select: { id: true },
        });
        return first?.id || null;
    }
}
