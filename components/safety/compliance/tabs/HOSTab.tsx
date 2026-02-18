'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { DriverComplianceData } from '@/types/compliance';
import { getStatusBadgeColor } from '@/lib/utils/compliance-status';

interface HOSTabProps {
  driver: DriverComplianceData;
}

export default function HOSTab({ driver }: HOSTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hours of Service</CardTitle>
        <CardDescription>HOS compliance and violations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">Compliance Percentage</div>
              <div className="text-2xl font-bold">{driver.hos.compliancePercentage}%</div>
            </div>
            <Badge className={getStatusBadgeColor(driver.statusSummary.hos.status)}>
              {driver.statusSummary.hos.status}
            </Badge>
          </div>
          {driver.hos.violations.length > 0 && (
            <div>
              <div className="font-medium mb-2">Recent Violations</div>
              <div className="space-y-2">
                {driver.hos.violations.map((violation) => (
                  <div key={violation.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{violation.violationType}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(violation.violationDate)}
                          {violation.hoursExceeded && ` - ${violation.hoursExceeded} hours exceeded`}
                        </div>
                        {violation.violationDescription && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {violation.violationDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {driver.hos.violations.length === 0 && (
            <p className="text-sm text-muted-foreground">No HOS violations on record.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
