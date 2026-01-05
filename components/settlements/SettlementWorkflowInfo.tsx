'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, DollarSign, Calculator, FileText, FileCheck, Building2, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettlementWorkflowInfoProps {
    defaultOpen?: boolean;
}

export default function SettlementWorkflowInfo({ defaultOpen = false }: SettlementWorkflowInfoProps) {
    return (
        <Card className="border-l-4 border-l-blue-500 shadow-sm mb-6">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-blue-600">
                    <BookOpen className="h-5 w-5" />
                    <CardTitle className="text-lg">Accounting & Settlement Workflow Guide</CardTitle>
                </div>
                <CardDescription>
                    A comprehensive guide to how Driver Settlements and Accounting flows work in the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible defaultValue={defaultOpen ? 'guide' : undefined}>
                    <AccordionItem value="guide" className="border-none">
                        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline hover:text-blue-600">
                            {defaultOpen ? 'Hide Workflow Details' : 'Show Workflow Details'}
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-6">

                            {/* Section 1: User-Centric Settlement Workflow */}
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                    1. Driver Settlements: The 4-Step Process
                                </h3>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <div className="font-semibold text-sm flex items-center gap-2">
                                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                                            Setup Phase
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Before starting, configure the <strong>Driver Profile &rarr; Financials</strong> tab.
                                        </p>
                                        <ul className="text-xs space-y-1 list-disc pl-3 text-muted-foreground">
                                            <li>Set Pay Type (Per Mile, %, etc.)</li>
                                            <li>Add Recurring Deductions (Insurance)</li>
                                            <li>Set Escrow Targets (e.g., $1,000 bond)</li>
                                        </ul>
                                    </div>

                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <div className="font-semibold text-sm flex items-center gap-2">
                                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                                            The Feed
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Loads automatically appear in the settlement queue when:
                                        </p>
                                        <ul className="text-xs space-y-1 list-disc pl-3 text-muted-foreground">
                                            <li>Status is <strong>DELIVERED</strong></li>
                                            <li>Miles are entered (for per-mile pay)</li>
                                            <li>Revenue is entered (for % pay)</li>
                                            <li><strong>Tip:</strong> You can override driver pay on the Load page directly.</li>
                                        </ul>
                                    </div>

                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <div className="font-semibold text-sm flex items-center gap-2">
                                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                                            Generation
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Click <strong>Generate Settlement</strong> and select a driver.
                                        </p>
                                        <ul className="text-xs space-y-1 list-disc pl-3 text-muted-foreground">
                                            <li>Select the delivered loads to pay.</li>
                                            <li>System auto-calculates Gross Pay.</li>
                                            <li>Deductions (Recurring & Escrow) are auto-applied.</li>
                                            <li>Review Net Pay and Create.</li>
                                        </ul>
                                    </div>

                                    <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <div className="font-semibold text-sm flex items-center gap-2">
                                            <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs">4</span>
                                            Post-Processing
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            After generation:
                                        </p>
                                        <ul className="text-xs space-y-1 list-disc pl-3 text-muted-foreground">
                                            <li>Driver's Escrow Balance updates automatically.</li>
                                            <li>If Balance is negative, a "Negative Balance" record is created for next week.</li>
                                            <li>Settlement statement is ready for PDF export.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: General Accounting Overview */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                                    <Calculator className="h-4 w-4 text-blue-600" />
                                    2. General Accounting Logic
                                </h3>

                                <div className="grid gap-6 md:grid-cols-3">
                                    {/* Invoicing Cycle */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium flex items-center gap-2 text-primary">
                                            <FileText className="h-4 w-4" />
                                            Invoicing Cycle
                                        </h4>
                                        <div className="text-xs text-muted-foreground space-y-2">
                                            <p>
                                                <strong>Load Delivery:</strong> Once a load is delivered, it moves to the "Ready to Bill" queue (unless there is a Billing Hold).
                                            </p>
                                            <p>
                                                <strong>Exceptions:</strong> If documents (POD) are missing, the load is held in the <strong>Exceptions Queue</strong>. Check this daily.
                                            </p>
                                            <p>
                                                <strong>Invoice Creation:</strong> Invoices are generated from loads. You can group multiple loads into one Invoice if needed.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Factoring Flow */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium flex items-center gap-2 text-primary">
                                            <Building2 className="h-4 w-4" />
                                            Factoring Flow
                                        </h4>
                                        <div className="text-xs text-muted-foreground space-y-2">
                                            <p>
                                                <strong>Batching:</strong> Don't send invoices one by one. Group them into a <strong>Factoring Batch</strong>.
                                            </p>
                                            <p>
                                                <strong>Submission:</strong> Mark the batch as "Sent to Factor". This updates all included invoices to "Factored" status.
                                            </p>
                                            <p>
                                                <strong>Payment:</strong> When the factor pays, record the payment against the Batch to close out all linked invoices at once.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Profit & Expenses */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium flex items-center gap-2 text-primary">
                                            <Wallet className="h-4 w-4" />
                                            Net Profit Logic
                                        </h4>
                                        <div className="text-xs text-muted-foreground space-y-2">
                                            <p>
                                                <strong>True Profit =</strong> Load Revenue - (Driver Pay + Fuel Expenses + Tolls + Maintenance).
                                            </p>
                                            <p>
                                                <strong>Expense Tagging:</strong> Always tag expenses to a specific Load or Truck to ensure accurate Profit Per Mile reports.
                                            </p>
                                            <p>
                                                <strong>Report:</strong> Check the "Net Profit" dashboard for real-time profitability per McNumber.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
