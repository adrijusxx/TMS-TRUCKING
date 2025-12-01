/**
 * TypeScript interfaces for driver compliance data
 */

export interface ComplianceStatus {
  status: 'COMPLETE' | 'INCOMPLETE' | 'EXPIRING' | 'EXPIRED' | 'MISSING';
  daysUntilExpiration: number | null;
  expirationDate: Date | null;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
}

interface DQFCompliance {
  status: 'COMPLETE' | 'INCOMPLETE' | 'EXPIRING' | 'EXPIRED';
  lastReviewDate: Date | null;
  nextReviewDate: Date | null;
  documents: Array<{
    id: string;
    documentType: string;
    status: 'COMPLETE' | 'MISSING' | 'EXPIRING' | 'EXPIRED';
    expirationDate: Date | null;
    issueDate: Date | null;
    document?: {
      id: string;
      title: string;
      fileName: string;
      fileUrl: string;
    };
  }>;
}

interface MedicalCardCompliance {
  id: string;
  cardNumber: string;
  expirationDate: Date;
  issueDate: Date | null;
  medicalExaminerName: string | null;
  medicalExaminerCertificateNumber: string | null;
  waiverInformation: string | null;
  document?: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
  status: ComplianceStatus;
}

interface CDLCompliance {
  id: string;
  cdlNumber: string;
  expirationDate: Date;
  issueDate: Date | null;
  issueState: string;
  licenseClass: string | null;
  endorsements: string[];
  restrictions: string[];
  document?: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
  status: ComplianceStatus;
}

interface MVRCompliance {
  id: string;
  pullDate: Date;
  state: string;
  nextPullDueDate: Date;
  violations: Array<{
    id: string;
    violationCode: string;
    violationDescription: string;
    violationDate: Date;
    state: string;
    points: number | null;
    isNew: boolean;
  }>;
  document?: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
  status: ComplianceStatus;
}

interface DrugTestCompliance {
  id: string;
  testDate: Date;
  testType: string;
  testResult: string;
  testingFacility: string | null;
  document?: {
    id: string;
    fileName: string;
    fileUrl: string;
  };
}

interface HOSCompliance {
  violations: Array<{
    id: string;
    violationType: string;
    violationDate: Date;
    violationDescription: string;
    hoursExceeded: number | null;
  }>;
  compliancePercentage: number;
}

interface AnnualReviewCompliance {
  id: string;
  reviewDate: Date;
  dueDate: Date;
  reviewYear: number;
  status: string;
  reviewerId: string | null;
  reviewNotes: string | null;
}

export interface DriverComplianceData {
  driverId: string;
  driverNumber: string;
  driverName: string;
  mcNumberId: string | null;
  mcNumber: string | null;
  overallCompliance: number; // Percentage 0-100
  dqf: DQFCompliance | null;
  medicalCard: MedicalCardCompliance | null;
  cdl: CDLCompliance | null;
  mvr: MVRCompliance | null;
  recentDrugTests: DrugTestCompliance[];
  hos: HOSCompliance;
  annualReviews: AnnualReviewCompliance[];
  statusSummary: {
    dqf: ComplianceStatus;
    medicalCard: ComplianceStatus;
    cdl: ComplianceStatus;
    mvr: ComplianceStatus;
    drugTests: ComplianceStatus;
    hos: ComplianceStatus;
    annualReview: ComplianceStatus;
  };
}

interface ComplianceEditorData {
  driverId: string;
  dqf?: Partial<DQFCompliance>;
  medicalCard?: Partial<MedicalCardCompliance>;
  cdl?: Partial<CDLCompliance>;
  mvr?: Partial<MVRCompliance>;
  drugTest?: Partial<DrugTestCompliance>;
  annualReview?: Partial<AnnualReviewCompliance>;
}

export interface ComplianceFilter {
  mcNumberId?: string | string[];
  complianceStatus?: 'COMPLETE' | 'INCOMPLETE' | 'EXPIRING' | 'EXPIRED';
  expirationDateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

