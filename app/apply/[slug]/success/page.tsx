import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ApplicationSuccessPage() {
    return (
        <Card className="text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h1 className="text-2xl font-bold">Application Submitted!</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Thank you for your application. Our recruiting team will review your
                    information and reach out to you soon.
                </p>
                <p className="text-sm text-muted-foreground">
                    You can close this page now.
                </p>
            </CardContent>
        </Card>
    );
}
