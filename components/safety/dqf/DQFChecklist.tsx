'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DQFChecklistProps {
  dqf: {
    id: string;
    documents: Array<{
      id: string;
      documentType: string;
      status: string;
      expirationDate: string | null;
      document: {
        id: string;
        title: string;
        fileName: string;
      };
    }>;
  };
  driverId: string;
}

const REQUIRED_DOCUMENTS = [
  { type: 'APPLICATION', label: 'Application for Employment' },
  { type: 'ROAD_TEST', label: 'Road Test Certificate' },
  { type: 'PREVIOUS_EMPLOYMENT_VERIFICATION', label: 'Previous Employment Verification' },
  { type: 'ANNUAL_REVIEW', label: 'Annual Review' },
  { type: 'MEDICAL_EXAMINERS_CERTIFICATE', label: "Medical Examiner's Certificate" },
  { type: 'CDL_COPY', label: 'CDL Copy' },
  { type: 'MVR_RECORD', label: 'MVR Record' },
  { type: 'DRUG_TEST_RESULT', label: 'Drug Test Result' },
  { type: 'ALCOHOL_TEST_RESULT', label: 'Alcohol Test Result' },
  { type: 'TRAINING_CERTIFICATE', label: 'Training Certificate' }
];

export default function DQFChecklist({ dqf, driverId }: DQFChecklistProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'MISSING':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'EXPIRING':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'EXPIRED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      case 'MISSING':
        return <Badge className="bg-red-100 text-red-800">Missing</Badge>;
      case 'EXPIRING':
        return <Badge className="bg-orange-100 text-orange-800">Expiring</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const documentsByType = dqf.documents.reduce((acc: any, doc) => {
    acc[doc.documentType] = doc;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Required Documents Checklist</CardTitle>
        <CardDescription>
          All required documents for DOT compliance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {REQUIRED_DOCUMENTS.map((required) => {
            const document = documentsByType[required.type];
            const status = document?.status || 'MISSING';

            return (
              <div
                key={required.type}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <div>
                    <div className="font-medium">{required.label}</div>
                    {document?.expirationDate && (
                      <div className="text-sm text-muted-foreground">
                        Expires: {formatDate(document.expirationDate)}
                      </div>
                    )}
                    {document?.document && (
                      <div className="text-sm text-muted-foreground">
                        {document.document.fileName}
                      </div>
                    )}
                  </div>
                </div>
                {getStatusBadge(status)}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

