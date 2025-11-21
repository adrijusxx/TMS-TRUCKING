'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Calendar, Plus, Upload } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface MedicalCard {
  id: string;
  cardNumber: string;
  expirationDate: string;
  issueDate: string | null;
  medicalExaminerName: string | null;
  document: {
    id: string;
    fileName: string;
  } | null;
}

interface MedicalCardManagerProps {
  driverId: string;
}

async function fetchMedicalCards(driverId: string) {
  const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/medical-cards`));
  if (!response.ok) throw new Error('Failed to fetch medical cards');
  return response.json() as Promise<{ medicalCards: MedicalCard[] }>;
}

export default function MedicalCardManager({ driverId }: MedicalCardManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expirationDate: '',
    issueDate: '',
    medicalExaminerName: '',
    medicalExaminerCertificateNumber: ''
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['medical-cards', driverId],
    queryFn: () => fetchMedicalCards(driverId)
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/medical-cards`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create medical card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-cards', driverId] });
      setShowForm(false);
      setFormData({
        cardNumber: '',
        expirationDate: '',
        issueDate: '',
        medicalExaminerName: '',
        medicalExaminerCertificateNumber: ''
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading medical cards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading medical cards</p>
        </div>
      </div>
    );
  }

  const medicalCards = data?.medicalCards || [];
  const activeCard = medicalCards.find(
    card => new Date(card.expirationDate) > new Date()
  );
  const expiringCards = medicalCards.filter(card => {
    const expiry = new Date(card.expirationDate);
    const daysUntil = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  });

  const getExpirationStatus = (expirationDate: string) => {
    const expiry = new Date(expirationDate);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      expirationDate: formData.expirationDate,
      issueDate: formData.issueDate || null
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medical Cards</h2>
          <p className="text-muted-foreground">Manage driver medical examiner certificates</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medical Card
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Medical Card</CardTitle>
            <CardDescription>Enter medical examiner certificate information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Card Number *</Label>
                  <Input
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiration Date *</Label>
                  <Input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Medical Examiner Name</Label>
                  <Input
                    value={formData.medicalExaminerName}
                    onChange={(e) =>
                      setFormData({ ...formData, medicalExaminerName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Add Medical Card'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Card Alert */}
      {activeCard && (
        <Card className={getExpirationStatus(activeCard.expirationDate).color}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Current Medical Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Card Number:</span>
                <span>{activeCard.cardNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Expiration Date:</span>
                <span>{formatDate(activeCard.expirationDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge className={getExpirationStatus(activeCard.expirationDate).color}>
                  {getExpirationStatus(activeCard.expirationDate).status} (
                  {getExpirationStatus(activeCard.expirationDate).days} days)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Cards Alert */}
      {expiringCards.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Expiring Medical Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringCards.map((card) => {
                const status = getExpirationStatus(card.expirationDate);
                return (
                  <div key={card.id} className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Card {card.cardNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          Expires: {formatDate(card.expirationDate)}
                        </div>
                      </div>
                      <Badge className={status.color}>
                        {status.days} days remaining
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Medical Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Card History</CardTitle>
          <CardDescription>All medical examiner certificates</CardDescription>
        </CardHeader>
        <CardContent>
          {medicalCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No medical cards on record</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medicalCards.map((card) => {
                const status = getExpirationStatus(card.expirationDate);
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-medium">Card {card.cardNumber}</div>
                        <Badge className={status.color}>{status.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Expiration: {formatDate(card.expirationDate)}</div>
                        {card.issueDate && <div>Issue Date: {formatDate(card.issueDate)}</div>}
                        {card.medicalExaminerName && (
                          <div>Examiner: {card.medicalExaminerName}</div>
                        )}
                      </div>
                    </div>
                    {card.document && (
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

