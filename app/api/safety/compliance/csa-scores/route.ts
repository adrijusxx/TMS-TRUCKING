import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    const scores = await prisma.cSAScore.findMany({
      where: {
        companyId: session.user.companyId
      },
      orderBy: { scoreDate: 'desc' },
      take: limit
    });

    // Group by BASIC category and get latest
    const scoresByCategory = scores.reduce((acc: any, score) => {
      if (!acc[score.basicCategory] || acc[score.basicCategory].scoreDate < score.scoreDate) {
        acc[score.basicCategory] = score;
      }
      return acc;
    }, {});

    return NextResponse.json({
      currentScores: scoresByCategory,
      history: scores
    });
  } catch (error) {
    console.error('Error fetching CSA scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CSA scores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Create CSA score record
    const score = await prisma.cSAScore.create({
      data: {
        companyId: session.user.companyId!,
        scoreDate: new Date(body.scoreDate),
        basicCategory: body.basicCategory,
        percentile: body.percentile,
        score: body.score,
        previousPercentile: body.previousPercentile,
        trend: body.trend,
        violationCount: body.violationCount || 0,
        violationDetails: body.violationDetails
      }
    });

    // Check if score crosses intervention threshold (75th percentile)
    if (body.percentile >= 75) {
      // Create alert
      const { AlertService } = await import('@/lib/services/safety/AlertService');
      const alertService = new AlertService(prisma, session.user.companyId!);
      await alertService.createAlert({
        companyId: session.user.companyId!,
        alertType: 'HIGH_CSA_SCORE',
        severity: 'HIGH',
        title: `High CSA Score: ${body.basicCategory}`,
        message: `CSA score for ${body.basicCategory} is ${body.percentile}% (intervention threshold: 75%)`,
        relatedEntityType: 'compliance',
        relatedEntityId: score.id
      });
    }

    return NextResponse.json({ score }, { status: 201 });
  } catch (error) {
    console.error('Error creating CSA score:', error);
    return NextResponse.json(
      { error: 'Failed to create CSA score' },
      { status: 500 }
    );
  }
}

