
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/services/stripe';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const PRICES = {
    FLEET: 20000, // $200.00
    ACCOUNTING: 30000, // $300.00
    SAFETY: 20000, // $200.00
    HR: 10000, // $100.00 for Reports/HR
    ANALYTICS: 15000, // $150.00 (Example for paid tier)
    INTEGRATIONS: 15000, // $150.00
};

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { module, priceId } = await req.json();

        // Validate module
        if (!module || !PRICES[module as keyof typeof PRICES]) {
            return new NextResponse('Invalid module', { status: 400 });
        }

        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
        });

        if (!company) {
            return new NextResponse('Company not found', { status: 404 });
        }

        // 1. Get or Create Stripe Customer
        let customerId = company.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: company.email,
                name: company.name,
                metadata: {
                    companyId: company.id,
                },
            });
            customerId = customer.id;

            await prisma.company.update({
                where: { id: company.id },
                data: { stripeCustomerId: customerId },
            });
        }

        // 2. Create Checkout Session
        // In a real app, you would use a specific Price ID from Stripe Dashboard.
        // Here we use `price_data` for ad-hoc pricing just to demonstrate functionality without pre-seeding Stripe.
        // Ideally, pass `priceId` if you have it, or use dynamic price_data.

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            billing_address_collection: 'auto',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${module} Module Subscription`,
                            description: `Monthly subscription for ${module} features`,
                        },
                        unit_amount: PRICES[module as keyof typeof PRICES],
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                companyId: company.id,
                module: module,
            },
            success_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/settings/billing?canceled=true`,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
