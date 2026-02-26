import { PrismaClient } from '@prisma/client';
import { BaseComplianceService } from './BaseComplianceService';

export interface AuditDocumentItem {
  documentType: string;
  label: string;
  status: 'COMPLETE' | 'MISSING' | 'EXPIRED' | 'EXPIRING';
  expirationDate?: Date | null;
  documentId?: string | null;
}

export interface AuditPackage {
  driverId: string;
  driverName: string;
  readinessPercentage: number;
  documents: AuditDocumentItem[];
  totalRequired: number;
  totalComplete: number;
  totalMissing: number;
  totalExpired: number;
}

export interface GapItem {
  documentType: string;
  label: string;
  issue: 'MISSING' | 'EXPIRED' | 'EXPIRING';
  expirationDate?: Date | null;
  remediation: string;
}

export interface ReadinessReport {
  companyId: string;
  totalDrivers: number;
  auditReadyDrivers: number;
  readinessPercentage: number;
  commonGaps: Array<{ documentType: string; count: number }>;
}

const REQUIRED_DOT_DOCUMENTS = [
  { type: 'APPLICATION', label: 'Application for Employment' },
  { type: 'ROAD_TEST', label: 'Road Test Certificate' },
  { type: 'EMPLOYMENT_VERIFICATION', label: 'Previous Employment Verification (3 years)' },
  { type: 'ANNUAL_REVIEW', label: 'Annual Review of Driving Record' },
  { type: 'MEDICAL_CERTIFICATE', label: "Medical Examiner's Certificate" },
  { type: 'CDL', label: 'CDL Copy' },
  { type: 'MVR', label: 'Motor Vehicle Record (Annual)' },
  { type: 'DRUG_ALCOHOL_TEST', label: 'Drug & Alcohol Test Results' },
  { type: 'TRAINING_CERTIFICATE', label: 'Safety Training Records' },
] as const;

export class DOTAuditService extends BaseComplianceService {
  constructor(prisma: PrismaClient, companyId?: string, mcNumberId?: string) {
    super(prisma, companyId, mcNumberId);
  }

