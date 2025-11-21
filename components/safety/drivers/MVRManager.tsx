'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Calendar, Plus, FileText } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface MVRViolation {
  id: string;
  violationCode: string;
  violationDescription: string;
  violationDate: string;
  state: string;
  points: number | null;
  isNew: boolean;
}

interface MVRRecord {
  id: string;
  pullDate: string;
  state: string;
  nextPullDueDate: string;
  violations: MVRViolation[];
  document: {
    id: string;
    fileName: string;
  } | null;
}

interface MVRManagerProps {
  driverId: string;
}

async function fetchMVRRecords(driverId: string) {
  const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/mvr`));
  if (!response.ok) throw new Error('Failed to fetch MVR records');
  return response.json() as Promise<{ mvrRecords: MVRRecord[] }>;
}

export default function MVRManager({ driverId }: MVRManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    pullDate: new Date().toISOString().split('T')[0],
    state: '',
    violations: [] as Array<{
      violationCode: string;
      violationDescription: string;
      violationDate: string;
      state: string;
      points: string;
    }>
  });
  const [currentViolation, setCurrentViolation] = useState({
    violationCode: '',
    violationDescription: '',
    violationDate: '',
    state: '',
    points: ''
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['mvr-records', driverId],
    queryFn: () => fetchMVRRecords(driverId)
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/mvr`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create MVR record');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mvr-records', driverId] });
      setShowForm(false);
      setFormData({
        pullDate: new Date().toISOString().split('T')[0],
        state: '',
        violations: []
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading MVR records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading MVR records</p>
        </div>
      </div>
    );
  }

  const mvrRecords = data?.mvrRecords || [];
  const latestRecord = mvrRecords[0];
  const nextPullDue = latestRecord ? new Date(latestRecord.nextPullDueDate) : null;
  const daysUntilPull = nextPullDue
    ? Math.ceil((nextPullDue.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const addViolation = () => {
    if (currentViolation.violationCode && currentViolation.violationDescription) {
      setFormData({
        ...formData,
        violations: [...formData.violations, currentViolation]
      });
      setCurrentViolation({
        violationCode: '',
        violationDescription: '',
        violationDate: '',
        state: '',
        points: ''
      });
    }
  };

  const removeViolation = (index: number) => {
    setFormData({
      ...formData,
      violations: formData.violations.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      pullDate: formData.pullDate,
      violations: formData.violations.map(v => ({
        ...v,
        points: v.points ? parseInt(v.points) : null
      }))
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MVR Records</h2>
          <p className="text-muted-foreground">Motor Vehicle Record tracking</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add MVR Record
        </Button>
      </div>

      {/* Next Pull Due Alert */}
      {nextPullDue && (
        <Card
          className={
            daysUntilPull && daysUntilPull <= 30
              ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
              : ''
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next MVR Pull Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Due Date:</span>
                <span>{formatDate(nextPullDue.toISOString())}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Days Remaining:</span>
                <Badge
                  className={
                    daysUntilPull && daysUntilPull <= 30
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }
                >
                  {daysUntilPull} days
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add MVR Record</CardTitle>
            <CardDescription>Enter motor vehicle record information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pull Date *</Label>
                  <Input
                    type="date"
                    value={formData.pullDate}
                    onChange={(e) => setFormData({ ...formData, pullDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={2}
                    placeholder="State code"
                    required
                  />
                </div>
              </div>

              {/* Violations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Violations</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addViolation}>
                    Add Violation
                  </Button>
                </div>

                {formData.violations.length > 0 && (
                  <div className="space-y-2">
                    {formData.violations.map((violation, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{violation.violationCode}</div>
                          <div className="text-sm text-muted-foreground">
                            {violation.violationDescription}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {violation.state} • {formatDate(violation.violationDate)}
                            {violation.points && ` • ${violation.points} points`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeViolation(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Violation Code</Label>
                    <Input
                      value={currentViolation.violationCode}
                      onChange={(e) =>
                        setCurrentViolation({ ...currentViolation, violationCode: e.target.value })
                      }
                      placeholder="e.g., SPEED"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={currentViolation.state}
                      onChange={(e) =>
                        setCurrentViolation({ ...currentViolation, state: e.target.value })
                      }
                      maxLength={2}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Violation Date</Label>
                    <Input
                      type="date"
                      value={currentViolation.violationDate}
                      onChange={(e) =>
                        setCurrentViolation({ ...currentViolation, violationDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={currentViolation.points}
                      onChange={(e) =>
                        setCurrentViolation({ ...currentViolation, points: e.target.value })
                      }
                      placeholder="Points"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={currentViolation.violationDescription}
                      onChange={(e) =>
                        setCurrentViolation({
                          ...currentViolation,
                          violationDescription: e.target.value
                        })
                      }
                      placeholder="Violation description"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Add MVR Record'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* MVR History */}
      <Card>
        <CardHeader>
          <CardTitle>MVR History</CardTitle>
          <CardDescription>All motor vehicle record pulls</CardDescription>
        </CardHeader>
        <CardContent>
          {mvrRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No MVR records on file</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mvrRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">
                        MVR Pull - {record.state} • {formatDate(record.pullDate)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Next pull due: {formatDate(record.nextPullDueDate)}
                      </div>
                    </div>
                    {record.document && (
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    )}
                  </div>

                  {record.violations.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-red-600">
                        {record.violations.length} Violation(s) Found
                      </div>
                      {record.violations.map((violation) => (
                        <div
                          key={violation.id}
                          className={`p-3 rounded-lg ${
                            violation.isNew
                              ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200'
                              : 'bg-gray-50 dark:bg-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium">{violation.violationCode}</div>
                            {violation.isNew && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                New
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {violation.violationDescription}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {violation.state} • {formatDate(violation.violationDate)}
                            {violation.points && ` • ${violation.points} points`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-green-600">No violations found</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

