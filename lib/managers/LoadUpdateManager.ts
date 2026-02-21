import { prisma } from '@/lib/prisma';
import { updateLoadSchema, UpdateLoadInput } from '@/lib/validations/load';
import { hasPermission } from '@/lib/permissions';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';
import { calculateOperatingCosts } from '@/lib/utils/calculateOperatingCosts';
import { resolveMpg } from '@/lib/utils/resolveMpg';
import { notifyLoadStatusChanged, notifyLoadAssigned } from '@/lib/notifications/triggers';
import { emitLoadStatusChanged, emitLoadAssigned, emitDispatchUpdated } from '@/lib/realtime/emitEvent';
import { LoadCompletionManager } from '@/lib/managers/LoadCompletionManager';
import { inngest } from '@/lib/inngest/client';
import { logger } from '@/lib/utils/logger';
import { Session } from 'next-auth';
import { LoadSyncManager } from './LoadSyncManager';

/**
 * LoadUpdateManager
 * 
 * Handles complex load update logic including permissions, validations, 
 * financial recalculations, and related entity management.
 */
export class LoadUpdateManager {
    static async updateLoad(loadId: string, body: any, session: Session) {
        if (!session.user?.companyId) {
            throw new Error('Unauthorized');
        }

        const companyId = session.user.companyId;

        // 1. Fetch existing load
        const existingLoad = await prisma.load.findFirst({
            where: { id: loadId, companyId, deletedAt: null },
            include: {
                documents: { where: { deletedAt: null }, select: { type: true } },
            },
        });

        if (!existingLoad) {
            throw new Error('Load not found');
        }

        // 2. Permission Check
        const role = session.user.role as any;
        if (!hasPermission(role, 'loads.edit')) {
            throw new Error('Forbidden: No permission to edit loads');
        }

        // 3. Validation
        const validated = updateLoadSchema.parse(body);

        // 4. Strict Mode Checks
        await this.validateStrictMode(existingLoad, validated, companyId);

        // 5. Prepare Data
        const updateData = await this.prepareUpdateData(existingLoad, validated, companyId);

        // 6. Recalculate Finance
        await this.handleFinancials(existingLoad, validated, updateData);

        // 7. Track History
        await this.trackStatusHistory(loadId, existingLoad, validated, session.user.id);

        // 8. Execute Update
        const updatedLoad = await prisma.load.update({
            where: { id: loadId },
            data: updateData,
            include: {
                customer: { select: { id: true, name: true, customerNumber: true } },
                driver: {
                    select: {
                        id: true,
                        driverNumber: true,
                        user: { select: { firstName: true, lastName: true } }
                    }
                },
                truck: { select: { id: true, truckNumber: true } },
            },
        });

        // 9. Side Effects (Notifications, Sync, Completion)
        const sideEffects = await this.handleSideEffects(existingLoad, updatedLoad, validated, session);

        return {
            load: updatedLoad,
            meta: sideEffects
        };
    }

    private static async validateStrictMode(existingLoad: any, validated: UpdateLoadInput, companyId: string) {
        const accountingSettings = await prisma.accountingSettings.findUnique({
            where: { companyId },
        });

        const isStrictMode = accountingSettings?.settlementValidationMode === 'STRICT';
        const requirePod = accountingSettings?.requirePodUploaded ?? false;

        if (validated.status === 'DELIVERED' && existingLoad.status !== 'DELIVERED' && isStrictMode && requirePod) {
            const hasBOL = existingLoad.documents.some((d: any) => d.type === 'BOL');
            const hasPOD = existingLoad.documents.some((d: any) => d.type === 'POD');

            const missingDocs = [];
            if (!hasBOL) missingDocs.push('Bill of Lading (BOL)');
            if (!hasPOD) missingDocs.push('Proof of Delivery (POD)');

            if (missingDocs.length > 0) {
                throw new Error(`Cannot mark as Delivered. Missing documents: ${missingDocs.join(', ')}`);
            }
        }
    }

