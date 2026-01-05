'use client';

import WorkFlowGuide, { WorkflowStep } from '@/components/shared/WorkFlowGuide';
import { Building2 } from 'lucide-react';

export default function FactoringWorkflowInfo() {
    const steps: WorkflowStep[] = [
        {
            label: 'Prepare Batch',
            description: 'Group invoices for your factor.',
            details: [
                'Go to "Batches" or Factor Dashboard.',
                'Select "Ready to Factor" invoices.',
                'Create a new Batch (e.g., "Batch #105").',
                'Print "Schedule of Accounts" if needed.'
            ]
        },
        {
            label: 'Submit',
            description: 'Send to Factoring Company.',
            details: [
                'Upload Batch docs to Factor portal (Apex/RTS).',
                'In TMS, mark Batch as "Sent to Factor".',
                'All invoices update to "FACTORED".',
                'AR is now owned by the Factor.'
            ]
        },
        {
            label: 'Receive Funds',
            description: 'Get paid by Factor.',
            details: [
                'Factor sends wire/ACH.',
                'Record "Batch Payment" in TMS.',
                'Enter total amount received.',
                'System auto-calculates Factoring Fee deduction.'
            ]
        },
        {
            label: 'Reconciliation',
            description: 'Handle disputes/shortlays.',
            details: [
                'If Factor rejects an invoice, "Chargeback".',
                'If customer short-pays, add "Chargeback" entry.',
                'Reconcile Reserve Account monthly.',
            ]
        }
    ];

    return (
        <WorkFlowGuide
            title="Factoring Workflow Guide"
            description="How to manage batches, submissions, and factoring payments."
            steps={steps}
            colorScheme="purple"
            icon={Building2}
        />
    );
}
