'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, FileText, User, Truck, Camera, MessageSquare } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface Investigation {
  id: string;
  status: string;
  assignedDate: string;
  dueDate: string | null;
  driverInterviewed: boolean;
  eldDataReviewed: boolean;
  vehicleExamined: boolean;
  photosReviewed: boolean;
  witnessStatementsReviewed: boolean;
  policeReportReviewed: boolean;
  contributingFactors: string | null;
  rootCause: string | null;
  findings: string | null;
  correctiveActions: string | null;
  recommendations: string | null;
  incident: {
    id: string;
    incidentNumber: string;
    incidentType: string;
    date: string;
    driver: {
      user: {
        firstName: string;
        lastName: string;
      };
    } | null;
    truck: {
      truckNumber: string;
    } | null;
  };
}

interface InvestigationWorkflowProps {
  incidentId: string;
}

async function fetchInvestigation(incidentId: string) {
  const response = await fetch(apiUrl(`/api/safety/incidents/${incidentId}/investigation`));
  if (!response.ok) throw new Error('Failed to fetch investigation');
  return response.json() as Promise<{ investigation: Investigation | null }>;
}

const INVESTIGATION_STEPS = [
  { key: 'driverInterviewed', label: 'Driver Interviewed', icon: User },
  { key: 'eldDataReviewed', label: 'ELD Data Reviewed', icon: FileText },
  { key: 'vehicleExamined', label: 'Vehicle Examined', icon: Truck },
  { key: 'photosReviewed', label: 'Photos Reviewed', icon: Camera },
  { key: 'witnessStatementsReviewed', label: 'Witness Statements Reviewed', icon: MessageSquare },
  { key: 'policeReportReviewed', label: 'Police Report Reviewed', icon: FileText }
];

export default function InvestigationWorkflow({ incidentId }: InvestigationWorkflowProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    driverInterviewed: false,
    eldDataReviewed: false,
    vehicleExamined: false,
    photosReviewed: false,
    witnessStatementsReviewed: false,
    policeReportReviewed: false,
    contributingFactors: '',
    rootCause: '',
    findings: '',
    correctiveActions: '',
    recommendations: ''
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['investigation', incidentId],
    queryFn: () => fetchInvestigation(incidentId)
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/incidents/${incidentId}/investigation`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update investigation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigation', incidentId] });
    }
  });

  useEffect(() => {
    if (data?.investigation) {
      const inv = data.investigation;
      setFormData({
        driverInterviewed: inv.driverInterviewed,
        eldDataReviewed: inv.eldDataReviewed,
        vehicleExamined: inv.vehicleExamined,
        photosReviewed: inv.photosReviewed,
        witnessStatementsReviewed: inv.witnessStatementsReviewed,
        policeReportReviewed: inv.policeReportReviewed,
        contributingFactors: inv.contributingFactors || '',
        rootCause: inv.rootCause || '',
        findings: inv.findings || '',
        correctiveActions: inv.correctiveActions || '',
        recommendations: inv.recommendations || ''
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading investigation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading investigation</p>
        </div>
      </div>
    );
  }

  const investigation = data?.investigation;

  if (!investigation) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No investigation started</p>
          <Button
            onClick={() =>
              updateMutation.mutate({
                status: 'PENDING',
                ...formData
              })
            }
          >
            Start Investigation
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = INVESTIGATION_STEPS.filter(
    step => formData[step.key as keyof typeof formData]
  ).length;
  const progress = (completedSteps / INVESTIGATION_STEPS.length) * 100;

  const handleStepToggle = (key: string) => {
    setFormData({
      ...formData,
      [key]: !formData[key as keyof typeof formData]
    });
  };

  const handleSave = () => {
    updateMutation.mutate({
      ...formData,
      status: investigation.status
    });
  };

  const handleComplete = () => {
    updateMutation.mutate({
      ...formData,
      status: 'COMPLETED'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Investigation Workflow</h2>
        <p className="text-muted-foreground">
          Incident: {investigation.incident.incidentNumber}
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Investigation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Completion</span>
              <span>{completedSteps} of {INVESTIGATION_STEPS.length} steps</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Investigation Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Investigation Steps</CardTitle>
          <CardDescription>Complete each step of the investigation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {INVESTIGATION_STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = formData[step.key as keyof typeof formData];
              return (
                <div
                  key={step.key}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    isCompleted ? 'bg-green-50 dark:bg-green-950/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor={step.key} className="font-medium cursor-pointer">
                      {step.label}
                    </Label>
                  </div>
                  <Checkbox
                    id={step.key}
                    checked={isCompleted as boolean}
                    onCheckedChange={() => handleStepToggle(step.key)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Investigation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Investigation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Contributing Factors</Label>
            <Textarea
              value={formData.contributingFactors}
              onChange={(e) =>
                setFormData({ ...formData, contributingFactors: e.target.value })
              }
              placeholder="What factors contributed to this incident?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Root Cause</Label>
            <Textarea
              value={formData.rootCause}
              onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
              placeholder="What was the root cause of this incident?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Findings</Label>
            <Textarea
              value={formData.findings}
              onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
              placeholder="Investigation findings"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Corrective Actions</Label>
            <Textarea
              value={formData.correctiveActions}
              onChange={(e) =>
                setFormData({ ...formData, correctiveActions: e.target.value })
              }
              placeholder="What corrective actions will be taken?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Recommendations</Label>
            <Textarea
              value={formData.recommendations}
              onChange={(e) =>
                setFormData({ ...formData, recommendations: e.target.value })
              }
              placeholder="Recommendations for prevention"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleSave} disabled={updateMutation.isPending}>
          Save Progress
        </Button>
        <Button onClick={handleComplete} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Complete Investigation'}
        </Button>
      </div>
    </div>
  );
}

