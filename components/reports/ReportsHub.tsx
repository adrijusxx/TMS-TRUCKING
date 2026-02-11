'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    FileText,
    DollarSign,
    TrendingUp,
    BarChart3,
    Receipt,
    CreditCard,
    Calculator,
    Building2,
    ShieldAlert,
    Truck,
    Users,
    AlertTriangle,
    ClipboardCheck,
    Search,
    Calendar,
    Download,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';


// Types for our report definitions
interface ReportDef {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    category: 'financial' | 'operations' | 'safety' | 'hr';
    popular?: boolean;
    new?: boolean;
}

const reports: ReportDef[] = [
    // Financial
    {
        id: 'invoices',
        title: 'Invoice Reports',
        description: 'Payment tracking, aging, and customer statements.',
        icon: FileText,
        href: '/dashboard/invoices/reports',
        category: 'financial',
        popular: true
    },
    {
        id: 'settlements',
        title: 'Driver Settlements',
        description: 'Detailed breakdown of driver pay and deductions.',
        icon: DollarSign,
        href: '/dashboard/settlements',
        category: 'financial',
        popular: true
    },
    {
        id: 'profit',
        title: 'Net Profit Analysis',
        description: 'Profitability by load, customer, and time period.',
        icon: TrendingUp,
        href: '/dashboard/accounting/net-profit',
        category: 'financial'
    },
    {
        id: 'ifta',
        title: 'IFTA Reports',
        description: 'Quarterly fuel tax reporting and mileage data.',
        icon: Receipt,
        href: '/dashboard/accounting/ifta',
        category: 'financial'
    },
    {
        id: 'expenses',
        title: 'Expense Tracking',
        description: 'Operational expenses categorized by truck or division.',
        icon: CreditCard,
        href: '/dashboard/accounting/expenses',
        category: 'financial'
    },
    {
        id: 'factoring',
        title: 'Factoring Status',
        description: 'Track funded invoices and reserve accounts.',
        icon: Building2,
        href: '/dashboard/accounting/factoring',
        category: 'financial'
    },
    {
        id: 'reconciliation',
        title: 'Settlement Reconciliation',
        description: 'Audit report comparing Invoiced Revenue vs Driver Pay.',
        icon: Calculator,
        href: '/dashboard/reports/settlement-reconciliation',
        category: 'financial',
        new: true
    },

    // Safety
    {
        id: 'inspections',
        title: 'Inspection History',
        description: 'DOT and roadside inspection records and violations.',
        icon: ClipboardCheck,
        href: '/dashboard/safety/roadside-inspections',
        category: 'safety',
        popular: true
    },
    {
        id: 'accidents',
        title: 'Accident Register',
        description: 'Log of accidents, claims, and incident reports.',
        icon: AlertTriangle,
        href: '/dashboard/safety/incidents',
        category: 'safety'
    },
    {
        id: 'compliance',
        title: 'Compliance Status',
        description: 'Driver and equipment compliance overview.',
        icon: ShieldAlert,
        href: '/dashboard/safety/compliance',
        category: 'safety'
    },

    // Operations
    {
        id: 'utilization',
        title: 'Truck Utilization',
        description: 'Miles per truck, downtime, and revenue per mile.',
        icon: Truck,
        href: '/dashboard/analytics',
        category: 'operations',
        popular: true
    },
    {
        id: 'customers',
        title: 'Customer Analytics',
        description: 'Volume and revenue by customer lane.',
        icon: BarChart3,
        href: '/dashboard/customers', // Assuming this route exists or similar
        category: 'operations'
    },

    // HR
    {
        id: 'retention',
        title: 'Driver Retention',
        description: 'Turnover rates and tenure analysis.',
        icon: Users,
        href: '/dashboard/hr?tab=retention',
        category: 'hr'
    },
    {
        id: 'performance',
        title: 'Driver Performance',
        description: 'Scorecards based on safety, on-time, and revenue.',
        icon: BarChart3,
        href: '/dashboard/hr?tab=performance',
        category: 'hr',
        new: true
    }
];

interface ReportsHubProps {
    defaultTab?: string;
}

export function ReportsHub({ defaultTab = 'all' }: ReportsHubProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(defaultTab);

    const filteredReports = reports.filter(report => {
        const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || report.category === activeTab;
        return matchesSearch && matchesTab;
    });

    const categories = [
        { id: 'all', label: 'All Reports' },
        { id: 'financial', label: 'Financial' },
        { id: 'operations', label: 'Operations' },
        { id: 'safety', label: 'Safety' },
        { id: 'hr', label: 'HR' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search reports..."
                        className="pl-9 bg-card/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/reports/constructor">
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Custom Builder
                        </Button>
                    </Link>
                    <Link href="/dashboard/reports/templates">
                        <Button className="gap-2">
                            <FileText className="h-4 w-4" />
                            Manage Templates
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-card/50 p-1 border">
                    {categories.map(cat => (
                        <TabsTrigger key={cat.id} value={cat.id} className="px-4">
                            {cat.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeTab} className="space-y-6">

                    {/* Quick Stats or Highlights could go here */}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReports.map((report) => (
                            <Link href={report.href} key={report.id}>
                                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 group cursor-pointer overflow-hidden border-muted/60">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className={cn(
                                                "p-2.5 rounded-lg transition-colors group-hover:text-white",
                                                report.category === 'financial' && "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600",
                                                report.category === 'safety' && "bg-orange-100 text-orange-700 group-hover:bg-orange-600",
                                                report.category === 'operations' && "bg-blue-100 text-blue-700 group-hover:bg-blue-600",
                                                report.category === 'hr' && "bg-purple-100 text-purple-700 group-hover:bg-purple-600",
                                            )}>
                                                <report.icon className="h-6 w-6" />
                                            </div>
                                            {report.popular && (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Popular</Badge>
                                            )}
                                            {report.new && (
                                                <Badge className="bg-blue-600 text-white hover:bg-blue-700">New</Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg mt-4 group-hover:text-primary transition-colors">
                                            {report.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {report.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="pt-0 text-xs text-muted-foreground flex gap-2 items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                        <span>Click to view report</span>
                                        <ArrowRightIcon className="h-3 w-3 -ml-1 group-hover:translate-x-1 transition-transform" />
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {filteredReports.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            <div className="inline-flex items-center justify-center p-4 bg-muted/50 rounded-full mb-4">
                                <Search className="h-8 w-8 opacity-50" />
                            </div>
                            <p className="text-lg font-medium">No reports found</p>
                            <p className="text-sm">Try adjusting your search or category filter.</p>
                        </div>
                    )}

                </TabsContent>
            </Tabs>
        </div>
    );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
