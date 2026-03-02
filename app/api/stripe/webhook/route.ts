import { stripe } from '@/lib/services/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { SubscriptionModule } from '@prisma/client';
import { PRO_TIER_LIMITS, FREE_TIER_LIMITS } from '@/lib/config/subscription-plans';

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
        return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            default:
                console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Stripe Webhook] Handler error for ${event.type}:`, message);
        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse('OK', { status: 200 });
}

// ============================================
// EVENT HANDLERS
// ============================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription') return;

    const companyId = session.metadata?.companyId;
    const action = session.metadata?.action;
    const stripeSubscriptionId = session.subscription as string;

    if (!companyId) {
        console.error('[Stripe Webhook] Missing companyId in checkout metadata');
        return;
    }

    if (action === 'upgrade-pro') {
        // Upgrade to Pro: set active, unlimited limits
        await prisma.subscription.upsert({
            where: { companyId },
            create: {
                companyId,
                planId: 'pro-monthly',
                status: 'ACTIVE',
                stripeSubscriptionId,
                usageBased: false,
                currentPeriodStart: new Date(),
                currentPeriodEnd: nextMonth(),
                ...PRO_TIER_LIMITS,
            },
            update: {
                planId: 'pro-monthly',
                status: 'ACTIVE',
                stripeSubscriptionId,
                usageBased: false,
                currentPeriodStart: new Date(),
                currentPeriodEnd: nextMonth(),
                ...PRO_TIER_LIMITS,
            },
        });

        await prisma.company.update({
            where: { id: companyId },
            data: { subscriptionStatus: 'ACTIVE' },
        });

        console.log(`[Stripe Webhook] Company ${companyId} upgraded to Pro`);
    } else if (action === 'add-module') {
        const module = session.metadata?.module as SubscriptionModule;
        if (!module) return;

        // Ensure subscription exists
        const subscription = await prisma.subscription.findUnique({
            where: { companyId },
        });

        if (!subscription) {
            console.error(`[Stripe Webhook] No subscription for company ${companyId} when adding module`);
            return;
        }

        await prisma.subscriptionAddOn.upsert({
            where: {
                subscriptionId_module: {
                    subscriptionId: subscription.id,
                    module,
                },
            },
            create: {
                subscriptionId: subscription.id,
                module,
                isActive: true,
                stripeSubscriptionItemId: stripeSubscriptionId,
            },
            update: { isActive: true },
        });

        console.log(`[Stripe Webhook] Added ${module} add-on for company ${companyId}`);
    }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = getSubscriptionIdFromInvoice(invoice);
    if (!stripeSubscriptionId) return;

    const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId },
    });

    if (!subscription) return;

    // Confirm active status and update billing period
    await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(invoice.period_start * 1000),
            currentPeriodEnd: new Date(invoice.period_end * 1000),
        },
    });

    await prisma.company.update({
        where: { id: subscription.companyId },
        data: { subscriptionStatus: 'ACTIVE' },
    });

    console.log(`[Stripe Webhook] Invoice paid for subscription ${stripeSubscriptionId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const stripeSubscriptionId = getSubscriptionIdFromInvoice(invoice);
    if (!stripeSubscriptionId) return;

    const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId },
    });

    if (!subscription) return;

    await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' },
    });

    await prisma.company.update({
        where: { id: subscription.companyId },
        data: { subscriptionStatus: 'PAST_DUE' },
    });

    console.warn(`[Stripe Webhook] Payment failed for company ${subscription.companyId}`);
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    // Map Stripe status to our status
    const statusMap: Record<string, string> = {
        active: 'ACTIVE',
        past_due: 'PAST_DUE',
        canceled: 'CANCELED',
        unpaid: 'UNPAID',
        incomplete: 'INCOMPLETE',
        incomplete_expired: 'INCOMPLETE_EXPIRED',
        trialing: 'TRIALING',
    };

    const newStatus = statusMap[stripeSubscription.status] || 'ACTIVE';

    // Period dates from the first subscription item (moved from Subscription in newer Stripe API)
    const firstItem = stripeSubscription.items?.data?.[0];
    const periodStart = firstItem?.current_period_start
        ? new Date(firstItem.current_period_start * 1000)
        : undefined;
    const periodEnd = firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000)
        : undefined;

    await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            status: newStatus as any,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            ...(periodStart && { currentPeriodStart: periodStart }),
            ...(periodEnd && { currentPeriodEnd: periodEnd }),
        },
    });

    await prisma.company.update({
        where: { id: subscription.companyId },
        data: { subscriptionStatus: newStatus as any },
    });

    console.log(`[Stripe Webhook] Subscription updated: ${subscription.companyId} → ${newStatus}`);
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    // Downgrade to free tier
    await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            status: 'FREE',
            planId: 'starter-free',
            stripeSubscriptionId: null,
            cancelAtPeriodEnd: false,
            usageBased: true,
            ...FREE_TIER_LIMITS,
        },
    });

    await prisma.company.update({
        where: { id: subscription.companyId },
        data: { subscriptionStatus: 'FREE' },
    });

    // Deactivate all add-ons
    await prisma.subscriptionAddOn.updateMany({
        where: { subscriptionId: subscription.id },
        data: { isActive: false },
    });

    console.log(`[Stripe Webhook] Subscription deleted, downgraded company ${subscription.companyId} to free`);
}

// ============================================
// HELPERS
// ============================================

function nextMonth(): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
}

/** Extract subscription ID from invoice (Stripe SDK v20+ moved it under parent) */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
    const sub = invoice.parent?.subscription_details?.subscription;
    if (!sub) return null;
    return typeof sub === 'string' ? sub : sub.id;
}
