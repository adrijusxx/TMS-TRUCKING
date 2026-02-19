import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getVoicemails, countVoicemails, deleteVoicemail, saveVoicemail } from '@/lib/integrations/netsapiens';
import type { VoicemailFolder } from '@/lib/integrations/netsapiens/voicemail';

/**
 * NetSapiens Voicemail API
 * GET    /api/integrations/netsapiens/voicemail?folder=new
 * DELETE /api/integrations/netsapiens/voicemail?id={voicemailId}
 * PATCH  /api/integrations/netsapiens/voicemail?id={voicemailId}&action=save
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { voipConfig: true, companyId: true },
    });

    const extension = (user?.voipConfig as any)?.pbxExtension || (user?.voipConfig as any)?.username;
    if (!extension) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'PBX extension not configured' } },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folder = (searchParams.get('folder') || 'new') as VoicemailFolder;

    const [voicemails, count] = await Promise.all([
      getVoicemails(extension, folder, user?.companyId || undefined),
      countVoicemails(extension, folder, user?.companyId || undefined),
    ]);

    return NextResponse.json({ success: true, data: voicemails, count, folder });
  } catch (error: any) {
    console.error('[NetSapiens Voicemail] Error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const voicemailId = searchParams.get('id');
    if (!voicemailId) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Voicemail ID required' } }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { voipConfig: true, companyId: true },
    });
    const extension = (user?.voipConfig as any)?.pbxExtension;
    if (!extension) {
      return NextResponse.json({ success: false, error: { code: 'NOT_CONFIGURED' } }, { status: 400 });
    }

    await deleteVoicemail(extension, voicemailId, user?.companyId || undefined);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const voicemailId = searchParams.get('id');
    const action = searchParams.get('action');

    if (!voicemailId) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Voicemail ID required' } }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { voipConfig: true, companyId: true },
    });
    const extension = (user?.voipConfig as any)?.pbxExtension;
    if (!extension) {
      return NextResponse.json({ success: false, error: { code: 'NOT_CONFIGURED' } }, { status: 400 });
    }

    if (action === 'save') {
      await saveVoicemail(extension, voicemailId, user?.companyId || undefined);
      return NextResponse.json({ success: true, message: 'Voicemail saved' });
    }

    return NextResponse.json({ success: false, error: { code: 'INVALID_ACTION', message: 'Unknown action' } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
