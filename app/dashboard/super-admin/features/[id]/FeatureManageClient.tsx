'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChevronLeft, Save, Activity, ShieldAlert, Cpu, Calculator, Users, BarChart3, Plug } from 'lucide-react';
import Link from 'next/link';

interface FeatureManageClientProps {
    company: any;
    subscription: any;
}

const MODULES = [
    { id: 'FLEET', label: 'Fleet Management', description: 'Trucks, Trailers, Maintenance, Fuel tracking', icon: Activity },
    { id: 'ACCOUNTING', label: 'Accounting & Analytics', description: 'Invoices, Settlements, Pro-forma, P&L', icon: Calculator },
    { id: 'SAFETY', label: 'Safety & Compliance', description: 'Incidents, Driver files, Citations', icon: ShieldAlert },
    { id: 'HR', label: 'Human Resources', description: 'Hiring, Training, Employee files', icon: Users },
    { id: 'INTEGRATIONS', label: 'Integrations', description: 'Samsara, QuickBooks, Telegram', icon: Plug },
    { id: 'AI_DISPATCH', label: 'AI Dispatch', description: 'Automated matching and assistant', icon: Cpu },
    { id: 'ANALYTICS', label: 'Advanced Analytics', description: 'Custom reports and deep insights', icon: BarChart3 },
];

export default function FeatureManageClient({ company, subscription }: FeatureManageClientProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [data, setData] = useState({
        manualOverride: subscription?.manualOverride || false,
        manualModules: subscription?.manualModules || [],
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/super-admin/features/${company.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to update feature gates');

            toast.success('Feature gates updated successfully');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update feature gates');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleModule = (moduleId: string) => {
        setData(prev => ({
            ...prev,
            manualModules: prev.manualModules.includes(moduleId)
                ? prev.manualModules.filter((id: string) => id !== moduleId)
                : [...prev.manualModules, moduleId]
        }));
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/super-admin/features">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Manual Feature Control</h1>
                        <p className="text-slate-400">Managing access for: <span className="text-blue-400 font-semibold">{company.name}</span></p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>

            <Card className="bg-red-500/5 border-red-500/20">
                <CardHeader>
                    <div className="flex bg-slate-100 rounded-sm">
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <CardTitle className="text-red-400 flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5" />
                                    Super Admin Override
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    When enabled, this configuration PERMANENTLY bypasses Stripe subscription checks.
                                </CardDescription>
                            </div>
                            <Switch
                                checked={data.manualOverride}
                                onCheckedChange={(checked) => setData(prev => ({ ...prev, manualOverride: checked }))}
                                className="data-[state=checked]:bg-red-500"
                            />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 gap-4">
                {MODULES.map((module) => {
                    const Icon = module.icon;
                    const isEnabled = data.manualModules.includes(module.id);

                    return (
                        <Card
                            key={module.id}
                            className={cn(
                                "transition-all duration-300",
                                !data.manualOverride && "opacity-50 grayscale pointer-events-none",
                                isEnabled ? "border-red-500/50 bg-red-500/5" : "border-slate-800 bg-slate-900/50"
                            )}
                        >
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "p-3 rounded-xl",
                                        isEnabled ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-500"
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            {module.label}
                                            {isEnabled && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">FORCED ENABLED</Badge>}
                                        </h3>
                                        <p className="text-sm text-slate-400">{module.description}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={() => toggleModule(module.id)}
                                    disabled={!data.manualOverride}
                                    className="data-[state=checked]:bg-red-500"
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {!data.manualOverride && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3 text-blue-300">
                    <Activity className="h-5 w-5" />
                    <p className="text-sm">
                        Manual override is **OFF**. This company is currently restricted to their actual Stripe tier and add-ons.
                        Enable the override at the top to manually grant access to specific modules.
                    </p>
                </div>
            )}
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
