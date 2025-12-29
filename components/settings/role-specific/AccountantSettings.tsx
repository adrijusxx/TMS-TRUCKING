'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DollarSign, FileText, Calculator } from 'lucide-react';

export default function AccountantSettings() {
  const [autoGenerateInvoices, setAutoGenerateInvoices] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [showFinancialReports, setShowFinancialReports] = useState(true);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Accounting Preferences</CardTitle>
          </div>
          <CardDescription>
            Configure your accounting workflow preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Generate Invoices</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate invoices for completed loads
              </p>
            </div>
            <Switch
              checked={autoGenerateInvoices}
              onCheckedChange={setAutoGenerateInvoices}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Approval</Label>
              <p className="text-sm text-muted-foreground">
                Require approval before processing settlements
              </p>
            </div>
            <Switch
              checked={requireApproval}
              onCheckedChange={setRequireApproval}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Financial Reports</Label>
              <p className="text-sm text-muted-foreground">
                Display financial reports dashboard
              </p>
            </div>
            <Switch
              checked={showFinancialReports}
              onCheckedChange={setShowFinancialReports}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





