'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Key, Globe, Building2, Truck, Plus, Trash2, Save, ShieldCheck, Search } from 'lucide-react';

interface ApiKeyManagementClientProps {
    companies: any[];
    mcNumbers: any[];
}

const TMS_PROVIDERS = [
    'SAMSARA', 'TELEGRAM', 'QUICKBOOKS', 'STRIPE', 'ELOGS',
    'MOTIVE', 'KEEP_TRUCKIN', 'OPENAI', 'GOOGLE_MAPS',
    'GOOGLE_PLACES', 'AWS', 'OTHER'
];

export default function ApiKeyManagementClient({ companies, mcNumbers }: ApiKeyManagementClientProps) {
    const [keys, setKeys] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isCustomProvider, setIsCustomProvider] = useState(false);
    const [formData, setFormData] = useState({
        id: '' as string | null,
        provider: 'SAMSARA',
        scope: 'GLOBAL' as any,
        companyId: '',
        mcNumberId: '',
        configKey: 'API_TOKEN',
        configValue: '',
        description: '',
    });

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/super-admin/api-keys');
            const data = await res.json();
            if (Array.isArray(data)) {
                setKeys(data);
            } else {
                console.error('API keys response is not an array:', data);
                setKeys([]);
            }
        } catch (error) {
            toast.error('Failed to fetch API keys');
            setKeys([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch('/api/super-admin/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to save API key');

            toast.success('API key saved successfully');
            fetchKeys();
            setFormData({ ...formData, configValue: '', description: '' });
        } catch (error) {
            toast.error('Failed to save API key');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteKey = async (id: string, keyName: string) => {
        if (!confirm(`Are you sure you want to delete ${keyName}?`)) return;
        setIsDeleting(id);
        try {
            const response = await fetch(`/api/super-admin/api-keys/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete API key');

            toast.success('API key deleted');
            fetchKeys();
        } catch (error) {
            toast.error('Failed to delete API key');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleEditKey = (key: any) => {
        setIsCustomProvider(!TMS_PROVIDERS.includes(key.provider));
        setFormData({
            id: key.id,
            provider: key.provider,
            scope: key.scope,
            companyId: key.companyId || '',
            mcNumberId: key.mcNumberId || '',
            configKey: key.configKey,
            configValue: '', // Don't pre-fill secret values
            description: key.description || '',
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getScopeIcon = (scope: string) => {
        switch (scope) {
            case 'GLOBAL': return <Globe className="h-4 w-4" />;
            case 'COMPANY': return <Building2 className="h-4 w-4" />;
            case 'MC': return <Truck className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Key className="h-8 w-8 text-yellow-500" />
                        Hierarchical API Management
                    </h1>
                    <p className="text-slate-400">Configure global defaults or per-entity overrides for external integrations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Creation Form */}
                <Card className="bg-slate-950/50 border-slate-800 lg:col-span-1 h-fit sticky top-6">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                            {formData.id ? <Save className="h-4 w-4 text-yellow-400" /> : <Plus className="h-4 w-4 text-blue-400" />}
                            {formData.id ? 'Edit Credential' : 'Add / Override Key'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Integration Provider</Label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                    value={isCustomProvider ? 'OTHER' : formData.provider}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'OTHER') {
                                            setIsCustomProvider(true);
                                            setFormData({ ...formData, provider: '' });
                                        } else {
                                            setIsCustomProvider(false);
                                            setFormData({ ...formData, provider: val });
                                        }
                                    }}
                                >
                                    {TMS_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                {isCustomProvider && (
                                    <Input
                                        required
                                        placeholder="Enter custom provider name"
                                        value={formData.provider}
                                        onChange={(e) => setFormData({ ...formData, provider: e.target.value.toUpperCase() })}
                                        className="bg-slate-950 border-slate-800 mt-2"
                                    />
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Lookup Scope</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['GLOBAL', 'COMPANY', 'MC'].map((s) => (
                                        <Button
                                            key={s}
                                            type="button"
                                            variant={formData.scope === s ? 'default' : 'outline'}
                                            className="text-[10px] py-1 h-8"
                                            onClick={() => setFormData({ ...formData, scope: s })}
                                        >
                                            {s}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {formData.scope === 'COMPANY' && (
                                <div className="space-y-2">
                                    <Label>Target Company</Label>
                                    <select
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                    >
                                        <option value="">Select Company...</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {formData.scope === 'MC' && (
                                <div className="space-y-2">
                                    <Label>Target MC Profile</Label>
                                    <select
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-white text-sm"
                                        value={formData.mcNumberId}
                                        onChange={(e) => setFormData({ ...formData, mcNumberId: e.target.value })}
                                    >
                                        <option value="">Select MC...</option>
                                        {mcNumbers.map(m => (
                                            <option key={m.id} value={m.id}>{m.number} ({m.companyName})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Config Key</Label>
                                <Input
                                    required
                                    placeholder="e.g. API_TOKEN, WEBHOOK_SECRET"
                                    value={formData.configKey}
                                    onChange={(e) => setFormData({ ...formData, configKey: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Config Value (Secure)</Label>
                                <Input
                                    required
                                    type="password"
                                    placeholder="Paste secure value here"
                                    value={formData.configValue}
                                    onChange={(e) => setFormData({ ...formData, configValue: e.target.value })}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSaving ? 'Saving...' : formData.id ? 'Update' : 'Save'}
                                </Button>
                                {formData.id && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setFormData({ ...formData, id: null, configValue: '', description: '' })}
                                        className="border-slate-800"
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* List of Keys */}
                <div className="lg:col-span-2 space-y-4">
                    <Tabs defaultValue="SAMSARA" className="w-full">
                        <TabsList className="bg-slate-950 border border-slate-800 p-1 h-auto flex-wrap justify-start">
                            {TMS_PROVIDERS.filter(p => p !== 'OTHER').map(p => (
                                <TabsTrigger key={p} value={p} className="data-[state=active]:bg-slate-800 text-[10px] sm:text-xs py-1.5 px-3">
                                    {p}
                                </TabsTrigger>
                            ))}
                            <TabsTrigger value="OTHER" className="data-[state=active]:bg-slate-800 text-[10px] sm:text-xs py-1.5 px-3">
                                CUSTOM
                            </TabsTrigger>
                        </TabsList>

                        {TMS_PROVIDERS.map(p => {
                            const filteredKeys = (Array.isArray(keys) ? keys : []).filter(k =>
                                p === 'OTHER' ? !TMS_PROVIDERS.filter(tp => tp !== 'OTHER').includes(k.provider) : k.provider === p
                            );

                            return (
                                <TabsContent key={p} value={p} className="space-y-4 mt-6">
                                    {filteredKeys.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl">
                                            <ShieldCheck className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                                            <p className="text-slate-500">No {p} configurations found.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {filteredKeys.map((k) => (
                                                <Card key={k.id} className="bg-slate-950/40 border-slate-800/50 hover:border-slate-700/50 group transition-all">
                                                    <CardContent className="p-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2 rounded-lg ${k.scope === 'GLOBAL' ? 'bg-blue-500/10 text-blue-400' :
                                                                k.scope === 'COMPANY' ? 'bg-purple-500/10 text-purple-400' :
                                                                    'bg-orange-500/10 text-orange-400'
                                                                }`}>
                                                                {getScopeIcon(k.scope)}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-sm text-yellow-500">{k.configKey}</span>
                                                                    <Badge variant="outline" className="text-[10px] h-4">
                                                                        {k.scope}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    {k.scope === 'COMPANY' && `Target: ${k.company?.name}`}
                                                                    {k.scope === 'MC' && `Target: MC ${k.mcNumber?.number}`}
                                                                    {k.scope === 'GLOBAL' && 'Default value for all entities'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-none">
                                                                ••••••••••••
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleEditKey(k)}
                                                            >
                                                                <Plus className="h-4 w-4 rotate-45" /> {/* Edit icon placeholder/variant */}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                disabled={isDeleting === k.id}
                                                                onClick={() => handleDeleteKey(k.id, k.configKey)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
