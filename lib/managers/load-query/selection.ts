export const loadListSelect = {
    id: true,
    loadNumber: true,
    status: true,
    dispatchStatus: true,
    pickupLocation: true,
    pickupCity: true,
    pickupState: true,
    pickupDate: true,
    deliveryLocation: true,
    deliveryCity: true,
    deliveryState: true,
    deliveryDate: true,
    revenue: true,
    driverPay: true,
    totalPay: true,
    totalMiles: true,
    loadedMiles: true,
    emptyMiles: true,
    trailerNumber: true,
    shipmentId: true,
    stopsCount: true,
    serviceFee: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    readyForSettlement: true, // Included for settlement logic
    // CRITICAL: Include foreign key IDs for filtering (settlement form filters by driverId)
    driverId: true,
    customerId: true,
    truckId: true,
    customer: {
        select: { id: true, name: true, customerNumber: true },
    },
    driver: {
        select: {
            id: true,
            driverNumber: true,
            user: { select: { firstName: true, lastName: true, phone: true } },
        },
    },
    truck: {
        select: { id: true, truckNumber: true },
    },
    dispatcher: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    },
    mcNumber: {
        select: { id: true, number: true, companyName: true },
    },
    trailer: {
        select: { id: true, trailerNumber: true },
    },
    stops: {
        select: { id: true, stopType: true, sequence: true, city: true, state: true },
        orderBy: { sequence: 'asc' as const },
    },
    documents: {
        where: { deletedAt: null },
        select: { id: true, type: true, title: true, fileName: true, fileUrl: true },
        orderBy: { createdAt: 'desc' as const },
        take: 5,
    },
    statusHistory: {
        select: { createdBy: true, createdAt: true },
        orderBy: { createdAt: 'asc' as const },
        take: 1,
    },
    rateConfirmation: {
        select: { id: true, rateConfNumber: true },
    },
};
