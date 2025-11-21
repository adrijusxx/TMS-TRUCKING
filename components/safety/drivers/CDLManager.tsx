'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Calendar, Edit } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface CDLRecord {
  id: string;
  cdlNumber: string;
  expirationDate: string;
  issueDate: string | null;
  issueState: string;
  licenseClass: string;
  endorsements: string[];
  restrictions: string[];
  document: {
    id: string;
    fileName: string;
  } | null;
}

interface CDLManagerProps {
  driverId: string;
}

async function fetchCDL(driverId: string) {
  const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/cdl`));
  if (!response.ok) throw new Error('Failed to fetch CDL record');
  return response.json() as Promise<{ cdlRecord: CDLRecord | null }>;
}

const LICENSE_CLASSES = ['A', 'B', 'C'];
const ENDORSEMENTS = ['H', 'N', 'P', 'S', 'T', 'X'];
const RESTRICTIONS = ['E', 'K', 'L', 'M', 'N', 'O', 'P', 'V', 'Z'];

export default function CDLManager({ driverId }: CDLManagerProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    cdlNumber: '',
    expirationDate: '',
    issueDate: '',
    issueState: '',
    licenseClass: '',
    endorsements: [] as string[],
    restrictions: [] as string[]
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['cdl', driverId],
    queryFn: () => fetchCDL(driverId)
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/cdl`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update CDL');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cdl', driverId] });
      setIsEditing(false);
    }
  });

  useEffect(() => {
    if (data?.cdlRecord) {
      const cdl = data.cdlRecord;
      setFormData({
        cdlNumber: cdl.cdlNumber,
        expirationDate: cdl.expirationDate.split('T')[0],
        issueDate: cdl.issueDate ? cdl.issueDate.split('T')[0] : '',
        issueState: cdl.issueState,
        licenseClass: cdl.licenseClass,
        endorsements: cdl.endorsements || [],
        restrictions: cdl.restrictions || []
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading CDL record...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading CDL record</p>
        </div>
      </div>
    );
  }

  const cdlRecord = data?.cdlRecord;

  const getExpirationStatus = () => {
    if (!cdlRecord) return null;
    const expiry = new Date(cdlRecord.expirationDate);
    const now = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return { status: 'EXPIRED', color: 'bg-red-100 text-red-800', days: daysUntil };
    } else if (daysUntil <= 30) {
      return { status: 'EXPIRING', color: 'bg-orange-100 text-orange-800', days: daysUntil };
    } else {
      return { status: 'VALID', color: 'bg-green-100 text-green-800', days: daysUntil };
    }
  };

  const expirationStatus = getExpirationStatus();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...formData,
      expirationDate: formData.expirationDate,
      issueDate: formData.issueDate || null
    });
  };

  const toggleEndorsement = (endorsement: string) => {
    setFormData({
      ...formData,
      endorsements: formData.endorsements.includes(endorsement)
        ? formData.endorsements.filter(e => e !== endorsement)
        : [...formData.endorsements, endorsement]
    });
  };

  const toggleRestriction = (restriction: string) => {
    setFormData({
      ...formData,
      restrictions: formData.restrictions.includes(restriction)
        ? formData.restrictions.filter(r => r !== restriction)
        : [...formData.restrictions, restriction]
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CDL Record</h2>
          <p className="text-muted-foreground">Commercial Driver's License information</p>
        </div>
        {cdlRecord && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit CDL
          </Button>
        )}
      </div>

      {!cdlRecord && !isEditing ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No CDL record found</p>
            <Button onClick={() => setIsEditing(true)}>Add CDL Record</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Expiration Alert */}
          {cdlRecord && expirationStatus && expirationStatus.status !== 'VALID' && (
            <Card className={expirationStatus.color}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  CDL Status Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge className={expirationStatus.color}>{expirationStatus.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Days Remaining:</span>
                    <span>{Math.abs(expirationStatus.days)} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Expiration Date:</span>
                    <span>{formatDate(cdlRecord.expirationDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CDL Form */}
          {(isEditing || !cdlRecord) && (
            <Card>
              <CardHeader>
                <CardTitle>{cdlRecord ? 'Edit CDL Record' : 'Add CDL Record'}</CardTitle>
                <CardDescription>Enter commercial driver's license information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CDL Number *</Label>
                      <Input
                        value={formData.cdlNumber}
                        onChange={(e) => setFormData({ ...formData, cdlNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issue State *</Label>
                      <Input
                        value={formData.issueState}
                        onChange={(e) => setFormData({ ...formData, issueState: e.target.value })}
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Expiration Date *</Label>
                      <Input
                        type="date"
                        value={formData.expirationDate}
                        onChange={(e) =>
                          setFormData({ ...formData, expirationDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issue Date</Label>
                      <Input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>License Class *</Label>
                    <div className="flex gap-4">
                      {LICENSE_CLASSES.map((cls) => (
                        <div key={cls} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${cls}`}
                            checked={formData.licenseClass === cls}
                            onCheckedChange={() =>
                              setFormData({ ...formData, licenseClass: cls })
                            }
                          />
                          <Label htmlFor={`class-${cls}`} className="font-normal cursor-pointer">
                            Class {cls}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Endorsements</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {ENDORSEMENTS.map((end) => (
                        <div key={end} className="flex items-center space-x-2">
                          <Checkbox
                            id={`end-${end}`}
                            checked={formData.endorsements.includes(end)}
                            onCheckedChange={() => toggleEndorsement(end)}
                          />
                          <Label htmlFor={`end-${end}`} className="font-normal cursor-pointer">
                            {end}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Restrictions</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {RESTRICTIONS.map((res) => (
                        <div key={res} className="flex items-center space-x-2">
                          <Checkbox
                            id={`res-${res}`}
                            checked={formData.restrictions.includes(res)}
                            onCheckedChange={() => toggleRestriction(res)}
                          />
                          <Label htmlFor={`res-${res}`} className="font-normal cursor-pointer">
                            {res}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    {cdlRecord && (
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : cdlRecord ? 'Update CDL' : 'Add CDL'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* CDL Display */}
          {cdlRecord && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>CDL Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">CDL Number</div>
                    <div className="font-medium">{cdlRecord.cdlNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Issue State</div>
                    <div className="font-medium">{cdlRecord.issueState}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">License Class</div>
                    <div className="font-medium">Class {cdlRecord.licenseClass}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expiration Date</div>
                    <div className="font-medium">{formatDate(cdlRecord.expirationDate)}</div>
                  </div>
                  {cdlRecord.issueDate && (
                    <div>
                      <div className="text-sm text-muted-foreground">Issue Date</div>
                      <div className="font-medium">{formatDate(cdlRecord.issueDate)}</div>
                    </div>
                  )}
                </div>

                {cdlRecord.endorsements.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Endorsements</div>
                    <div className="flex gap-2">
                      {cdlRecord.endorsements.map((end) => (
                        <Badge key={end} variant="outline">
                          {end}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {cdlRecord.restrictions.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Restrictions</div>
                    <div className="flex gap-2">
                      {cdlRecord.restrictions.map((res) => (
                        <Badge key={res} variant="outline" className="text-orange-600">
                          {res}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {cdlRecord.document && (
                  <div>
                    <Button variant="outline" size="sm">
                      View CDL Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

