import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * Generate random drug/alcohol test selection
 * DOT requires: 50% drug testing, 10% alcohol testing annually
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { poolType, quarter, year } = body;

    if (!poolType || !quarter || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: poolType, quarter, year' },
        { status: 400 }
      );
    }

    // Get or create testing pool
    let pool = await prisma.testingPool.findUnique({
      where: {
        companyId_poolType_quarter_year: {
          companyId: session.user.companyId,
          poolType: poolType as any,
          quarter: quarter,
          year: year
        }
      },
      include: {
        drivers: {
          include: {
            driver: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!pool) {
      // Create pool with all eligible CDL drivers
      const eligibleDrivers = await prisma.driver.findMany({
        where: {
          companyId: session.user.companyId,
          employeeStatus: 'ACTIVE',
          deletedAt: null
        }
      });

      pool = await prisma.testingPool.create({
        data: {
          companyId: session.user.companyId,
          poolType: poolType as any,
          quarter: quarter,
          year: year,
          drivers: {
            create: eligibleDrivers.map(driver => ({
              driverId: driver.id,
              isEligible: true
            }))
          }
        },
        include: {
          drivers: {
            include: {
              driver: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });
    }

    // Calculate selection percentage
    const percentage = poolType === 'DRUG' ? 0.50 : 0.10; // 50% drug, 10% alcohol
    const eligibleCount = pool.drivers.filter(d => d.isEligible).length;
    const selectionCount = Math.ceil(eligibleCount * percentage);

    // Random selection algorithm (Fisher-Yates shuffle)
    const eligibleDrivers = pool.drivers.filter(d => d.isEligible);
    const shuffled = [...eligibleDrivers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, selectionCount);

    // Create random selection record
    const selection = await prisma.randomSelection.create({
      data: {
        companyId: session.user.companyId,
        poolId: pool.id,
        selectionDate: new Date(),
        selectionMethod: 'FISHER_YATES_SHUFFLE',
        selectedDrivers: {
          create: selected.map(driver => ({
            driverId: driver.driverId
          }))
        }
      },
      include: {
        selectedDrivers: {
          include: {
            driver: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      selection,
      poolSize: eligibleCount,
      selectedCount: selectionCount,
      percentage: percentage * 100
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating random selection:', error);
    return NextResponse.json(
      { error: 'Failed to generate random selection' },
      { status: 500 }
    );
  }
}

