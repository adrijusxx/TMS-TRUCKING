
import { stripe } from '@/lib/services/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { SubscriptionStatus, SubscriptionModule } from '@prisma/client';

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
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    try {
        if (event.type === 'checkout.session.completed') {
            if (session.mode === 'subscription') {
                const subscriptionId = session.subscription as string;
                const companyId = session.metadata?.companyId;
                const module = session.metadata?.module as SubscriptionModule;

                if (companyId && module) {
                    // Ensure subscription record exists
                    // We might need to handle the case where a company has multiple subscriptions (one per module)
                    // OR a single subscription with multiple items.
                    // For this simplified implementation, we'll assume one main subscription record + addons.

                    // First, check if there is an existing main subscription
                    let subscription = await prisma.subscription.findUnique({
                        where: { companyId },
                    });

                    if (!subscription) {
                        subscription = await prisma.subscription.create({
                            data: {
                                companyId,
                                planId: 'custom-enterprise', // Dynamic plan
                                status: 'ACTIVE',
                                stripeSubscriptionId: subscriptionId,
                                currentPeriodStart: new Date(),
                                currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                            },
                        });
                    }

                    // Add the module (Upsert to be safe)
                    await prisma.subscriptionAddOn.upsert({
                        where: {
                            subscriptionId_module: {
                                subscriptionId: subscription.id,
                                module: module,
                            }
                        },
                        create: {
                            subscriptionId: subscription.id,
                            module: module,
                            isActive: true,
                            stripeSubscriptionItemId: (session as any).display_items?.[0]?.id || 'unknown', // Simplification
                        },
                        update: {
                            isActive: true,
                        }
                    });
                }
            }
        }

        // Handle invoice payment succeeded/failed to update status could go here.

    } catch (error: any) {
        console.error('Error handling webhook:', error);
        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse('Received', { status: 200 });
}
