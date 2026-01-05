'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
    label: string;
    description: string;
    details: string[];
}

interface WorkFlowGuideProps {
    title: string;
    description: string;
    steps: WorkflowStep[];
    colorScheme?: 'blue' | 'green' | 'purple' | 'orange';
    icon?: LucideIcon;
    defaultOpen?: boolean;
}

const colorMap = {
    blue: { border: 'border-l-blue-500', text: 'text-blue-600', badge: 'bg-blue-600' },
    green: { border: 'border-l-green-500', text: 'text-green-600', badge: 'bg-green-600' },
    purple: { border: 'border-l-purple-500', text: 'text-purple-600', badge: 'bg-purple-600' },
    orange: { border: 'border-l-orange-500', text: 'text-orange-600', badge: 'bg-orange-600' },
};

export default function WorkFlowGuide({
    title,
    description,
    steps,
    colorScheme = 'blue',
    icon: Icon = BookOpen,
    defaultOpen = false
}: WorkFlowGuideProps) {
    const colors = colorMap[colorScheme];

    return (
        <Card className={cn("shadow-sm mb-6 border-l-4", colors.border)}>
            <CardHeader className="pb-2">
                <div className={cn("flex items-center gap-2", colors.text)}>
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-lg">{title}</CardTitle>
                </div>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible defaultValue={defaultOpen ? 'guide' : undefined}>
                    <AccordionItem value="guide" className="border-none">
                        <AccordionTrigger className={cn("py-2 text-sm font-medium hover:no-underline", colors.text)}>
                            {defaultOpen ? 'Hide Workflow Details' : 'Show Workflow Details'}
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {steps.map((step, index) => (
                                    <div key={index} className="bg-muted p-4 rounded-lg space-y-2">
                                        <div className="font-semibold text-sm flex items-center gap-2">
                                            <span className={cn("text-white w-5 h-5 rounded-full flex items-center justify-center text-xs", colors.badge)}>
                                                {index + 1}
                                            </span>
                                            {step.label}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {step.description}
                                        </p>
                                        <ul className="text-xs space-y-1 list-disc pl-3 text-muted-foreground">
                                            {step.details.map((detail, i) => (
                                                <li key={i}>{detail}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
