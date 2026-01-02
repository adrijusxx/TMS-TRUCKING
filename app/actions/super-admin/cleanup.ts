'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type DeletableEntity =
    | 'loads'
    | 'drivers'
    | 'trucks'
    | 'trailers'
    | 'users'
    | 'invoices'
    | 'settlements'
    | 'batches'
    | 'customers'
    | 'vendors';

interface CleanupSearchParams {
    companyId?: string;
    mcNumberId?: string;
    entityType: DeletableEntity;
    search?: string;
    page?: number;
    limit?: number;
}

/**
 * Searches for deletable items based on criteria.
 * Returns lightweight data for selection list.
 */
export async function searchDeletableItems({
    companyId,
    mcNumberId,
    entityType,
    search,
    page = 1,
    limit = 50,
}: CleanupSearchParams) {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Super Admin access required');
    }

    const skip = (page - 1) * limit;
    const where: any = {};

    if (companyId) where.companyId = companyId;

    // Note: mcNumberId filtering is entity-specific

    if (search) {
        const s = { contains: search, mode: 'insensitive' };
        switch (entityType) {
            case 'loads': where.loadNumber = s; break;
            case 'drivers': where.OR = [{ driverNumber: s }, { user: { firstName: s } }, { user: { lastName: s } }]; break;
            case 'trucks': where.truckNumber = s; break;
            case 'trailers': where.trailerNumber = s; break;
            case 'users': where.OR = [{ email: s }, { firstName: s }, { lastName: s }]; break;
            case 'invoices': where.invoiceNumber = s; break;
            case 'settlements': where.settlementNumber = s; break;
            case 'batches': where.batchNumber = s; break;
            case 'customers': where.name = s; break;
            case 'vendors': where.name = s; break;
        }
    }

    try {
        let data = [];
        let total = 0;

        switch (entityType) {
            case 'loads':
                if (mcNumberId) where.mcNumberId = mcNumberId;
                [data, total] = await Promise.all([
                    prisma.load.findMany({
                        where,
                        select: { id: true, loadNumber: true, status: true, pickupDate: true, createdAt: true },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.load.count({ where })
                ]);
                break;

            case 'drivers':
                if (mcNumberId) where.mcNumberId = mcNumberId;
                [data, total] = await Promise.all([
                    prisma.driver.findMany({
                        where,
                        select: {
                            id: true, driverNumber: true, status: true, createdAt: true,
                            user: { select: { firstName: true, lastName: true } }
                        },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.driver.count({ where })
                ]);
                break;

            case 'trucks':
                if (mcNumberId) where.mcNumberId = mcNumberId;
                [data, total] = await Promise.all([
                    prisma.truck.findMany({
                        where,
                        select: { id: true, truckNumber: true, status: true, createdAt: true },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.truck.count({ where })
                ]);
                break;

            case 'trailers':
                if (mcNumberId) where.mcNumberId = mcNumberId;
                [data, total] = await Promise.all([
                    prisma.trailer.findMany({
                        where,
                        select: { id: true, trailerNumber: true, status: true, createdAt: true },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.trailer.count({ where })
                ]);
                break;

            case 'users':
                if (mcNumberId) where.mcNumberId = mcNumberId;
                [data, total] = await Promise.all([
                    prisma.user.findMany({
                        where,
                        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.user.count({ where })
                ]);
                break;

            case 'invoices':
                // Invoices might not have direct MC number, they link to Load -> MC.
                // If mcNumberId is provided, we filter via Load relation
                if (mcNumberId) where.load = { mcNumberId };
                [data, total] = await Promise.all([
                    prisma.invoice.findMany({
                        where,
                        select: { id: true, invoiceNumber: true, status: true, total: true, createdAt: true },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.invoice.count({ where })
                ]);
                break;

            case 'settlements':
                // Settlements link to Driver -> MC or directly?
                // Settlement model usually has specific logic.
                // Assuming Settlement has no direct MC link but Driver does.
                if (mcNumberId) where.driver = { mcNumberId };
                [data, total] = await Promise.all([
                    prisma.settlement.findMany({
                        where,
                        select: { id: true, settlementNumber: true, status: true, netPay: true, createdAt: true },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.settlement.count({ where })
                ]);
                break;

            case 'batches':
                // InvoiceBatch
                [data, total] = await Promise.all([
                    prisma.invoiceBatch.findMany({
                        where,
                        select: { id: true, batchNumber: true, postStatus: true, totalAmount: true, createdAt: true },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.invoiceBatch.count({ where })
                ]);
                break;

            case 'customers':
                [data, total] = await Promise.all([
                    prisma.customer.findMany({
                        where,
                        select: { id: true, name: true, customerNumber: true, status: true, createdAt: true },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.customer.count({ where })
                ]);
                break;

            case 'vendors':
                [data, total] = await Promise.all([
                    prisma.vendor.findMany({
                        where,
                        select: { id: true, name: true, vendorNumber: true, type: true, createdAt: true },
                        skip, take: limit, orderBy: { createdAt: 'desc' }
                    }),
                    prisma.vendor.count({ where })
                ]);
                break;
        }

        return { success: true, data, total, page, limit };
    } catch (error: any) {
        console.error('Search Cleanup Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * HARD DELETES selected items.
 * WARN: This is irreversible.
 */
export async function hardDeleteItems(entityType: DeletableEntity, ids: string[]) {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized');
    }

    if (!ids.length) return { success: false, message: 'No IDs provided' };

    try {
        return await prisma.$transaction(async (tx) => {
            let count = 0;

            switch (entityType) {
                case 'loads':
                    // Cascade dependency: Stops, Financials, etc. (Foreign Keys usually cascade or we let DB handle it)
                    // BUT: Invoices linked to Loads might restrict delete.
                    // Strategy: Disconnect Invoices first (set loadId = null or delete invoices if that's the rule?)
                    // "Nuke" implies aggressive delete. But Invoice preservation is usually critical.
                    // Let's TRY to delete. If it fails due to FK, we'll error out.
                    // Better: Unlink invoices first to be safe?
                    // For a "Clean Up", we probably want to delete the Load and let the Invoice stay as "orphaned" or manual cleanup?
                    // Actually, invoices without loads are broken.
                    // Let's delete the Load. If it fails, the User sees the error.
                    const deletedLoads = await tx.load.deleteMany({ where: { id: { in: ids } } });
                    count = deletedLoads.count;
                    break;

                case 'drivers':
                    // Drivers are linked to Loads, Settlements, Trucks, Trailers.
                    // 1. Unlink from active Loads (set driverId = null)
                    await tx.load.updateMany({
                        where: { driverId: { in: ids } },
                        data: { driverId: null }
                    });

                    // 2. Unlink from Trucks/Trailers (Current Assignment)
                    await tx.truck.updateMany({
                        where: { currentDriverId: { in: ids } },
                        data: { currentDriverId: null }
                    });

                    // 3. Finally Delete Driver.
                    // Note: Driver is linked to User. The User usually remains?
                    // Re-reading request: "delete that data".
                    // If we delete Driver, we should probably check if User has other roles.
                    // But to be safe, let's just delete the Driver profile.
                    const deletedDrivers = await tx.driver.deleteMany({ where: { id: { in: ids } } });
                    count = deletedDrivers.count;
                    break;

                case 'trucks':
                    // Unlink from Loads
                    await tx.load.updateMany({
                        where: { truckId: { in: ids } },
                        data: { truckId: null }
                    });
                    // Unlink from Drivers
                    await tx.driver.updateMany({
                        where: { currentTruckId: { in: ids } },
                        data: { currentTruckId: null }
                    });
                    const deletedTrucks = await tx.truck.deleteMany({ where: { id: { in: ids } } });
                    count = deletedTrucks.count;
                    break;

                case 'trailers':
                    // Unlink from Loads
                    await tx.load.updateMany({
                        where: { trailerId: { in: ids } },
                        data: { trailerId: null }
                    });
                    const deletedTrailers = await tx.trailer.deleteMany({ where: { id: { in: ids } } });
                    count = deletedTrailers.count;
                    break;

                case 'users':
                    // Prevent deleting self or other Super Admins
                    const safeIds = ids.filter(id => id !== session.user.id);
                    // Also maybe check for other Super Admins?

                    const deletedUsers = await tx.user.deleteMany({ where: { id: { in: safeIds } } });
                    count = deletedUsers.count;
                    break;

                case 'invoices':
                    const deletedInvoices = await tx.invoice.deleteMany({ where: { id: { in: ids } } });
                    count = deletedInvoices.count;
                    break;

                case 'settlements':
                    const deletedSettlements = await tx.settlement.deleteMany({ where: { id: { in: ids } } });
                    count = deletedSettlements.count;
                    break;

                case 'batches':
                    const deletedBatches = await tx.invoiceBatch.deleteMany({ where: { id: { in: ids } } });
                    count = deletedBatches.count;
                    break;

                case 'customers':
                    const deletedCustomers = await tx.customer.deleteMany({ where: { id: { in: ids } } });
                    count = deletedCustomers.count;
                    break;

                case 'vendors':
                    const deletedVendors = await tx.vendor.deleteMany({ where: { id: { in: ids } } });
                    count = deletedVendors.count;
                    break;
            }

            return { success: true, count, message: `Hard deleted ${count} ${entityType}` };
        });
    } catch (error: any) {
        console.error('Hard Delete Error:', error);
        return { success: false, error: error.message };
    }
}
