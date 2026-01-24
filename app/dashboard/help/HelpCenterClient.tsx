'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Search,
    BookOpen,
    TruckIcon,
    FileText,
    DollarSign,
    Users,
    AlertCircle,
    CheckCircle,
    Video,
    FileQuestion,
    MessageCircle,
    ExternalLink,
    ChevronRight,
} from 'lucide-react';

export function HelpCenterClient() {
    const [searchQuery, setSearchQuery] = useState('');

    const quickLinks = [
        {
            title: 'Creating Your First Load',
            description: 'Step-by-step guide to creating and managing loads',
            icon: TruckIcon,
            module: 'loads',
            topic: 'create-load',
            badge: 'Getting Started',
        },
        {
            title: 'Generating Settlements',
            description: 'Learn how to generate driver settlements',
            icon: DollarSign,
            module: 'settlements',
            topic: 'generate-settlement',
            badge: 'Popular',
        },
        {
            title: 'Invoice Creation',
            description: 'Create and manage customer invoices',
            icon: FileText,
            module: 'invoices',
            topic: 'create-invoice',
            badge: 'Essential',
        },
        {
            title: 'Settlement Troubleshooting',
            description: 'Fix common settlement generation errors',
            icon: AlertCircle,
            module: 'settlements',
            topic: 'settlement-troubleshooting',
            badge: 'Troubleshooting',
        },
    ];

    const modules = [
        {
            id: 'loads',
            title: 'Load Management',
            description: 'Create, dispatch, and track loads',
            icon: TruckIcon,
            color: 'bg-blue-500',
            articles: 3,
        },
        {
            id: 'invoices',
            title: 'Invoicing',
            description: 'Generate and manage customer invoices',
            icon: FileText,
            color: 'bg-green-500',
            articles: 2,
        },
        {
            id: 'settlements',
            title: 'Settlements',
            description: 'Process driver payments and settlements',
            icon: DollarSign,
            color: 'bg-purple-500',
            articles: 4,
        },
        {
            id: 'drivers',
            title: 'Driver Management',
            description: 'Manage driver profiles and assignments',
            icon: Users,
            color: 'bg-orange-500',
            articles: 1,
        },
        {
            id: 'batches',
            title: 'Batch Processing',
            description: 'Bulk invoice and settlement operations',
            icon: BookOpen,
            color: 'bg-indigo-500',
            articles: 1,
        },
    ];

    const commonErrors = [
        {
            error: '"No loads found for settlement period"',
            solution: 'Check load status, POD upload, and ready for settlement flag',
            module: 'settlements',
            topic: 'settlement-troubleshooting',
        },
        {
            error: '"Customer is required"',
            solution: 'Select a customer from the dropdown when creating a load',
            module: 'loads',
            topic: 'create-load',
        },
        {
            error: '"Load already invoiced"',
            solution: 'Remove load from existing invoice before adding to new one',
            module: 'invoices',
            topic: 'create-invoice',
        },
        {
            error: '"Driver CDL expired"',
            solution: 'Update driver CDL expiry date in driver profile',
            module: 'drivers',
            topic: 'driver-setup',
        },
    ];

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div>
                    <h1 className="text-4xl font-bold">Help Center</h1>
                    <p className="text-muted-foreground mt-2">
                        Everything you need to know about using the TMS system
                    </p>
                </div>

                {/* Search */}
                <div className="relative max-w-2xl">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search for help articles, guides, and tutorials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 text-lg"
                    />
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Quick Start Guides</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Card key={link.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {link.badge}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg mt-4">{link.title}</CardTitle>
                                    <CardDescription>{link.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="ghost" size="sm" className="w-full justify-between">
                                        Read Guide
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Browse by Module */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Browse by Module</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map((module) => {
                        const Icon = module.icon;
                        return (
                            <Card key={module.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-12 w-12 rounded-lg ${module.color} flex items-center justify-center`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle>{module.title}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {module.articles} articles
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{module.description}</p>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" size="sm" className="w-full">
                                        View Articles
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Common Errors */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Common Errors & Solutions</h2>
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {commonErrors.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 space-y-1">
                                        <p className="font-mono text-sm text-red-600 dark:text-red-400">{item.error}</p>
                                        <p className="text-sm text-muted-foreground">{item.solution}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Resources */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Additional Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                                <Video className="h-5 w-5 text-blue-500" />
                            </div>
                            <CardTitle className="text-lg">Video Tutorials</CardTitle>
                            <CardDescription>Watch step-by-step video guides</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" size="sm" className="w-full gap-2">
                                Coming Soon
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
                                <FileQuestion className="h-5 w-5 text-green-500" />
                            </div>
                            <CardTitle className="text-lg">FAQ</CardTitle>
                            <CardDescription>Frequently asked questions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" size="sm" className="w-full gap-2">
                                View FAQ
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                                <MessageCircle className="h-5 w-5 text-purple-500" />
                            </div>
                            <CardTitle className="text-lg">Contact Support</CardTitle>
                            <CardDescription>Get help from our support team</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" size="sm" className="w-full gap-2">
                                Contact Us
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Workflow Diagram */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Complete Workflow</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>From Load Creation to Payment</CardTitle>
                        <CardDescription>
                            Understand the complete flow of operations in the TMS
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center gap-4 p-8 overflow-x-auto">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center mb-2">
                                        <TruckIcon className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-sm font-medium">Create Load</p>
                                </div>
                                <ChevronRight className="h-6 w-6 text-muted-foreground" />
                                <div className="text-center">
                                    <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mb-2">
                                        <CheckCircle className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-sm font-medium">Deliver</p>
                                </div>
                                <ChevronRight className="h-6 w-6 text-muted-foreground" />
                                <div className="text-center">
                                    <div className="h-16 w-16 rounded-full bg-purple-500 flex items-center justify-center mb-2">
                                        <FileText className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-sm font-medium">Invoice</p>
                                </div>
                                <ChevronRight className="h-6 w-6 text-muted-foreground" />
                                <div className="text-center">
                                    <div className="h-16 w-16 rounded-full bg-orange-500 flex items-center justify-center mb-2">
                                        <DollarSign className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-sm font-medium">Settlement</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button variant="outline" className="w-full">
                                View Detailed Workflow Guide
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
