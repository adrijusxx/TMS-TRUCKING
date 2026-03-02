import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey && process.env.NODE_ENV === 'production') {
    console.warn('[Stripe] STRIPE_SECRET_KEY not set — Stripe operations will fail');
}

export const stripe = new Stripe(apiKey || '', {
    apiVersion: '2025-12-15.clover',
    typescript: true,
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

    const customer = await stripe.customers.create({
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
