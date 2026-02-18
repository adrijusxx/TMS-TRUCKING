'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserCheck } from 'lucide-react';

interface HireLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string;
    leadName: string;
    onSuccess: () => void;
}

export default function HireLeadDialog({
    open,
    onOpenChange,
    leadId,
    leadName,
    onSuccess,
}: HireLeadDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [payType, setPayType] = useState('PER_MILE');
    const [payRate, setPayRate] = useState('0.65');
    const [driverType, setDriverType] = useState('COMPANY_DRIVER');

    const handleHire = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/hire`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payType, payRate, driverType }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to hire lead');
            }

            const data = await res.json();
            toast.success(`${leadName} has been hired as a driver!`);
            onOpenChange(false);
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Failed to hire lead');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-600" />
                        Hire Lead
                    </DialogTitle>
                    <DialogDescription>
                        Convert <strong>{leadName}</strong> to a driver. This will create a driver
                        record and start the onboarding checklist.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Driver Type</Label>
                        <Select value={driverType} onValueChange={setDriverType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="COMPANY_DRIVER">Company Driver</SelectItem>
                                <SelectItem value="OWNER_OPERATOR">Owner Operator</SelectItem>
                                <SelectItem value="LEASE_PURCHASE">Lease Purchase</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Pay Type</Label>
                        <Select value={payType} onValueChange={setPayType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PER_MILE">Per Mile</SelectItem>
                                <SelectItem value="PER_LOAD">Per Load (Flat Rate)</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                <SelectItem value="HOURLY">Hourly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Pay Rate {payType === 'PER_MILE' ? '($/mile)' : payType === 'PERCENTAGE' ? '(%)' : payType === 'HOURLY' ? '($/hr)' : '($)'}
                        </Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={payRate}
                            onChange={(e) => setPayRate(e.target.value)}
                            placeholder="0.65"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleHire} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <UserCheck className="h-4 w-4 mr-2" />
                        )}
                        Hire & Start Onboarding
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
