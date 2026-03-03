'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare } from 'lucide-react';

interface Props {
    autoAckMessage?: string;
    caseCreatedMessage?: string;
    afterHoursMessage?: string;
    emergencyContactNumber?: string;
    onSave: (field: string, value: string) => void;
}

export default function TelegramTemplateSettings({ autoAckMessage, caseCreatedMessage, afterHoursMessage, emergencyContactNumber, onSave }: Props) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message Templates
                </CardTitle>
                <CardDescription className="text-xs">Customize automated message templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-xs">Auto-Acknowledgment</Label>
                    <Textarea
                        defaultValue={autoAckMessage || 'We received your message. Our team will respond shortly.'}
                        onBlur={e => onSave('autoAckMessage', e.target.value)}
                        rows={2} className="text-xs resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground">Sent when a message is received but no case is created</p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                    <Label className="text-xs">Case Created</Label>
                    <Textarea
                        defaultValue={caseCreatedMessage || "Case #{caseNumber} created. We'll contact you soon."}
                        onBlur={e => onSave('caseCreatedMessage', e.target.value)}
                        rows={2} className="text-xs resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground">Use {'{caseNumber}'} as placeholder</p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                    <Label className="text-xs">After Hours</Label>
                    <Textarea
                        defaultValue={afterHoursMessage || 'We received your message after hours. On-call staff will respond within 15 minutes.'}
                        onBlur={e => onSave('afterHoursMessage', e.target.value)}
                        rows={2} className="text-xs resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground">Sent when messages arrive outside business hours</p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                    <Label className="text-xs">Emergency Contact Number</Label>
                    <Input
                        defaultValue={emergencyContactNumber || ''}
                        onBlur={e => onSave('emergencyContactNumber', e.target.value)}
                        placeholder="1-800-XXX-XXXX" className="h-8 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">Included in emergency escalation messages</p>
                </div>
            </CardContent>
        </Card>
    );
}
