import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { VendorSearchService } from '@/lib/services/VendorSearchService';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const searchParams = request.nextUrl.searchParams;
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');
        const radius = parseFloat(searchParams.get('radius') || '50');
        const type = searchParams.get('type') || undefined;

        if (isNaN(lat) || isNaN(lng)) {
            return NextResponse.json({ error: 'Valid latitude and longitude required' }, { status: 400 });
        }

        const vendorService = new VendorSearchService();
        const vendors = await vendorService.searchVendors(user.companyId, {
            latitude: lat,
            longitude: lng,
            radiusMiles: radius,
            serviceType: type
        });

        return NextResponse.json({
            success: true,
            data: vendors
        });

    } catch (error: any) {
        console.error('[API] Error searching vendors:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to search nearby vendors' },
            { status: 500 }
        );
    }
}
