import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

let _stripe: Stripe | null = null;

/**
 * Lazy-initialized Stripe client.
 * SDK v20 crashes on empty API key at construction, so we defer until first use.
 */
export function getStripe(): Stripe {
    if (!_stripe) {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            throw new Error('[Stripe] STRIPE_SECRET_KEY not set — cannot create Stripe client');
        }
        _stripe = new Stripe(apiKey, {
            apiVersion: '2025-12-15.clover',
            typescript: true,
        });
    }
    return _stripe;
}

/** Convenience alias — use in routes/webhooks */
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        return (getStripe() as any)[prop];
    },
});

/**
 * Get or create a Stripe customer for a company.
 * Looks up by stripeCustomerId on Company, creates in Stripe if missing.
 */
export async function getOrCreateStripeCustomer(
    companyId: string,
): Promise<string> {
    const company = await prisma.company.findUniqueOrThrow({
        where: { id: companyId },
        select: { id: true, stripeCustomerId: true, email: true, name: true },
    });

    if (company.stripeCustomerId) {
        return company.stripeCustomerId;
    }

    const client = getStripe();
    const customer = await client.customers.create({
        email: company.email,
        name: company.name,
        metadata: { companyId: company.id },
    });

    await prisma.company.update({
        where: { id: companyId },
        data: { stripeCustomerId: customer.id },
    });

    return customer.id;
}
