import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateInsurancePolicySchema } from '@/lib/validations/insurance-policy';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const policy = await prisma.insurancePolicy.findFirst({
      where: { id, companyId: session.user.companyId, deletedAt: null },
      include: {
        claims: {
          include: {
            driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          },
        },
        certificates: true,
      },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json({ data: policy });
  } catch (error) {
    console.error('Error fetching insurance policy:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance policy' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateInsurancePolicySchema.parse(body);

    const policy = await prisma.insurancePolicy.update({
      where: { id },
      data: {
        ...(parsed.policyType && { policyType: parsed.policyType }),
        ...(parsed.policyNumber && { policyNumber: parsed.policyNumber }),
        ...(parsed.insuranceCompany && { insuranceCompany: parsed.insuranceCompany }),
        ...(parsed.agentName !== undefined && { agentName: parsed.agentName }),
        ...(parsed.agentPhone !== undefined && { agentPhone: parsed.agentPhone }),
        ...(parsed.agentEmail !== undefined && { agentEmail: parsed.agentEmail }),
        ...(parsed.coverageLimit !== undefined && { coverageLimit: parsed.coverageLimit }),
        ...(parsed.deductible !== undefined && { deductible: parsed.deductible }),
        ...(parsed.effectiveDate && { effectiveDate: parsed.effectiveDate }),
        ...(parsed.renewalDate && { renewalDate: parsed.renewalDate }),
        ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
      },
    });

    return NextResponse.json({ data: policy });
  } catch (error) {
    console.error('Error updating insurance policy:', error);
    return NextResponse.json({ error: 'Failed to update insurance policy' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.insurancePolicy.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting insurance policy:', error);
    return NextResponse.json({ error: 'Failed to delete insurance policy' }, { status: 500 });
  }
}
