import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Map, FileText } from 'lucide-react';

export default function IntegrationsPage() {
    const integrations = [
        {
            name: 'Telegram',
            description: 'AI-powered driver communication with automatic case creation',
            icon: MessageSquare,
            href: '/dashboard/settings/integrations/telegram',
            status: 'Available',
            color: 'text-cyan-500',
        },
        {
            name: 'Samsara',
            description: 'Fleet telematics and GPS tracking integration',
            icon: Map,
            href: '/dashboard/settings/integrations/samsara',
            status: 'Coming Soon',
            color: 'text-blue-500',
        },
        {
            name: 'QuickBooks',
            description: 'Accounting and financial data synchronization',
            icon: FileText,
            href: '/dashboard/settings/integrations/quickbooks',
            status: 'Coming Soon',
            color: 'text-green-500',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground mt-2">
                    Connect your TMS with external services and tools
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                    <Link
                        key={integration.name}
                        href={integration.href}
                        className={integration.status === 'Coming Soon' ? 'pointer-events-none' : ''}
                    >
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <integration.icon className={`h-8 w-8 ${integration.color}`} />
                                    {integration.status === 'Coming Soon' && (
                                        <span className="text-xs bg-muted px-2 py-1 rounded">Coming Soon</span>
                                    )}
                                </div>
                                <CardTitle className="mt-4">{integration.name}</CardTitle>
                                <CardDescription>{integration.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-primary hover:underline">
                                    {integration.status === 'Available' ? 'Configure →' : 'Learn more →'}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
