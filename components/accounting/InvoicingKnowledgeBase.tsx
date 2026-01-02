'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, AlertTriangle, CheckCircle, Clock, FileText, DollarSign } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

const statusInfo = [
    { status: 'DELIVERED', color: 'bg-emerald-100 text-emerald-800', description: 'Delivered (pending docs)' },
    { status: 'BILLING_HOLD', color: 'bg-amber-100 text-amber-800', description: 'Blocked from invoicing' },
    { status: 'READY_TO_BILL', color: 'bg-lime-100 text-lime-800', description: 'Ready for invoice' },
    { status: 'INVOICED', color: 'bg-emerald-100 text-emerald-800', description: 'Invoice created' },
    { status: 'PAID', color: 'bg-teal-100 text-teal-800', description: 'Payment received' },
];

export function InvoicingKnowledgeBase() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Invoicing Quick Reference</CardTitle>
                </div>
                <CardDescription>Key workflow tips for accounting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Accordion type="single" collapsible className="w-full">
                    {/* When can a load be invoiced */}
                    <AccordionItem value="requirements">
                        <AccordionTrigger className="text-sm py-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Ready to Bill Requirements
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm space-y-2 pt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span>Status = DELIVERED</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-blue-600" />
                                    <span>POD Uploaded</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-blue-600" />
                                    <span>Rate Con on File</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span>No Billing Hold</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Billing Hold */}
                    <AccordionItem value="billing-hold">
                        <AccordionTrigger className="text-sm py-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                Resolving Billing Holds
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm space-y-2 pt-2">
                            <p className="text-muted-foreground">Common causes:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Missing POD or Rate Confirmation</li>
                                <li>Rate discrepancy between booking and Rate Con</li>
                                <li>Customer dispute pending</li>
                            </ul>
                            <p className="mt-2">
                                <strong>Fix:</strong> Upload missing docs → Clear hold reason → Save
                            </p>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Daily Tasks */}
                    <AccordionItem value="daily-tasks">
                        <AccordionTrigger className="text-sm py-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                Daily Accounting Tasks
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm space-y-2 pt-2">
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                <li>Filter loads by DELIVERED status &gt; 24hrs old</li>
                                <li>Follow up on missing PODs</li>
                                <li>Process READY_TO_BILL loads → Create invoices</li>
                                <li>Check detention fees in Financial tab before invoicing</li>
                                <li>Verify QuickBooks sync status</li>
                            </ol>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Status Colors */}
                    <AccordionItem value="status-colors">
                        <AccordionTrigger className="text-sm py-2">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                Status Quick Reference
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                            <div className="flex flex-wrap gap-2">
                                {statusInfo.map((item) => (
                                    <Badge key={item.status} variant="outline" className={item.color}>
                                        {item.status.replace(/_/g, ' ')}
                                    </Badge>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
