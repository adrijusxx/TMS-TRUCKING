import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { getDriverFilter, createFilterContext } from '@/lib/filters/role-data-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';
import { calculateComplianceStatus, calculateOverallCompliance } from '@/lib/utils/compliance-status';
import { DriverComplianceData, ComplianceFilter } from '@/types/compliance';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    if (!hasPermission(session.user.role as any, 'drivers.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter
    const mcWhere = await buildMcNumberWhereClause(session, request);

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');
    const complianceStatus = searchParams.get('complianceStatus') as ComplianceFilter['complianceStatus'];
    const mcNumberIdFilter = searchParams.get('mcNumberId');

    // Apply role-based filtering
    const roleFilter = await getDriverFilter(
      createFilterContext(
        session.user.id,
        session.user.role as any,
        session.user.companyId
      )
    );

    // Parse includeDeleted parameter
    const includeDeleted = parseIncludeDeleted(request);
    const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

    // Build where clause
    const where: any = {
      ...mcWhere,
      ...roleFilter,
      isActive: true,
      ...(deletedFilter && { ...deletedFilter }),
    };

    // Handle explicit MC number filter
    if (mcNumberIdFilter) {
      if (mcNumberIdFilter === 'null' || mcNumberIdFilter === 'unassigned') {
        where.mcNumberId = null;
      } else {
        where.mcNumberId = mcNumberIdFilter;
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { driverNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch drivers with all compliance data
    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          mcNumber: {
            select: {
              id: true,
              number: true,
            },
          },
          dqf: {
            include: {
              documents: {
                include: {
                  document: {
                    select: {
                      id: true,
                      title: true,
                      fileName: true,
                      fileUrl: true,
                    },
                  },
                },
              },
            },
          },
          medicalCards: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              expirationDate: 'desc',
            },
            take: 1,
            include: {
              document: {
                select: {
                  id: true,
                  fileName: true,
                  fileUrl: true,
                },
              },
            },
          },
          cdlRecord: {
            include: {
              document: {
                select: {
                  id: true,
                  fileName: true,
                  fileUrl: true,
                },
              },
            },
          },
          mvrRecords: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              pullDate: 'desc',
            },
            take: 1,
            include: {
              document: {
                select: {
                  id: true,
                  fileName: true,
                  fileUrl: true,
                },
              },
              violations: {
                orderBy: {
                  violationDate: 'desc',
                },
                take: 5,
              },
            },
          },
          drugAlcoholTests: {
            where: {
              deletedAt: null,
              testDate: {
                gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
              },
            },
            orderBy: {
              testDate: 'desc',
            },
            take: 5,
            include: {
              document: {
                select: {
                  id: true,
                  fileName: true,
                  fileUrl: true,
                },
              },
            },
          },
          hosViolations: {
            where: {
              violationDate: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
              },
            },
            orderBy: {
              violationDate: 'desc',
            },
            take: 10,
          },
          annualReviews: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              reviewDate: 'desc',
            },
            take: 5,
          },
        },
        orderBy: {
          driverNumber: 'asc',
        },
      }),
      prisma.driver.count({ where }),
    ]);

    // Transform drivers to compliance data format and apply compliance status filter
    let complianceData: DriverComplianceData[] = drivers.map((driver) => {
      // Calculate DQF status
      const dqfStatus = driver.dqf
        ? calculateComplianceStatus(
            driver.dqf.nextReviewDate,
            driver.dqf.status === 'COMPLETE'
          )
        : calculateComplianceStatus(null, false);

      // Calculate Medical Card status
      const latestMedicalCard = driver.medicalCards[0];
      const medicalCardStatus = latestMedicalCard
        ? calculateComplianceStatus(latestMedicalCard.expirationDate, true)
        : calculateComplianceStatus(null, false);

      // Calculate CDL status
      const cdlStatus = driver.cdlRecord
        ? calculateComplianceStatus(driver.cdlRecord.expirationDate, true)
        : calculateComplianceStatus(null, false);

      // Calculate MVR status (needs to be within 1 year)
      const latestMVR = driver.mvrRecords[0];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const mvrIsValid = latestMVR && new Date(latestMVR.pullDate) >= oneYearAgo;
      const mvrStatus = mvrIsValid
        ? calculateComplianceStatus(latestMVR.nextPullDueDate, true)
        : calculateComplianceStatus(null, false);

      // Calculate Drug Test status (needs recent test)
      const hasRecentDrugTest = driver.drugAlcoholTests.length > 0;
      const drugTestStatus = hasRecentDrugTest
        ? calculateComplianceStatus(null, true) // No expiration for tests, just need to exist
        : calculateComplianceStatus(null, false);

      // Calculate HOS status (based on violations)
      const hasRecentHOSViolations = driver.hosViolations.length > 0;
      const hosStatus = hasRecentHOSViolations
        ? calculateComplianceStatus(null, false) // Violations = non-compliant
        : calculateComplianceStatus(null, true);

      // Calculate Annual Review status
      const latestAnnualReview = driver.annualReviews[0];
      const annualReviewStatus = latestAnnualReview
        ? calculateComplianceStatus(latestAnnualReview.dueDate, latestAnnualReview.status === 'COMPLETED')
        : calculateComplianceStatus(null, false);

      // Calculate overall compliance
      const statusSummary = {
        dqf: dqfStatus,
        medicalCard: medicalCardStatus,
        cdl: cdlStatus,
        mvr: mvrStatus,
        drugTests: drugTestStatus,
        hos: hosStatus,
        annualReview: annualReviewStatus,
      };

      const overallCompliance = calculateOverallCompliance(statusSummary);

      return {
        driverId: driver.id,
        driverNumber: driver.driverNumber,
        driverName: `${driver.user.firstName} ${driver.user.lastName}`,
        mcNumberId: driver.mcNumberId,
        mcNumber: driver.mcNumber?.number || null,
        overallCompliance,
        dqf: driver.dqf
          ? {
              status: driver.dqf.status,
              lastReviewDate: driver.dqf.lastReviewDate,
              nextReviewDate: driver.dqf.nextReviewDate,
              documents: driver.dqf.documents.map((doc) => ({
                id: doc.id,
                documentId: doc.documentId,
                documentType: doc.documentType,
                status: doc.status,
                expirationDate: doc.expirationDate,
                issueDate: doc.issueDate,
                document: doc.document
                  ? {
                      id: doc.document.id,
                      title: doc.document.title,
                      fileName: doc.document.fileName,
                      fileUrl: doc.document.fileUrl,
                    }
                  : undefined,
              })),
            }
          : null,
        medicalCard: latestMedicalCard
          ? {
              id: latestMedicalCard.id,
              cardNumber: latestMedicalCard.cardNumber,
              expirationDate: latestMedicalCard.expirationDate,
              issueDate: latestMedicalCard.issueDate,
              medicalExaminerName: latestMedicalCard.medicalExaminerName,
              medicalExaminerCertificateNumber: latestMedicalCard.medicalExaminerCertificateNumber,
              waiverInformation: latestMedicalCard.waiverInformation,
              document: latestMedicalCard.document
                ? {
                    id: latestMedicalCard.document.id,
                    fileName: latestMedicalCard.document.fileName,
                    fileUrl: latestMedicalCard.document.fileUrl,
                  }
                : undefined,
              status: medicalCardStatus,
            }
          : null,
        cdl: driver.cdlRecord
          ? {
              id: driver.cdlRecord.id,
              cdlNumber: driver.cdlRecord.cdlNumber,
              expirationDate: driver.cdlRecord.expirationDate,
              issueDate: driver.cdlRecord.issueDate,
              issueState: driver.cdlRecord.issueState,
              licenseClass: driver.cdlRecord.licenseClass,
              endorsements: driver.cdlRecord.endorsements,
              restrictions: driver.cdlRecord.restrictions,
              document: driver.cdlRecord.document
                ? {
                    id: driver.cdlRecord.document.id,
                    fileName: driver.cdlRecord.document.fileName,
                    fileUrl: driver.cdlRecord.document.fileUrl,
                  }
                : undefined,
              status: cdlStatus,
            }
          : null,
        mvr: latestMVR
          ? {
              id: latestMVR.id,
              pullDate: latestMVR.pullDate,
              state: latestMVR.state,
              nextPullDueDate: latestMVR.nextPullDueDate,
              violations: latestMVR.violations.map((v) => ({
                id: v.id,
                violationCode: v.violationCode,
                violationDescription: v.violationDescription,
                violationDate: v.violationDate,
                state: v.state,
                points: v.points,
                isNew: v.isNew,
              })),
              document: latestMVR.document
                ? {
                    id: latestMVR.document.id,
                    fileName: latestMVR.document.fileName,
                    fileUrl: latestMVR.document.fileUrl,
                  }
                : undefined,
              status: mvrStatus,
            }
          : null,
        recentDrugTests: driver.drugAlcoholTests.map((test) => ({
          id: test.id,
          testDate: test.testDate,
          testType: test.testType,
          testResult: test.result,
          testingFacility: test.labName,
          document: test.document
            ? {
                id: test.document.id,
                fileName: test.document.fileName,
                fileUrl: test.document.fileUrl,
              }
            : undefined,
        })),
        hos: {
          violations: driver.hosViolations.map((v) => ({
            id: v.id,
            violationType: v.violationType,
            violationDate: v.violationDate,
            violationDescription: v.violationDescription,
            hoursExceeded: v.hoursExceeded,
          })),
          compliancePercentage: hasRecentHOSViolations ? 0 : 100,
        },
        annualReviews: driver.annualReviews.map((review) => ({
          id: review.id,
          reviewDate: review.reviewDate,
          dueDate: review.dueDate,
          reviewYear: review.reviewYear,
          status: review.status,
          reviewerId: review.reviewerId,
          reviewNotes: review.reviewNotes,
        })),
        statusSummary,
      };
    });

    // Apply compliance status filter if provided
    if (complianceStatus) {
      complianceData = complianceData.filter((data) => {
        const hasStatus = Object.values(data.statusSummary).some(
          (status) => status.status === complianceStatus
        );
        return hasStatus;
      });
    }

    // Recalculate total if filter was applied
    const filteredTotal = complianceStatus ? complianceData.length : total;

    return NextResponse.json({
      success: true,
      data: {
        drivers: complianceData,
        pagination: {
          page,
          limit,
          total: filteredTotal,
          totalPages: Math.ceil(filteredTotal / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching driver compliance data:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch driver compliance data',
        },
      },
      { status: 500 }
    );
  }
}

