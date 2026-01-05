'use client';

import WorkFlowGuide, { WorkflowStep } from '@/components/shared/WorkFlowGuide';
import { Tag } from 'lucide-react';

export default function ExpensesWorkflowInfo() {
    const steps: WorkflowStep[] = [
        {
            label: 'Record Expense',
            description: 'Capture cost immediately.',
            details: [
                'Click "New Expense".',
                'Enter Amount, Vendor, and Date.',
                'Scan/Upload Receipt image.',
                'Select Payment Method (Credit Card, Cash).'
            ]
        },
        {
            label: 'Categorize',
            description: 'Crucial for Taxes.',
            details: [
                'Select Expense Category (e.g., "Fuel", "Repairs").',
                'These map to Tax Lines (Schedule C/1120S).',
                'Separate "Personal" vs "Business" if applicable.',
            ]
        },
        {
            label: 'Allocate',
            description: 'Track Profitability.',
            details: [
                'Tag a <strong>Truck</strong> (Cost Per Mile).',
                'Tag a <strong>Load</strong> (Job Profitability).',
                'Tag a <strong>Driver</strong> (if reimbursable).',
                'Untagged expenses count as "General Overhead".'
            ]
        },
        {
            label: 'Analytics',
            description: 'Review performance.',
            details: [
                'Check Net Profit Dashboard.',
                'View Cost Per Mile KPI.',
                'Identify high-maintenance trucks.',
                'Export for Accountant at year-end.'
            ]
        }
    ];

    return (
        <WorkFlowGuide
            title="Expense Tracking Guide"
            description="Proper categorization and allocation for accurate Net Profit."
            steps={steps}
            colorScheme="green"
            icon={Tag}
        />
    );
}
