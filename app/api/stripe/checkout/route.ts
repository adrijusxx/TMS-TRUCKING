import { auth } from '@/lib/auth';
import { stripe, getOrCreateStripeCustomer } from '@/lib/services/stripe';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { SubscriptionModule } from '@prisma/client';
import { PRO_PRICE_PER_TRUCK, PREMIUM_ADDON_PRICES, PREMIUM_MODULES } from '@/lib/config/subscription-plans';

/**
 * POST /api/stripe/checkout
 *
 * Two flows:
 * 1. { action: 'upgrade-pro' }         → Per-truck subscription ($15/truck/mo)
 * 2. { action: 'add-module', module }   → Premium add-on (AI Dispatch or Analytics)
 */
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { action, module } = await req.json();
        const companyId = session.user.companyId;

        const customerId = await getOrCreateStripeCustomer(companyId);

        if (action === 'upgrade-pro') {
            return await handleUpgradeToPro(companyId, customerId);
        }

        if (action === 'add-module' && module) {
            return await handleAddModule(companyId, customerId, module as SubscriptionModule);
        }

        return new NextResponse('Invalid action', { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Stripe Checkout]', message);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

async function handleUpgradeToPro(companyId: string, customerId: string) {
    // Count current trucks to set initial quantity
    const truckCount = await prisma.truck.count({
        where: { companyId, deletedAt: null },
    });
    const quantity = Math.max(truckCount, 1); // Minimum 1 truck

    const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        billing_address_collection: 'auto',
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'TMS Pro — Per Truck',
                        description: `$${(PRO_PRICE_PER_TRUCK / 100).toFixed(0)}/truck/month. Unlimited loads, invoices, settlements & documents.`,
                    },
                    unit_amount: PRO_PRICE_PER_TRUCK,
                    recurring: { interval: 'month' },
                },
                quantity,
            },
        ],
        subscription_data: {
            metadata: { companyId, plan: 'pro-monthly' },
        },
        metadata: { companyId, action: 'upgrade-pro' },
        success_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
}

async function handleAddModule(
    companyId: string,
    customerId: string,
    module: SubscriptionModule,
) {
    if (!PREMIUM_MODULES.includes(module)) {
        return new NextResponse(`${module} is a core module (already included)`, { status: 400 });
    }

    const price = PREMIUM_ADDON_PRICES[module];
    if (!price) {
        return new NextResponse('Invalid module', { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        billing_address_collection: 'auto',
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `TMS Add-on: ${module.replace('_', ' ')}`,
                        description: `Monthly subscription for ${module.replace('_', ' ')} features`,
                    },
                    unit_amount: price,
                    recurring: { interval: 'month' },
                },
                quantity: 1,
            },
        ],
        subscription_data: {
            metadata: { companyId, plan: 'addon', module },
        },
        metadata: { companyId, action: 'add-module', module },
        success_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
}
