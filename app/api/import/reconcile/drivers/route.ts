
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 1. Find Unlinked Drivers
        const unlinkedDrivers = await prisma.driver.findMany({
            where: {
                companyId: session.user.companyId,
                userId: null,
                deletedAt: null,
            },
            select: {
                id: true,
                driverNumber: true,
                status: true,
                metadata: true, // Fetch metadata to try and find name/email
            }
        });

        // 2. Find Potential User Matches (Users with role DRIVER who are NOT linked to a Driver profile)
        const availableUsers = await prisma.user.findMany({
            where: {
                companyId: session.user.companyId,
                role: 'DRIVER', // Or usually drivers
                isActive: true,
                drivers: {
                    none: {} // Ensure this user is not already linked to ANY driver profile
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
            }
        });

        // 3. Perform Fuzzy Matching (Simple heuristic for now)
        const results = unlinkedDrivers.map(driver => {
            // Extract potential info from metadata
            const meta = (driver.metadata as any) || {};
            const driverEmail = (meta.email as string) || '';
            const driverFirstName = (meta.firstName as string) || 'Unknown';
            const driverLastName = (meta.lastName as string) || '';
            const driverName = `${driverFirstName} ${driverLastName}`.trim().toLowerCase();

            const matches = availableUsers.filter(user => {
                // Heuristic 1: Exact Email Match
                if (driverEmail && user.email && driverEmail.toLowerCase() === user.email.toLowerCase()) return true;

                // Heuristic 2: Name Similarity (Simple includes check for now)
                const userName = `${user.firstName} ${user.lastName}`.toLowerCase();

                // If we don't have a driver name, we can't match by name
                if (!driverName) return false;

                return driverName === userName || (driverName.includes(userName) && userName.length > 3);
            }).map(u => ({ ...u, confidence: 'high' })); // Simplify confidence for now

            return {
                driver: {
                    ...driver,
                    // Shim fields for frontend compatibility
                    firstName: driverFirstName,
                    lastName: driverLastName,
                    email: driverEmail,
                    phone: (meta.phone as string) || null,
                },
                suggestedMatches: matches
            };
        });

        return NextResponse.json({
            count: unlinkedDrivers.length,
            items: results,
            availableUsers // Send all available users for manual dropdown selection
        });

    } catch (error) {
        console.error('Error fetching unlinked drivers:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const { driverId, action, targetUserId, newUserData } = body;
        // action: 'LINK', 'CREATE_NEW', 'IGNORE'

        if (action === 'LINK' && targetUserId) {
            // Link existing User to Driver
            await prisma.driver.update({
                where: { id: driverId },
                data: { userId: targetUserId }
            });
            return NextResponse.json({ success: true, message: 'Linked successfully' });
        }

        if (action === 'CREATE_NEW') {
            const driver = await prisma.driver.findUnique({ where: { id: driverId } });
            if (!driver) return new NextResponse('Driver not found', { status: 404 });

            const meta = (driver.metadata as any) || {};
            const driverEmail = (meta.email as string) || '';
            const driverFirstName = (meta.firstName as string) || 'Driver';
            const driverLastName = (meta.lastName as string) || driver.driverNumber;

            const email = driverEmail || `driver.${driver.driverNumber.toLowerCase()}@example.com`;
            const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            if (!session.user.mcNumberId) {
                return new NextResponse('User Default MC ID not found', { status: 400 });
            }

            const newUser = await prisma.user.create({
                data: {
                    email,
                    firstName: driverFirstName,
                    lastName: driverLastName,
                    password: hashedPassword,
                    role: 'DRIVER',
                    companyId: session.user.companyId,
                    mcNumberId: driver.mcNumberId || session.user.mcNumberId,
                    isActive: true,
                }
            });

            await prisma.driver.update({
                where: { id: driverId },
                data: { userId: newUser.id }
            });

            return NextResponse.json({ success: true, message: 'User created and linked', tempPassword });
        }

        return new NextResponse('Invalid Action', { status: 400 });

    } catch (error) {
        console.error('Error reconciling driver:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
