import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const types = await prisma.companyCustomDQFType.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ types });
  } catch (error) {
    console.error('Error fetching custom DQF types:', error);
    return NextResponse.json({ error: 'Failed to fetch custom DQF types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const type = await prisma.companyCustomDQFType.create({
      data: {
        companyId: session.user.companyId,
        name: name.trim(),
      },
    });

    return NextResponse.json({ type }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A custom document type with this name already exists' }, { status: 409 });
    }
    console.error('Error creating custom DQF type:', error);
    return NextResponse.json({ error: 'Failed to create custom DQF type' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.companyCustomDQFType.delete({
      where: { id, companyId: session.user.companyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom DQF type:', error);
    return NextResponse.json({ error: 'Failed to delete custom DQF type' }, { status: 500 });
  }
}
