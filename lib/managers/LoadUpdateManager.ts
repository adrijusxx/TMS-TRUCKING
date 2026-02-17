import { prisma } from '@/lib/prisma';
import { updateLoadSchema, UpdateLoadInput } from '@/lib/validations/load';
import { hasPermission } from '@/lib/permissions';
import { calculateDriverPay } from '@/lib/utils/calculateDriverPay';
import { notifyLoadStatusChanged, notifyLoadAssigned } from '@/lib/notifications/triggers';
import { emitLoadStatusChanged, emitLoadAssigned, emitDispatchUpdated } from '@/lib/realtime/emitEvent';
import { LoadCompletionManager } from '@/lib/managers/LoadCompletionManager';
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

            // Completion Workflow
            const completionStatuses = ['DELIVERED', 'INVOICED', 'PAID', 'READY_TO_BILL', 'BILLING_HOLD'];
            if (completionStatuses.includes(validated.status)) {
                try {
                    const completionManager = new LoadCompletionManager();
                    completionResult = await completionManager.handleLoadCompletion(load.id);
                    if (!completionResult.success && completionResult.errors) warnings = completionResult.errors;
                } catch (e: any) {
                    warnings.push(`Completion Error: ${e.message}`);
                }
            }
        }

        return { completionResult, warnings };
    }
}
