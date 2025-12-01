'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp,
  Wrench
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, apiUrl } from '@/lib/utils';

interface Breakdown {
  id: string;
  breakdownNumber: string;
  status: string;
  reportedAt: string;
  location: string;
  description: string;
}

async function fetchBreakdowns(): Promise<Breakdown[]> {
  const response = await fetch(apiUrl('/api/mobile/breakdowns'));
  if (!response.ok) throw new Error('Failed to fetch breakdowns');
  const result = await response.json();
  // API returns { success: true, data: { breakdowns: [...] } }
  return result.data?.breakdowns || result.data || [];
}

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </CardHeader>
      {isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
}

export default function DriverSupportPage() {
  const [reportIssueOpen, setReportIssueOpen] = useState<{
    [key: string]: boolean;
  }>({});

  const { data: breakdowns, isLoading } = useQuery({
    queryKey: ['driver-breakdowns'],
    queryFn: fetchBreakdowns,
  });

  const openBreakdowns = breakdowns?.filter(
    (b) => ['REPORTED', 'DISPATCHED', 'IN_PROGRESS'].includes(b.status)
  ) || [];

  const handleReportIssue = (department: string) => {
    setReportIssueOpen((prev) => ({
      ...prev,
      [department]: !prev[department],
    }));
  };

  const handleSubmitIssue = async (department: string, message: string) => {
    // TODO: Implement issue reporting API
    console.log(`Report issue to ${department}:`, message);
    setReportIssueOpen((prev) => ({
      ...prev,
      [department]: false,
    }));
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Support & Breakdowns</h1>

      {/* Breakdowns Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Breakdowns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/mobile/driver/breakdowns">
            <Button
              variant="destructive"
              className="w-full h-12 text-base font-semibold"
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              REPORT BREAKDOWN
            </Button>
          </Link>

          <a href="tel:+18005551234">
            <Button variant="outline" className="w-full">
              <Phone className="h-4 w-4 mr-2" />
              Call Maintenance
            </Button>
          </a>

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading breakdown cases...
            </div>
          ) : openBreakdowns.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Open Breakdown Cases:</p>
              {openBreakdowns.map((breakdown) => (
                <Link
                  key={breakdown.id}
                  href={`/mobile/driver/breakdowns/${breakdown.id}`}
                >
                  <Card className="hover:bg-muted transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            Case #{breakdown.breakdownNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {breakdown.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(breakdown.reportedAt)}
                          </p>
                        </div>
                        <Badge variant="outline">{breakdown.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No open breakdown cases
            </p>
          )}
        </CardContent>
      </Card>

      {/* Department Contacts */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Department Contacts</h2>

        <AccordionSection title="Safety">
          <div className="space-y-3">
            <a href="tel:+18005551234">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </a>
            <a href="mailto:safety@company.com">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </a>
            {reportIssueOpen.safety ? (
              <div className="space-y-2">
                <textarea
                  id="safety-issue"
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="Describe your safety concern..."
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const textarea = document.getElementById('safety-issue') as HTMLTextAreaElement;
                      if (textarea?.value) {
                        handleSubmitIssue('safety', textarea.value);
                      }
                    }}
                  >
                    Submit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReportIssue('safety')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleReportIssue('safety')}
              >
                Report Issue
              </Button>
            )}
          </div>
        </AccordionSection>

        <AccordionSection title="HR">
          <div className="space-y-3">
            <a href="tel:+18005551235">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </a>
            <a href="mailto:hr@company.com">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </a>
            {reportIssueOpen.hr ? (
              <div className="space-y-2">
                <textarea
                  id="hr-issue"
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="Describe your HR concern..."
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const textarea = document.getElementById('hr-issue') as HTMLTextAreaElement;
                      if (textarea?.value) {
                        handleSubmitIssue('hr', textarea.value);
                      }
                    }}
                  >
                    Submit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReportIssue('hr')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleReportIssue('hr')}
              >
                Report Issue
              </Button>
            )}
          </div>
        </AccordionSection>

        <AccordionSection title="Accounting">
          <div className="space-y-3">
            <a href="tel:+18005551236">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </a>
            <a href="mailto:accounting@company.com">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </a>
            {reportIssueOpen.accounting ? (
              <div className="space-y-2">
                <textarea
                  id="accounting-issue"
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="Describe your accounting concern..."
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const textarea = document.getElementById('accounting-issue') as HTMLTextAreaElement;
                      if (textarea?.value) {
                        handleSubmitIssue('accounting', textarea.value);
                      }
                    }}
                  >
                    Submit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReportIssue('accounting')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleReportIssue('accounting')}
              >
                Report Issue
              </Button>
            )}
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}

