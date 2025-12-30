'use server';

import { auth } from '@/lib/auth';
import { SubscriptionManager } from '@/lib/managers/SubscriptionManager';

export async function getSubscriptionDetails() {
    const session = await auth();

    if (!session?.user?.companyId) {
        throw new Error('Unauthorized');
    }

    return await SubscriptionManager.getPlanDetails(session.user.companyId);
}
