import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { getNSContacts, syncContactsToNS } from '@/lib/integrations/netsapiens';

/**
 * NetSapiens Contacts API
 * GET  — list shared contacts on the PBX
 * POST — sync TMS customers/drivers to PBX contacts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const contacts = await getNSContacts(session.user.companyId);
    return NextResponse.json({ success: true, data: contacts, count: contacts.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    if (!hasPermission(session.user.role as any, 'settings.edit')) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
    }

    const body = await request.json();

    if (body.action === 'sync') {
      const result = await syncContactsToNS(session.user.companyId);
      return NextResponse.json({
        success: true,
        message: `Synced ${result.synced} contacts to PBX`,
        synced: result.synced,
        errors: result.errors,
      });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_ACTION' } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