  async generateAuditPackage(driverId: string): Promise<AuditPackage> {
    try {
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          dqf: { include: { documents: true } },
          medicalCards: { orderBy: { expirationDate: 'desc' }, take: 1 },
          cdlRecord: true,
          mvrRecords: { orderBy: { pullDate: 'desc' }, take: 1 },
          drugAlcoholTests: { orderBy: { testDate: 'desc' }, take: 1, where: { deletedAt: null } },
          safetyTrainings: {
            where: { completed: true, deletedAt: null },
            orderBy: { completionDate: 'desc' },
            take: 1,
          },
        },
      });

      if (!driver) throw new Error('Driver not found');

      const documents = this.evaluateDocuments(driver);
      const totalComplete = documents.filter((d) => d.status === 'COMPLETE').length;
      const totalMissing = documents.filter((d) => d.status === 'MISSING').length;
      const totalExpired = documents.filter((d) => d.status === 'EXPIRED').length;

      return {
        driverId,
        driverName: `${driver.user?.firstName ?? ''} ${driver.user?.lastName ?? ''}`.trim(),
        readinessPercentage: Math.round((totalComplete / REQUIRED_DOT_DOCUMENTS.length) * 100),
        documents,
        totalRequired: REQUIRED_DOT_DOCUMENTS.length,
        totalComplete,
        totalMissing,
        totalExpired,
      };
    } catch (error) {
      this.handleError(error, 'Failed to generate audit package');
    }
  }

  async getGapAnalysis(driverId: string): Promise<GapItem[]> {
    try {
      const auditPackage = await this.generateAuditPackage(driverId);

      return auditPackage.documents
        .filter((doc) => doc.status !== 'COMPLETE')
        .map((doc) => ({
          documentType: doc.documentType,
          label: doc.label,
          issue: doc.status as 'MISSING' | 'EXPIRED' | 'EXPIRING',
          expirationDate: doc.expirationDate,
          remediation: this.getRemediation(doc.documentType, doc.status),
        }));
    } catch (error) {
      this.handleError(error, 'Failed to get gap analysis');
    }
  }

  async getAuditReadiness(companyId: string): Promise<ReadinessReport> {
    try {
      const drivers = await this.prisma.driver.findMany({
        where: { companyId, deletedAt: null, isActive: true },
        select: { id: true },
      });

      const gapCounts = new Map<string, number>();
      let auditReadyCount = 0;

      for (const driver of drivers) {
        const pkg = await this.generateAuditPackage(driver.id);
        if (pkg.readinessPercentage === 100) auditReadyCount++;

        for (const doc of pkg.documents) {
          if (doc.status !== 'COMPLETE') {
            gapCounts.set(doc.documentType, (gapCounts.get(doc.documentType) ?? 0) + 1);
          }
        }
      }

      const commonGaps = Array.from(gapCounts.entries())
        .map(([documentType, count]) => ({ documentType, count }))
        .sort((a, b) => b.count - a.count);

      return {
        companyId,
        totalDrivers: drivers.length,
        auditReadyDrivers: auditReadyCount,
        readinessPercentage:
          drivers.length > 0 ? Math.round((auditReadyCount / drivers.length) * 100) : 0,
        commonGaps,
      };
    } catch (error) {
      this.handleError(error, 'Failed to get audit readiness');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private evaluateDocuments(driver: any): AuditDocumentItem[] {
    const dqfDocs = driver.dqf?.documents ?? [];

    return REQUIRED_DOT_DOCUMENTS.map(({ type, label }) => {
      switch (type) {
        case 'MEDICAL_CERTIFICATE': {
          const card = driver.medicalCards?.[0];
          if (!card) return { documentType: type, label, status: 'MISSING' as const };
          if (this.isExpired(card.expirationDate))
            return { documentType: type, label, status: 'EXPIRED' as const, expirationDate: card.expirationDate };
          if (this.isExpiringSoon(card.expirationDate))
            return { documentType: type, label, status: 'EXPIRING' as const, expirationDate: card.expirationDate };
          return { documentType: type, label, status: 'COMPLETE' as const, expirationDate: card.expirationDate };
        }
        case 'CDL': {
          const cdl = driver.cdlRecord;
          if (!cdl) return { documentType: type, label, status: 'MISSING' as const };
          if (this.isExpired(cdl.expirationDate))
            return { documentType: type, label, status: 'EXPIRED' as const, expirationDate: cdl.expirationDate };
          if (this.isExpiringSoon(cdl.expirationDate))
            return { documentType: type, label, status: 'EXPIRING' as const, expirationDate: cdl.expirationDate };
          return { documentType: type, label, status: 'COMPLETE' as const, expirationDate: cdl.expirationDate };
        }
        case 'MVR': {
          const mvr = driver.mvrRecords?.[0];
          if (!mvr) return { documentType: type, label, status: 'MISSING' as const };
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          if (mvr.pullDate < oneYearAgo)
            return { documentType: type, label, status: 'EXPIRED' as const };
          return { documentType: type, label, status: 'COMPLETE' as const };
        }
        case 'DRUG_ALCOHOL_TEST': {
          const test = driver.drugAlcoholTests?.[0];
          if (!test) return { documentType: type, label, status: 'MISSING' as const };
          return { documentType: type, label, status: 'COMPLETE' as const };
        }
        case 'TRAINING_CERTIFICATE': {
          const training = driver.safetyTrainings?.[0];
          if (!training) return { documentType: type, label, status: 'MISSING' as const };
          if (training.expiryDate && this.isExpired(training.expiryDate))
            return { documentType: type, label, status: 'EXPIRED' as const, expirationDate: training.expiryDate };
          return { documentType: type, label, status: 'COMPLETE' as const };
        }
        default: {
          const dqfDoc = dqfDocs.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (d: any) => d.documentType === type
          );
          if (!dqfDoc) return { documentType: type, label, status: 'MISSING' as const };
          if (dqfDoc.status === 'EXPIRED')
            return { documentType: type, label, status: 'EXPIRED' as const };
          return { documentType: type, label, status: 'COMPLETE' as const, documentId: dqfDoc.documentId };
        }
      }
    });
  }

  private getRemediation(documentType: string, status: string): string {
    const remediations: Record<string, string> = {
      APPLICATION: 'Upload a completed employment application form',
      ROAD_TEST: 'Schedule and complete a road test with a qualified examiner',
      EMPLOYMENT_VERIFICATION: 'Request employment verification from previous employers',
      ANNUAL_REVIEW: 'Schedule annual driving record review with the safety department',
      MEDICAL_CERTIFICATE: status === 'EXPIRED'
        ? 'Schedule a new DOT physical examination immediately'
        : 'Schedule DOT physical examination before expiration',
      CDL: status === 'EXPIRED'
        ? 'Driver must renew CDL immediately - cannot operate CMV'
        : 'Schedule CDL renewal before expiration date',
      MVR: 'Request a new MVR pull from the state DMV',
      DRUG_ALCOHOL_TEST: 'Schedule required drug/alcohol test through approved collection site',
      TRAINING_CERTIFICATE: 'Assign and complete required safety training courses',
    };
    return remediations[documentType] ?? 'Contact the safety department for guidance';
  }
}
