import { auth } from '@/lib/auth';
// Rebuild trigger
import { prisma } from '@/lib/prisma';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const session = await auth();
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const mcWhere = await buildMcNumberWhereClause(session, request);

        const drivers = await prisma.driver.findMany({
            where: {
                ...mcWhere,
                status: { not: 'INACTIVE' }, // Only active drivers? Or all? Usually active.
                deletedAt: null,
            },
            select: {
                id: true,
                // Driver names are on the User model
                userId: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                },
                driverNumber: true,
                // CDL - Fetch from relation
                cdlRecord: {
                    select: {
                        cdlNumber: true,
                        expirationDate: true,
                        issueState: true,
                    }
                },

                // Med Card
                medicalCards: {
                    orderBy: { expirationDate: 'desc' },
                    take: 1,
                    select: {
                        expirationDate: true,
                    }
                },

                // MVR
                mvrRecords: {
                    orderBy: { pullDate: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        pullDate: true,
                        // status: true, // Not in schema, infer from violations count if needed or just show date
                    }
                },

                // Drug Tests
                drugAlcoholTests: {
                    orderBy: { testDate: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        testDate: true,
                        result: true,
                    }
                },

                // Annual Reviews
                annualReviews: {
                    orderBy: { reviewDate: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        reviewDate: true,
                        status: true,
                    }
                },

                // DQF
                dqf: {
                    select: {
                        id: true,
                        status: true,
                        lastReviewDate: true,
                    }
                }
            }
        });

        const formattedDrivers = drivers.map(d => ({
            id: d.id,
            name: d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Unknown',
            driverNumber: d.driverNumber,
            cdl: d.cdlRecord ? {
                number: d.cdlRecord.cdlNumber,
                state: d.cdlRecord.issueState,
                expiry: d.cdlRecord.expirationDate,
            } : null,
            medCard: d.medicalCards[0] ? {
                expiry: d.medicalCards[0].expirationDate,
            } : null,
            mvr: d.mvrRecords[0] ? {
                date: d.mvrRecords[0].pullDate,
                status: 'CLEAR', // Placeholder as schema doesn't have status on record level
            } : null,
            drugTest: d.drugAlcoholTests[0] ? {
                date: d.drugAlcoholTests[0].testDate,
                result: d.drugAlcoholTests[0].result,
            } : null,
            annualReview: d.annualReviews[0] ? {
                date: d.annualReviews[0].reviewDate,
                status: d.annualReviews[0].status,
            } : null,
            dqf: d.dqf ? {
                status: d.dqf.status,
                lastAudited: d.dqf.lastReviewDate
            } : null,
        }));

        return NextResponse.json(formattedDrivers);
    } catch (error) {
        console.error('[COMPLIANCE_MATRIX_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
