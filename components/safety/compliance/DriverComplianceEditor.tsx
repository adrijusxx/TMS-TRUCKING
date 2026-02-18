'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DriverComplianceData } from '@/types/compliance';
import { FileCheck, Heart, CreditCard, Search, TestTube, Clock, Calendar, FileText } from 'lucide-react';
import DQFTab from './tabs/DQFTab';
import MedicalTab from './tabs/MedicalTab';
import CDLTab from './tabs/CDLTab';
import MVRTab from './tabs/MVRTab';
import DrugTestsTab from './tabs/DrugTestsTab';
import HOSTab from './tabs/HOSTab';
import AnnualReviewTab from './tabs/AnnualReviewTab';
import DocumentsTab from './tabs/DocumentsTab';

interface DriverComplianceEditorProps {
  driver: DriverComplianceData;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
}

/** Returns a small colored dot for a ComplianceStatus status string */
function StatusDot({ status }: { status: string }) {
  if (status === 'EXPIRED' || status === 'MISSING' || status === 'INCOMPLETE')
    return <span className="ml-1.5 h-2 w-2 rounded-full bg-red-500 inline-block" />;
  if (status === 'EXPIRING')
    return <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-400 inline-block" />;
  if (status === 'COMPLETE')
    return <span className="ml-1.5 h-2 w-2 rounded-full bg-green-500 inline-block" />;
  return null;
}

/** Derive a worst-case DQF status from all DQF documents */
function getDQFStatus(driver: DriverComplianceData): string {
  const docs = driver.dqf?.documents ?? [];
  if (docs.some((d: any) => d.status === 'EXPIRED')) return 'EXPIRED';
  if (docs.some((d: any) => d.status === 'MISSING')) return 'MISSING';
  if (docs.some((d: any) => d.status === 'EXPIRING')) return 'EXPIRING';
  return 'COMPLETE';
}

export default function DriverComplianceEditor({
  driver,
  onSave,
  onCancel,
}: DriverComplianceEditorProps) {
  const [activeTab, setActiveTab] = useState('dqf');

  const ss = driver.statusSummary;
  const dqfStatus = getDQFStatus(driver);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Edit Compliance: {driver.driverName}</h3>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Close
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dqf" className="flex items-center">
            <FileCheck className="h-4 w-4 mr-1.5" />
            DQF
            <StatusDot status={dqfStatus} />
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex items-center">
            <Heart className="h-4 w-4 mr-1.5" />
            Medical
            <StatusDot status={ss.medicalCard?.status ?? ''} />
          </TabsTrigger>
          <TabsTrigger value="cdl" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-1.5" />
            CDL
            <StatusDot status={ss.cdl?.status ?? ''} />
          </TabsTrigger>
          <TabsTrigger value="mvr" className="flex items-center">
            <Search className="h-4 w-4 mr-1.5" />
            MVR
            <StatusDot status={ss.mvr?.status ?? ''} />
          </TabsTrigger>
          <TabsTrigger value="drug-tests" className="flex items-center">
            <TestTube className="h-4 w-4 mr-1.5" />
            Drug Tests
            <StatusDot status={ss.drugTests?.status ?? ''} />
          </TabsTrigger>
          <TabsTrigger value="hos" className="flex items-center">
            <Clock className="h-4 w-4 mr-1.5" />
            HOS
            <StatusDot status={ss.hos?.status ?? ''} />
          </TabsTrigger>
          <TabsTrigger value="annual-review" className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5" />
            Annual Review
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center">
            <FileText className="h-4 w-4 mr-1.5" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dqf" className="mt-4">
          <DQFTab driver={driver} onSave={onSave} />
        </TabsContent>

        <TabsContent value="medical" className="mt-4">
          <MedicalTab driver={driver} onSave={onSave} />
        </TabsContent>

        <TabsContent value="cdl" className="mt-4">
          <CDLTab driver={driver} onSave={onSave} />
        </TabsContent>

        <TabsContent value="mvr" className="mt-4">
          <MVRTab driver={driver} onSave={onSave} />
        </TabsContent>

        <TabsContent value="drug-tests" className="mt-4">
          <DrugTestsTab driver={driver} onSave={onSave} />
        </TabsContent>

        <TabsContent value="hos" className="mt-4">
          <HOSTab driver={driver} />
        </TabsContent>

        <TabsContent value="annual-review" className="mt-4">
          <AnnualReviewTab driver={driver} onSave={onSave} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsTab driverId={driver.driverId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
