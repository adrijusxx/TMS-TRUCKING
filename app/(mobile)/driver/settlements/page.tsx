'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';
import { SettlementStatus } from '@prisma/client';

interface Settlement {
  id: string;
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  netPay: number;
  status: SettlementStatus;
  createdAt: string;
}

interface WeeklyEarning {
  date: string;
  amount: number;
}

interface SettlementsData {
  settlements: Settlement[];
  weeklyEarnings: WeeklyEarning[];
}

async function fetchSettlements(): Promise<SettlementsData> {
  const response = await fetch(apiUrl('/api/mobile/driver/settlements'));
  if (!response.ok) throw new Error('Failed to fetch settlements');
  const result = await response.json();
  return result.data;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  DISPUTED: 'bg-red-100 text-red-800',
};

function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function SimpleBarChart({ data }: { data: WeeklyEarning[] }) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const percentage = (item.amount / maxAmount) * 100;
        return (
          <div key={index} className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground w-16">
              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div
                className="bg-primary h-6 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${percentage}%` }}
              >
                <span className="text-xs font-semibold text-primary-foreground">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettlementCard({ settlement }: { settlement: Settlement }) {
  const handleDownload = async () => {
    // TODO: Implement PDF download
    console.log('Download settlement:', settlement.id);
    // For now, just show an alert
    alert('PDF download functionality will be implemented soon');
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold">Settlement #{settlement.settlementNumber}</p>
            <p className="text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 inline mr-1" />
              {formatDate(settlement.periodStart)} - {formatDate(settlement.periodEnd)}
            </p>
          </div>
          <Badge className={statusColors[settlement.status] || 'bg-gray-100 text-gray-800'}>
            {formatStatus(settlement.status)}
          </Badge>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gross Pay:</span>
            <span className="font-medium">{formatCurrency(settlement.grossPay)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Net Pay:</span>
            <span className="font-semibold text-lg text-green-600">
              {formatCurrency(settlement.netPay)}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DriverSettlementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-settlements'],
    queryFn: fetchSettlements,
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Settlements</h1>

      {/* Earnings Graph */}
      {data?.weeklyEarnings && data.weeklyEarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Earnings (Last 4 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={data.weeklyEarnings} />
          </CardContent>
        </Card>
      )}

      {/* Settlements List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Statements</h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading settlements...
          </div>
        ) : !data?.settlements || data.settlements.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No settlements found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.settlements.map((settlement) => (
              <SettlementCard key={settlement.id} settlement={settlement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}





























