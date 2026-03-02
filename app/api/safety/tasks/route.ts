import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSafetyTaskSchema } from '@/lib/validations/safety-task';
import { safetyTaskManager } from '@/lib/managers/SafetyTaskManager';

const TASK_INCLUDES = {
  driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  truck: { select: { id: true, truckNumber: true } },
  trailer: { select: { id: true, trailerNumber: true } },
  mcNumber: { select: { id: true, number: true, companyName: true } },
  load: { select: { id: true, loadNumber: true } },
  documents: { select: { id: true } },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const taskType = searchParams.get('taskType');
    const driverId = searchParams.get('driverId');
    const search = searchParams.get('search');
    const mcNumberId = searchParams.get('mcNumberId');
    const sortField = searchParams.get('sortField') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (taskType) where.taskType = taskType;
    if (driverId) where.driverId = driverId;
    if (mcNumberId) where.mcNumberId = mcNumberId;

    if (search) {
      where.OR = [
        { taskNumber: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.safetyTask.findMany({
        where,
        include: TASK_INCLUDES,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.safetyTask.count({ where }),
    ]);

    return NextResponse.json({
      data: tasks,
      meta: {
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching safety tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch safety tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createSafetyTaskSchema.parse(body);
    const task = await safetyTaskManager.createTask(session.user.companyId, validated);

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Error creating safety task:', error);
    return NextResponse.json({ error: 'Failed to create safety task' }, { status: 500 });
  }
}
