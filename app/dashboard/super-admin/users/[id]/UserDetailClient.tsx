'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Users, Building2, Shield, ChevronLeft, Trash2, Save, LogIn, Lock, Key } from 'lucide-react';
import Link from 'next/link';

interface UserDetailClientProps {
    user: any;
    companies: any[];
}

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'FLEET', 'SAFETY'];

export default function UserDetailClient({ user, companies }: UserDetailClientProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        mcNumberId: user.mcNumberId,
        mcAccess: user.mcAccess || [],
        password: '',
    });

    const [selectedCompany, setSelectedCompany] = useState<any>(
        companies.find(c => c.id === formData.companyId) || null
    );

    const [companyMcNumbers, setCompanyMcNumbers] = useState<any[]>(
        user.company?.mcNumbers || []
    );

    // When company changes, update MC numbers and selection
    useEffect(() => {
        const company = companies.find(c => c.id === formData.companyId);
        setSelectedCompany(company);

        // Fetch MC numbers for the selected company
        if (company) {
            const fetchMcs = async () => {
                const res = await fetch(`/api/super-admin/companies/${company.id}`);
                const data = await res.json();
                setCompanyMcNumbers(data.mcNumbers || []);
            };
            fetchMcs();
        } else {
            setCompanyMcNumbers([]);
        }
    }, [formData.companyId, companies]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/super-admin/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to update user');

            toast.success('User updated successfully');
            router.refresh();
            setFormData(prev => ({ ...prev, password: '' }));
        } catch (error) {
            console.error(error);
            toast.error('Failed to update user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImpersonate = async () => {
        setIsImpersonating(true);
        try {
            const response = await fetch(`/api/super-admin/impersonate/${user.id}`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to start impersonation');

            const data = await response.json();
            toast.success(data.message);
            // In real scenario: window.location.href = '/dashboard';
        } catch (error) {
            console.error(error);
            toast.error('Failed to impersonate user');
        } finally {
            setIsImpersonating(false);
        }
    };

    const toggleMcAccess = (mcId: string) => {
        setFormData(prev => ({
            ...prev,
            mcAccess: prev.mcAccess.includes(mcId)
                ? prev.mcAccess.filter((id: string) => id !== mcId)
                : [...prev.mcAccess, mcId]
        }));
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) return;

        try {
            const response = await fetch(`/api/super-admin/users/${user.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete user');

            toast.success('User deleted successfully');
            router.push('/dashboard/super-admin/users');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete user');
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/super-admin/users">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            {formData.firstName} {formData.lastName}
                            <Badge variant={formData.role === 'SUPER_ADMIN' ? 'destructive' : 'secondary'}>
                                {formData.role}
                            </Badge>
                        </h1>
                        <p className="text-slate-400">{formData.email}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleImpersonate}
                        disabled={isImpersonating}
                        className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                        <LogIn className="h-4 w-4 mr-2" />
                        {isImpersonating ? 'Starting...' : 'Impersonate'}
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} className="bg-red-900/50 hover:bg-red-800 border-red-500/50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Profile & Company */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-400" />
                                Profile Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Email Address</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-purple-400" />
                                Employment & Access
                            </CardTitle>
                            <CardDescription>Company and MC hierarchy control</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Assigned Company</Label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                        value={formData.companyId || ''}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                    >
                                        <option value="">No Company</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.dotNumber})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Default MC Number</Label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                        value={formData.mcNumberId || ''}
                                        onChange={(e) => setFormData({ ...formData, mcNumberId: e.target.value })}
                                    >
                                        <option value="">No Default MC</option>
                                        {companyMcNumbers.map(mc => (
                                            <option key={mc.id} value={mc.id}>{mc.number} - {mc.companyName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <Label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Multi-MC Access Permissions</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {companyMcNumbers.map(mc => (
                                        <div key={mc.id} className="flex items-center space-x-2 p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                            <Checkbox
                                                id={`mc-${mc.id}`}
                                                checked={formData.mcAccess.includes(mc.id)}
                                                onCheckedChange={() => toggleMcAccess(mc.id)}
                                            />
                                            <label
                                                htmlFor={`mc-${mc.id}`}
                                                className="text-sm font-medium text-slate-200 cursor-pointer flex-1"
                                            >
                                                {mc.number} <span className="text-xs text-slate-500 ml-2">({mc.type})</span>
                                            </label>
                                        </div>
                                    ))}
                                    {companyMcNumbers.length === 0 && (
                                        <div className="text-center py-4 text-slate-500 italic text-sm md:col-span-2">
                                            Select a company to manage MC access
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Role & Security */}
                <div className="space-y-6">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="bg-blue-500/5">
                            <CardTitle className="flex items-center gap-2 text-blue-400 text-base">
                                <Shield className="h-4 w-4" />
                                System Privileges
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                <Label>System Role</Label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    {ROLES.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400">
                                <p className="font-bold text-blue-400 mb-1">Role Permissions:</p>
                                {formData.role === 'SUPER_ADMIN' && 'Full access to ALL companies, settings, and bypasses.'}
                                {formData.role === 'ADMIN' && 'Full access to current company only.'}
                                {formData.role === 'DISPATCHER' && 'Operational access: Loads, Drivers, Trucks.'}
                                {formData.role === 'ACCOUNTANT' && 'Financial access: Invoices, Settlements.'}
                                {formData.role === 'DRIVER' && 'Driver mobile app access.'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-400 text-base">
                                <Lock className="h-4 w-4" />
                                Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Reset Password</Label>
                                <div className="relative">
                                    <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="password"
                                        placeholder="Enter new password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="bg-slate-950 border-slate-800 pl-9"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500">Leave blank to keep current password.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Last Login:</span>
                                    <span className="text-slate-300">N/A</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Created:</span>
                                    <span className="text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
