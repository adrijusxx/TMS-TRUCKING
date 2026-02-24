import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateCitationSchema } from '@/lib/validations/citation';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const citation = await prisma.citation.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      include: {
        driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        truck: { select: { id: true, truckNumber: true } },
        trailer: { select: { id: true, trailerNumber: true } },
        documents: true,
        safetyTask: true,
      },
    });

    if (!citation) {
      return NextResponse.json({ error: 'Citation not found' }, { status: 404 });
    }
    return NextResponse.json({ data: citation });
  } catch (error) {
    console.error('Error fetching citation:', error);
    return NextResponse.json({ error: 'Failed to fetch citation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateCitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.citation.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Citation not found' }, { status: 404 });
    }

    const citation = await prisma.citation.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ data: citation });
  } catch (error) {
    console.error('Error updating citation:', error);
    return NextResponse.json({ error: 'Failed to update citation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.citation.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Citation not found' }, { status: 404 });
    }

    await prisma.citation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting citation:', error);
    return NextResponse.json({ error: 'Failed to delete citation' }, { status: 500 });
  }
}
