'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2, Save } from 'lucide-react';

interface ApplicationUrlConfigProps {
    currentSlug: string | null;
}

export default function ApplicationUrlConfig({ currentSlug }: ApplicationUrlConfigProps) {
    const [slug, setSlug] = useState(currentSlug || '');
    const [isSaving, setIsSaving] = useState(false);

    const publicUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${slug}` : '';

    const handleSave = async () => {
        if (!slug.trim()) {
            toast.error('Slug cannot be empty');
            return;
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            toast.error('Slug must contain only lowercase letters, numbers, and hyphens');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/crm/settings/slug', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save');
            }
            toast.success('Application URL saved');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const copyUrl = () => {
        if (publicUrl) {
            navigator.clipboard.writeText(publicUrl);
            toast.success('URL copied to clipboard');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Public Application Form</CardTitle>
                <CardDescription>
                    Share this URL with potential drivers or post it on job boards
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Company URL Slug</Label>
                    <div className="flex gap-2">
                        <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 rounded-l-md border border-r-0">
                            /apply/
                        </div>
                        <Input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="your-company-name"
                            className="rounded-l-none"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Only lowercase letters, numbers, and hyphens. Example: acme-trucking
                    </p>
                </div>

                {publicUrl && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="text-sm flex-1 truncate">{publicUrl}</code>
                        <Button variant="ghost" size="sm" onClick={copyUrl}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving || !slug.trim()}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save URL
                </Button>
            </CardFooter>
        </Card>
    );
}
