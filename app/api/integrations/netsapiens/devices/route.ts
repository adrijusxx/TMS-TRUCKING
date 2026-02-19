import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserDevices } from '@/lib/integrations/netsapiens';

/**
 * GET /api/integrations/netsapiens/devices
 * Returns devices for the current user's PBX extension.
 * Used for softphone discovery (probe for SIP credentials).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { voipConfig: true, companyId: true },
  });

  const config = user?.voipConfig as Record<string, any> | null;
  const extension = config?.pbxExtension;

  if (!extension) {
    return NextResponse.json(
      { error: 'No PBX extension configured. Set up your VoIP settings first.' },
      { status: 400 },
    );
  }

  try {
    const devices = await getUserDevices(extension, user?.companyId || undefined);
    return NextResponse.json({ devices, extension });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch devices' },
      { status: 500 },
    );
  }
}
