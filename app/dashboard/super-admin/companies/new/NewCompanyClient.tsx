'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, ChevronLeft, Plus, Shield, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function NewCompanyClient() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        dotNumber: '',
        mcNumber: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: 'TX',
        zip: '',
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch('/api/super-admin/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create company');
            }

            toast.success('Company created successfully');
            router.push('/dashboard/super-admin/companies');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to create company');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/super-admin/companies">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Register New Company</h1>
                    <p className="text-slate-400">Create a new Motor Carrier profile and subscription</p>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-400" />
                            General Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company Legal Name</Label>
                                <Input
                                    required
                                    placeholder="Blue Sky Logistics LLC"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>DOT Number</Label>
                                <Input
                                    required
                                    placeholder="1234567"
                                    value={formData.dotNumber}
                                    onChange={(e) => setFormData({ ...formData, dotNumber: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Initial MC Number</Label>
                                <div className="relative">
                                    <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        required
                                        placeholder="MC123456"
                                        value={formData.mcNumber}
                                        onChange={(e) => setFormData({ ...formData, mcNumber: e.target.value })}
                                        className="bg-slate-950 border-slate-800 pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Primary Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        required
                                        type="email"
                                        placeholder="admin@bluesky.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-slate-950 border-slate-800 pl-9"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 space-y-4">
                            <CardTitle className="flex items-center gap-2 text-base text-purple-400">
                                <MapPin className="h-4 w-4" />
                                Location & Contact
                            </CardTitle>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                        <Input
                                            placeholder="555-012-3456"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="bg-slate-950 border-slate-800 pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Street Address</Label>
                                    <Input
                                        placeholder="123 Trucking Way"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                        placeholder="Dallas"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input
                                            placeholder="TX"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ZIP Code</Label>
                                        <Input
                                            placeholder="75201"
                                            value={formData.zip}
                                            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                {isSaving ? 'Creating Company...' : 'Initialize Company & Subscription'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
