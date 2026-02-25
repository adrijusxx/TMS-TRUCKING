'use client';

import { use } from 'react';
import MVRManager from '@/components/safety/drivers/MVRManager';
import CDLManager from '@/components/safety/drivers/CDLManager';
import HOSDashboard from '@/components/safety/drivers/HOSDashboard';
import DrugTestManager from '@/components/safety/drivers/DrugTestManager';
import DQFManager from '@/components/safety/dqf/DQFManager';
import MedicalCardManager from '@/components/safety/drivers/MedicalCardManager';
import AnnualReviewForm from '@/components/safety/drivers/AnnualReviewForm';

type ComplianceType = 'mvr' | 'cdl' | 'hos' | 'drug-tests' | 'dqf' | 'medical-cards' | 'annual-review';

interface ComplianceConfig {
  component: React.ComponentType<{ driverId: string }>;
  breadcrumbLabel: string;
  breadcrumbHref: string;
  pageTitle: string;
}

const complianceConfigs: Record<ComplianceType, ComplianceConfig> = {
  'mvr': {
    component: MVRManager,
    breadcrumbLabel: 'MVR Tracking',
    breadcrumbHref: '/dashboard/safety/mvr',
    pageTitle: 'Driver Motor Vehicle Record',
  },
  'cdl': {
    component: CDLManager,
    breadcrumbLabel: 'CDL Records',
    breadcrumbHref: '/dashboard/safety/cdl',
    pageTitle: 'Driver CDL Records',
  },
  'hos': {
    component: HOSDashboard,
    breadcrumbLabel: 'HOS Monitoring',
    breadcrumbHref: '/dashboard/safety/hos',
    pageTitle: 'Driver Hours of Service',
  },
  'drug-tests': {
    component: DrugTestManager,
    breadcrumbLabel: 'Drug & Alcohol Tests',
    breadcrumbHref: '/dashboard/safety/drug-tests',
    pageTitle: 'Driver Drug & Alcohol Tests',
  },
  'dqf': {
    component: DQFManager,
    breadcrumbLabel: 'DQF Management',
    breadcrumbHref: '/dashboard/safety/dqf',
    pageTitle: 'Driver Qualification File',
  },
  'medical-cards': {
    component: MedicalCardManager,
    breadcrumbLabel: 'Medical Cards',
    breadcrumbHref: '/dashboard/safety/medical-cards',
    pageTitle: 'Driver Medical Cards',
  },
  'annual-review': {
    component: AnnualReviewForm,
    breadcrumbLabel: 'Annual Reviews',
    breadcrumbHref: '/dashboard/safety/annual-reviews',
    pageTitle: 'Driver Annual Review',
  },
};

export default function DriverCompliancePage({ 
  params 
}: { 
  params: Promise<{ driverId: string; complianceType: string }> 
}) {
  const { driverId, complianceType } = use(params);
  
  const config = complianceConfigs[complianceType as ComplianceType];
  
  if (!config) {
    return (
      <div className="space-y-4">
</div>
    );
  }

  const Component = config.component;

  return (
    <Component driverId={driverId} />
  );
}