    private static async prepareUpdateData(existingLoad: any, validated: any, companyId: string) {
        const updateData: any = { ...validated };

        // Entity Validations
        if (validated.trailerId) {
            const trailer = await prisma.trailer.findFirst({ where: { id: validated.trailerId, companyId, deletedAt: null } });
            if (!trailer) throw new Error('Trailer not found or access denied');
        }
        if (validated.truckId) {
            const truck = await prisma.truck.findFirst({ where: { id: validated.truckId, companyId, deletedAt: null } });
            if (!truck) throw new Error('Truck not found or access denied');
        }
        if (validated.driverId) {
            const driver = await prisma.driver.findFirst({ where: { id: validated.driverId, companyId, deletedAt: null } });
            if (!driver) throw new Error('Driver not found or access denied');
        }
        if (validated.dispatcherId) {
            const dispatcher = await prisma.user.findFirst({ where: { id: validated.dispatcherId, companyId } });
            if (!dispatcher) throw new Error('Dispatcher not found or access denied');
        }

        // Clean nulls
        if (validated.trailerId === '') updateData.trailerId = null;
        if (validated.truckId === '') updateData.truckId = null;
        if (validated.driverId === '') updateData.driverId = null;
        if (validated.coDriverId === '') updateData.coDriverId = null;
        if (validated.dispatcherId === '') updateData.dispatcherId = null;

        return updateData;
    }

    private static async handleFinancials(existingLoad: any, validated: any, updateData: any) {
        const effectiveDriverId = validated.driverId !== undefined ? (validated.driverId || null) : existingLoad.driverId;
        const currentDriverPay = validated.driverPay ?? existingLoad.driverPay ?? 0;
        const driverPayExplicitlyProvided = validated.driverPay !== undefined && validated.driverPay !== null && validated.driverPay > 0;

        const shouldRecalculatePay = effectiveDriverId && !driverPayExplicitlyProvided && (
            (!existingLoad.driverId && validated.driverId) ||
            (existingLoad.driverId && validated.driverId && existingLoad.driverId !== validated.driverId) ||
            (existingLoad.driverId && currentDriverPay === 0) ||
            validated.driverPay === null ||
            (validated.revenue !== undefined && validated.revenue !== existingLoad.revenue) ||
            (validated.totalMiles !== undefined && validated.totalMiles !== existingLoad.totalMiles)
        );

        // Revenue Per Mile
        const rev = validated.revenue ?? existingLoad.revenue;
        const miles = validated.totalMiles ?? existingLoad.totalMiles;
        if (rev != null && miles != null && miles > 0) {
            updateData.revenuePerMile = Number((rev / miles).toFixed(2));
        }

        if (shouldRecalculatePay && effectiveDriverId) {
            const driver = await prisma.driver.findUnique({
                where: { id: effectiveDriverId },
                select: { payType: true, payRate: true },
            });

            if (driver?.payType && driver.payRate != null) {
                updateData.driverPay = calculateDriverPay(
                    { payType: driver.payType as any, payRate: driver.payRate },
                    {
                        totalMiles: validated.totalMiles ?? existingLoad.totalMiles,
                        loadedMiles: validated.loadedMiles ?? existingLoad.loadedMiles,
                        emptyMiles: validated.emptyMiles ?? existingLoad.emptyMiles,
                        revenue: validated.revenue ?? existingLoad.revenue,
                    }
                );
            }
        }

        // Recalculate netProfit when any financial field changes
        const financialsChanged = validated.revenue !== undefined || validated.driverPay !== undefined
            || validated.totalExpenses !== undefined || updateData.driverPay !== undefined;
        if (financialsChanged) {
            const finalRevenue = validated.revenue ?? existingLoad.revenue ?? 0;
            const finalDriverPay = updateData.driverPay ?? validated.driverPay ?? existingLoad.driverPay ?? 0;
            const finalExpenses = validated.totalExpenses ?? existingLoad.totalExpenses ?? 0;
            updateData.netProfit = Number((finalRevenue - finalDriverPay - finalExpenses).toFixed(2));
        }

        // Recalculate estimated operating costs when miles or truck changes
        const opCostTrigger = validated.totalMiles !== undefined || validated.truckId !== undefined
            || validated.loadedMiles !== undefined || validated.emptyMiles !== undefined;
        if (opCostTrigger || financialsChanged) {
            const finalMiles = validated.totalMiles ?? existingLoad.totalMiles;
            if (finalMiles && finalMiles > 0) {
                const effectiveTruckId = validated.truckId !== undefined
                    ? (validated.truckId || null)
                    : existingLoad.truckId;

                const [systemConfig, truck] = await Promise.all([
                    prisma.systemConfig.findUnique({ where: { companyId: existingLoad.companyId } }),
                    effectiveTruckId
                        ? prisma.truck.findUnique({ where: { id: effectiveTruckId }, select: { averageMpg: true } })
                        : null,
                ]);

                const { mpg } = resolveMpg(truck?.averageMpg, systemConfig?.averageMpg);
                const opCosts = calculateOperatingCosts({
                    totalMiles: finalMiles,
                    mpg,
                    fuelPrice: systemConfig?.averageFuelPrice,
                    maintenanceCpm: systemConfig?.maintenanceCpm,
                    fixedCostPerDay: systemConfig?.fixedCostPerDay,
                });

                updateData.estimatedFuelCost = opCosts.estimatedFuelCost;
                updateData.estimatedMaintCost = opCosts.estimatedMaintCost;
                updateData.estimatedFixedCost = opCosts.estimatedFixedCost;
                updateData.estimatedOpCost = opCosts.estimatedOpCost;
            }
        }
    }

