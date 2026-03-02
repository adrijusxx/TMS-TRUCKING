import { auth } from '@/lib/auth';
import { stripe, getOrCreateStripeCustomer } from '@/lib/services/stripe';
import { NextResponse } from 'next/server';

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session so the user can:
 * - Update payment method
 * - View invoices / receipts
 * - Cancel subscription
 */
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const customerId = await getOrCreateStripeCustomer(session.user.companyId);

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Stripe Portal]', message);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
