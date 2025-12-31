'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Users, CreditCard, Shield, ChevronLeft, Trash2, Save, ExternalLink, Edit2, X, Check } from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/lib/config/subscription-plans';

interface CompanyDetailClientProps {
    company: any;
    subscription: any;
}

const MODULES = [
    { id: 'FLEET', label: 'Fleet Management' },
    { id: 'ACCOUNTING', label: 'Accounting' },
    { id: 'SAFETY', label: 'Safety' },
    { id: 'INTEGRATIONS', label: 'Integrations' },
    { id: 'AI_DISPATCH', label: 'AI Dispatch' },
    { id: 'ANALYTICS', label: 'Analytics' },
    { id: 'HR', label: 'HR Management' },
];

export default function CompanyDetailClient({ company, subscription }: CompanyDetailClientProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: company.name,
        dotNumber: company.dotNumber,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        state: company.state,
        zip: company.zip,
        isActive: company.isActive,
    });

    const [subData, setSubData] = useState({
        status: subscription.status,
        planId: subscription.planId || SUBSCRIPTION_PLANS.FREE,
        manualOverride: subscription.manualOverride,
        manualModules: subscription.manualModules || [],
    });

    const [isAddingMc, setIsAddingMc] = useState(false);
    const [newMcNumber, setNewMcNumber] = useState('');
    const [newMcType, setNewMcType] = useState('CARRIER');
    const [editingMcId, setEditingMcId] = useState<string | null>(null);
    const [editMcNumber, setEditMcNumber] = useState('');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/super-admin/companies/${company.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    subscriptionStatus: subData.status,
                    planId: subData.planId,
                    manualOverride: subData.manualOverride,
                    manualModules: subData.manualModules,
                }),
            });

            if (!response.ok) throw new Error('Failed to update company');

            toast.success('Company updated successfully');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update company');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleModule = (moduleId: string) => {
        setSubData(prev => ({
            ...prev,
            manualModules: prev.manualModules.includes(moduleId)
                ? prev.manualModules.filter((id: string) => id !== moduleId)
                : [...prev.manualModules, moduleId]
        }));
    };

    const handleDeleteMc = async (mcId: string, mcNumber: string) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete MC Number ${mcNumber}? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`/api/super-admin/mc-numbers/${mcId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete MC number');

            toast.success('MC number deleted successfully');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete MC number');
        }
    };

    const handleUpdateMc = async (mcId: string) => {
        if (!editMcNumber) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/super-admin/mc-numbers/${mcId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    number: editMcNumber
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update MC number');
            }

            toast.success('MC number updated successfully');
            setEditingMcId(null);
            setEditMcNumber('');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddMc = async () => {
        if (!newMcNumber) return;
        setIsSaving(true);
        try {
            const response = await fetch('/api/super-admin/mc-numbers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    number: newMcNumber,
                    companyId: company.id,
                    companyName: company.name,
                    type: newMcType
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to add MC number');
            }

            toast.success('MC number added successfully');
            setNewMcNumber('');
            setIsAddingMc(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this company? This action cannot be undone and will delete all related data.')) return;

        try {
            const response = await fetch(`/api/super-admin/companies/${company.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete company');

            toast.success('Company deleted successfully');
            router.push('/dashboard/super-admin/companies');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete company');
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/super-admin/companies">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            {company.name}
                            {!formData.isActive && <Badge variant="destructive">Inactive</Badge>}
                        </h1>
                        <p className="text-slate-400">ID: {company.id}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleDelete} className="bg-red-900/50 hover:bg-red-800 border-red-500/50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Company
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-400" />
                                Company Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>DOT Number</Label>
                                <Input
                                    value={formData.dotNumber}
                                    onChange={(e) => setFormData({ ...formData, dotNumber: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Address</Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>State</Label>
                                <Input
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-4">
                                <Switch
                                    id="is-active"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                />
                                <Label htmlFor="is-active">Account Active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* MC Numbers */}
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-purple-400" />
                                    MC Numbers
                                </CardTitle>
                                <CardDescription>Motor Carrier numbers associated with this company</CardDescription>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-700"
                                onClick={() => setIsAddingMc(!isAddingMc)}
                            >
                                {isAddingMc ? 'Cancel' : 'Add MC Number'}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isAddingMc && (
                                <div className="mb-4 p-3 bg-slate-950 rounded-lg border border-blue-500/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">MC Number</Label>
                                            <Input
                                                value={newMcNumber}
                                                onChange={(e) => setNewMcNumber(e.target.value)}
                                                placeholder="e.g. 123456"
                                                className="h-8 bg-slate-900 border-slate-700 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Type</Label>
                                            <select
                                                className="w-full h-8 bg-slate-900 border border-slate-700 rounded-md px-2 text-xs text-white"
                                                value={newMcType}
                                                onChange={(e) => setNewMcType(e.target.value)}
                                            >
                                                <option value="CARRIER">Carrier</option>
                                                <option value="BROKER">Broker</option>
                                                <option value="BOTH">Both</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="w-full bg-blue-600 hover:bg-blue-700 h-8"
                                        onClick={handleAddMc}
                                        disabled={isSaving || !newMcNumber}
                                    >
                                        {isSaving ? 'Adding...' : 'Confirm MC Number'}
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-3">
                                {company.mcNumbers?.map((mc: any) => (
                                    <div key={mc.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                                        <div>
                                            <div className="font-semibold text-white flex items-center gap-2">
                                                {mc.number}
                                                {mc.isDefault && <Badge variant="secondary" className="text-[10px]">DEFAULT</Badge>}
                                            </div>
                                            <div className="text-xs text-slate-400">{mc.companyName} ({mc.type})</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {editingMcId === mc.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={editMcNumber}
                                                        onChange={(e) => setEditMcNumber(e.target.value)}
                                                        className="h-8 w-32 bg-slate-900 border-slate-700 text-sm"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-400"
                                                        onClick={() => handleUpdateMc(mc.id)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400"
                                                        onClick={() => {
                                                            setEditingMcId(null);
                                                            setEditMcNumber('');
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setEditingMcId(mc.id);
                                                            setEditMcNumber(mc.number);
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400"
                                                        onClick={() => handleDeleteMc(mc.id, mc.number)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!company.mcNumbers || company.mcNumbers.length === 0) && (
                                    <div className="text-center py-6 text-slate-500 italic">No MC numbers found</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users */}
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-green-400" />
                                    Company Users
                                </CardTitle>
                                <CardDescription>Users assigned to this company</CardDescription>
                            </div>
                            <Link href={`/dashboard/super-admin/users/new?companyId=${company.id}`}>
                                <Button size="sm" variant="outline" className="border-slate-700">Add User</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {company.users?.map((user: any) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                                        <div>
                                            <div className="font-semibold text-white">{user.firstName} {user.lastName}</div>
                                            <div className="text-xs text-slate-400">{user.email} • <Badge variant="outline" className="text-[10px] py-0">{user.role}</Badge></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="text-blue-400">Impersonate</Button>
                                            <Link href={`/dashboard/super-admin/users/${user.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Subscription Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-slate-900/50 border-slate-800 border-red-500/20">
                        <CardHeader className="bg-red-500/5">
                            <CardTitle className="flex items-center gap-2 text-red-400">
                                <CreditCard className="h-5 w-5" />
                                Subscription Control
                            </CardTitle>
                            <CardDescription>Manual feature overrides</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <Label>Plan Type</Label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                    value={subData.planId}
                                    onChange={(e) => setSubData({ ...subData, planId: e.target.value })}
                                >
                                    <option value={SUBSCRIPTION_PLANS.FREE}>Starter Free</option>
                                    <option value={SUBSCRIPTION_PLANS.PRO}>Pro Monthly</option>
                                    <option value={SUBSCRIPTION_PLANS.ENTERPRISE}>Enterprise (All Access)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Plan Status</Label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                    value={subData.status}
                                    onChange={(e) => setSubData({ ...subData, status: e.target.value })}
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="FREE">Free</option>
                                    <option value="TRIALING">Trialing</option>
                                    <option value="PAST_DUE">Past Due</option>
                                    <option value="CANCELED">Canceled</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                                <div className="space-y-0.5">
                                    <Label>Manual Override</Label>
                                    <p className="text-xs text-slate-500">Ignore Stripe and use manual toggles</p>
                                </div>
                                <Switch
                                    checked={subData.manualOverride}
                                    onCheckedChange={(checked) => setSubData({ ...subData, manualOverride: checked })}
                                />
                            </div>

                            {subData.manualOverride && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label className="text-xs uppercase text-slate-500 font-bold">Enabled Modules</Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {MODULES.map((module) => (
                                            <div key={module.id} className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800">
                                                <span className="text-sm">{module.label}</span>
                                                <Switch
                                                    checked={subData.manualModules.includes(module.id)}
                                                    onCheckedChange={() => toggleModule(module.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!subData.manualOverride && (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                                    System is using Stripe/Add-ons for access control. Enable manual override to force specific features.
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-800">
                                <div className="text-xs text-slate-500 mb-1">Stripe ID:</div>
                                <div className="text-xs font-mono bg-slate-950 p-2 rounded truncate">{subscription.stripeSubscriptionId || 'N/A'}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Info */}
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-sm">Technical Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Created:</span>
                                <span className="text-slate-300">{new Date(company.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Last Updated:</span>
                                <span className="text-slate-300">{new Date(company.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
