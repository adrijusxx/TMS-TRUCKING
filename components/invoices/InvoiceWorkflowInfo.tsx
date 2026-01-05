'use client';

import WorkFlowGuide, { WorkflowStep } from '@/components/shared/WorkFlowGuide';
import { FileText } from 'lucide-react';

export default function InvoiceWorkflowInfo() {
    const steps: WorkflowStep[] = [
        {
            label: 'Delivery & Audit',
            description: 'The process starts when a load is delivered.',
            details: [
                'Load Status becomes "DELIVERED".',
                'Check "Exceptions Queue" designed for missing PODs.',
                'Upload confirmed POD to release Billing Hold.',
                'Load moves to "Ready to Bill".'
            ]
        },
        {
            label: 'Draft Invoice',
            description: 'Create the financial record.',
            details: [
                'Select one or multiple loads.',
                'Click "Create Invoice".',
                'System pulls Load Rate + Accessorials.',
                'Verify "Bill To" address is correct.'
            ]
        },
        {
            label: 'Send to Customer',
            description: 'Distribute the invoice.',
            details: [
                'Review the generated PDF.',
                'Click "Send Email" to dispatch to customer.',
                'Or "Send to Factoring" for batched payments.',
                'Status updates to "SENT".'
            ]
        },
        {
            label: 'Payment',
            description: 'Close the loop.',
            details: [
                'Mark as "PAID" when money hits bank.',
                'Or wait for Factoring Batch payment.',
                'Reconcile with bank statement.',
                'Archive.'
            ]
        }
    ];

    return (
        <WorkFlowGuide
            title="Invoicing Workflow Guide"
            description="From delivery to payment: How to manage the billing cycle."
            steps={steps}
            colorScheme="blue"
            icon={FileText}
        />
    );
}
