'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Building2, ChevronLeft, Plus, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

import { useSearchParams } from 'next/navigation';

interface NewUserClientProps {
    companies: any[];
}

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'FLEET_MANAGER', 'SAFETY_MANAGER'];

export default function NewUserClient({ companies }: NewUserClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'DISPATCHER',
        companyId: searchParams.get('companyId') || '',
        mcNumberId: '',
        password: '',
    });

    const [companyMcNumbers, setCompanyMcNumbers] = useState<any[]>([]);

    useEffect(() => {
        if (formData.companyId) {
            const fetchMcs = async () => {
                const res = await fetch(`/api/super-admin/companies/${formData.companyId}`);
                const data = await res.json();
                setCompanyMcNumbers(data.mcNumbers || []);
                // Set first MC as default if available
                if (data.mcNumbers?.length > 0) {
                    setFormData(prev => ({ ...prev, mcNumberId: data.mcNumbers[0].id }));
                }
            };
            fetchMcs();
        } else {
            setCompanyMcNumbers([]);
        }
    }, [formData.companyId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyId) {
            toast.error('Please select a company');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/super-admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create user');
            }

            toast.success('User created successfully');
            router.push('/dashboard/super-admin/users');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create user');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/super-admin/users">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Add New User</h1>
                    <p className="text-slate-400">Create a user account for any company</p>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-400" />
                            General Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    required
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    required
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    required
                                    type="email"
                                    placeholder="john.doe@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-slate-950 border-slate-800 pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Temporary Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    required
                                    type="text"
                                    placeholder="e.g. Welcome2024!"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="bg-slate-950 border-slate-800 pl-9"
                                />
                            </div>
                            <p className="text-xs text-slate-500">The user will be prompted to change this upon first login (coming soon).</p>
                        </div>

                        <div className="pt-4 border-t border-slate-800 space-y-4">
                            <CardTitle className="flex items-center gap-2 text-base text-purple-400">
                                <Building2 className="h-4 w-4" />
                                Company Assignment
                            </CardTitle>

                            <div className="space-y-2">
                                <Label>Target Company</Label>
                                <select
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                    value={formData.companyId}
                                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                >
                                    <option value="">Select a company...</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.dotNumber})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Primary MC Number</Label>
                                    <select
                                        required
                                        disabled={!formData.companyId}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm disabled:opacity-50"
                                        value={formData.mcNumberId}
                                        onChange={(e) => setFormData({ ...formData, mcNumberId: e.target.value })}
                                    >
                                        <option value="">Select MC...</option>
                                        {companyMcNumbers.map(mc => (
                                            <option key={mc.id} value={mc.id}>{mc.number} ({mc.type})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>System Role</Label>
                                    <select
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        {ROLES.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                {isSaving ? 'Creating User...' : 'Create User Account'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
