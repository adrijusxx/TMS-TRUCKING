
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link2Icon } from 'lucide-react';

interface SamsaraTokenPromptProps {
    isOpen: boolean;
    onDismiss?: () => void;
}

export function SamsaraTokenPrompt({ isOpen, onDismiss }: SamsaraTokenPromptProps) {
    const router = useRouter();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
        }
    }, [isOpen]);

    const handleConnect = () => {
        router.push('/dashboard/settings/integrations/samsara');
        if (onDismiss) onDismiss();
    };

    const handleClose = () => {
        setShow(false);
        if (onDismiss) onDismiss();
    };

    return (
        <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2Icon className="h-5 w-5 text-blue-600" />
                        Connect Samsara Integration
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        Your Samsara account is not connected. Connect now to see real-time vehicle locations, telematics, and HOS logs on this map.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="ghost" onClick={handleClose}>
                        Maybe Later
                    </Button>
                    <Button onClick={handleConnect}>
                        Configure Integration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
