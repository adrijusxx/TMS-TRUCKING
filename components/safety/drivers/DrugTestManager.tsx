'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, FileText, TestTube } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface DrugTest {
  id: string;
  testType: string;
  testDate: string;
  result: string;
  isRandom: boolean;
  labName: string | null;
  labReportNumber: string | null;
  collectionSiteName?: string | null;
  document: {
    id: string;
    fileName: string;
  } | null;
}

interface DrugTestManagerProps {
  driverId: string;
}

async function fetchDrugTests(driverId: string, testType?: string, year?: string) {
  const params = new URLSearchParams();
  if (testType) params.set('testType', testType);
  if (year) params.set('year', year);

  const response = await fetch(
    apiUrl(`/api/safety/drivers/${driverId}/drug-tests?${params}`)
  );
  if (!response.ok) throw new Error('Failed to fetch drug tests');
  return response.json() as Promise<{ tests: DrugTest[] }>;
}

export default function DrugTestManager({ driverId }: DrugTestManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [formData, setFormData] = useState({
    testType: 'DRUG',
    testDate: new Date().toISOString().split('T')[0],
    result: 'NEGATIVE',
    isRandom: false,
    labName: '',
    labAddress: '',
    labPhone: '',
    labReportNumber: '',
    collectionSiteName: '',
    collectionSiteAddress: '',
    mroName: '',
    mroPhone: '',
    notes: ''
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['drug-tests', driverId, filterType, filterYear],
    queryFn: () => fetchDrugTests(driverId, filterType === 'all' ? undefined : filterType, filterYear || undefined)
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/drug-tests`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create drug test');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drug-tests', driverId] });
      setShowForm(false);
      setFormData({
        testType: 'DRUG',
        testDate: new Date().toISOString().split('T')[0],
        result: 'NEGATIVE',
        isRandom: false,
        labName: '',
        labAddress: '',
        labPhone: '',
        labReportNumber: '',
        collectionSiteName: '',
        collectionSiteAddress: '',
        mroName: '',
        mroPhone: '',
        notes: ''
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading drug tests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading drug tests</p>
        </div>
      </div>
    );
  }

  const tests = data?.tests || [];
  const positiveTests = tests.filter(t => t.result === 'POSITIVE');
  const recentTests = tests.slice(0, 5);

  const getResultColor = (result: string) => {
    return result === 'POSITIVE'
      ? 'bg-red-100 text-red-800'
      : result === 'NEGATIVE'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      testDate: formData.testDate
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Drug & Alcohol Tests</h2>
          <p className="text-muted-foreground">Test records and compliance tracking</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Test
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DRUG">Drug</SelectItem>
                  <SelectItem value="ALCOHOL">Alcohol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                placeholder="Year"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positive Tests Alert */}
      {positiveTests.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600">Positive Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {positiveTests.map((test) => (
                <div key={test.id} className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {test.testType} Test - {formatDate(test.testDate)}
                      </div>
                      {test.labName && (
                        <div className="text-sm text-muted-foreground">Lab: {test.labName}</div>
                      )}
                    </div>
                    <Badge className="bg-red-100 text-red-800">POSITIVE</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Drug/Alcohol Test</CardTitle>
            <CardDescription>Enter test information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Type *</Label>
                  <Select
                    value={formData.testType}
                    onValueChange={(value) => setFormData({ ...formData, testType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRUG">Drug</SelectItem>
                      <SelectItem value="ALCOHOL">Alcohol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Date *</Label>
                  <Input
                    type="date"
                    value={formData.testDate}
                    onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Result *</Label>
                  <Select
                    value={formData.result}
                    onValueChange={(value) => setFormData({ ...formData, result: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEGATIVE">Negative</SelectItem>
                      <SelectItem value="POSITIVE">Positive</SelectItem>
                      <SelectItem value="REFUSED">Refused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRandom"
                      checked={formData.isRandom}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isRandom: checked as boolean })
                      }
                    />
                    <Label htmlFor="isRandom" className="font-normal cursor-pointer">
                      Random Test
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lab Information</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={formData.labName}
                    onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                    placeholder="Lab Name"
                  />
                  <Input
                    value={formData.labPhone}
                    onChange={(e) => setFormData({ ...formData, labPhone: e.target.value })}
                    placeholder="Lab Phone"
                  />
                </div>
                <Input
                  value={formData.labAddress}
                  onChange={(e) => setFormData({ ...formData, labAddress: e.target.value })}
                  placeholder="Lab Address"
                />
                <Input
                  value={formData.labReportNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, labReportNumber: e.target.value })
                  }
                  placeholder="Lab Report Number"
                />
              </div>

              <div className="space-y-2">
                <Label>Collection Site</Label>
                <Input
                  value={formData.collectionSiteName}
                  onChange={(e) =>
                    setFormData({ ...formData, collectionSiteName: e.target.value })
                  }
                  placeholder="Collection Site Name"
                />
                <Input
                  value={formData.collectionSiteAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, collectionSiteAddress: e.target.value })
                  }
                  placeholder="Collection Site Address"
                />
              </div>

              <div className="space-y-2">
                <Label>MRO Information</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={formData.mroName}
                    onChange={(e) => setFormData({ ...formData, mroName: e.target.value })}
                    placeholder="MRO Name"
                  />
                  <Input
                    value={formData.mroPhone}
                    onChange={(e) => setFormData({ ...formData, mroPhone: e.target.value })}
                    placeholder="MRO Phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Add Test'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Test History */}
      <Card>
        <CardHeader>
          <CardTitle>Test History</CardTitle>
          <CardDescription>All drug and alcohol test records</CardDescription>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No test records</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-medium">
                        {test.testType} Test - {formatDate(test.testDate)}
                      </div>
                      <Badge className={getResultColor(test.result)}>{test.result}</Badge>
                      {test.isRandom && (
                        <Badge variant="outline">Random</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {test.labName && <div>Lab: {test.labName}</div>}
                      {test.labReportNumber && (
                        <div>Report #: {test.labReportNumber}</div>
                      )}
                      {test.collectionSiteName && (
                        <div>Collection Site: {test.collectionSiteName}</div>
                      )}
                    </div>
                  </div>
                  {test.document && (
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Document
                    </Button>
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