    private static async trackStatusHistory(loadId: string, existingLoad: any, validated: any, userId: string) {
        if (validated.status && validated.status !== existingLoad.status) {
            await prisma.loadStatusHistory.create({
                data: {
                    loadId,
                    status: validated.status as any,
                    createdBy: userId,
                    notes: `Status changed from ${existingLoad.status} to ${validated.status}`,
                },
            });
        }
        if (validated.dispatchStatus && validated.dispatchStatus !== existingLoad.dispatchStatus) {
            await prisma.loadStatusHistory.create({
                data: {
                    loadId,
                    status: existingLoad.status,
                    createdBy: userId,
                    notes: `Dispatch status changed from ${existingLoad.dispatchStatus || 'none'} to ${validated.dispatchStatus}`,
                },
            });
        }
    }

    private static async handleSideEffects(existingLoad: any, load: any, validated: any, session: Session) {
        let completionResult: any = null;
        let warnings: string[] = [];

        // Driver Assignment Notification
        if (!existingLoad.driverId && validated.driverId) {
            await notifyLoadAssigned(load.id, load.driverId);
            emitLoadAssigned(load.id, load.driverId, load);
            emitDispatchUpdated({ type: 'load_assigned', loadId: load.id, driverId: load.driverId });
        }

        // Status Change Effects
        if (validated.status && validated.status !== existingLoad.status) {
            await notifyLoadStatusChanged(load.id, existingLoad.status, validated.status, session.user.id);
            emitLoadStatusChanged(load.id, validated.status, load);
            emitDispatchUpdated({ type: 'load_status_changed', loadId: load.id, status: validated.status });

            // Emit Inngest event for async automation (invoice, settlement readiness)
            try {
                await inngest.send({
                    name: 'load/status-changed',
                    data: {
                        loadId: load.id,
                        companyId: load.companyId,
                        previousStatus: existingLoad.status,
                        newStatus: validated.status,
                    },
                });
            } catch (e) {
                // Non-critical: don't break the request if Inngest is unavailable
                logger.error('Failed to emit load/status-changed event', { error: e instanceof Error ? e.message : String(e) });
            }

            // Completion Workflow
            const completionStatuses = ['DELIVERED', 'INVOICED', 'PAID', 'READY_TO_BILL', 'BILLING_HOLD'];
            if (completionStatuses.includes(validated.status)) {
                try {
                    const completionManager = new LoadCompletionManager();
                    completionResult = await completionManager.handleLoadCompletion(load.id);
                    if (!completionResult.success && completionResult.errors) warnings = completionResult.errors;
                } catch (e: any) {
                    warnings.push(`Completion Error: ${e.message}`);
                    // Fallback: ensure readyForSettlement is set even if completion manager fails
                    if (validated.status === 'DELIVERED' && load.driverId) {
                        try {
                            await prisma.load.update({
                                where: { id: load.id },
                                data: { readyForSettlement: true, deliveredAt: load.deliveredAt || new Date() },
                            });
                        } catch { /* best-effort */ }
                    }
                }
            }
        }

        return { completionResult, warnings };
    }
}
