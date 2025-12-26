'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

export default function AIProcessingCard() {
    const [isInitializing, setIsInitializing] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const handleInitialize = async () => {
        setIsInitializing(true);
        try {
            const response = await fetch(apiUrl('/api/telegram/ai/initialize'), {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to initialize AI processing');
            }

            setIsActive(true);
            toast.success('AI processing initialized successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to initialize AI processing');
        } finally {
            setIsInitializing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        <CardTitle>AI Message Processing</CardTitle>
                    </div>
                    {isActive ? (
                        <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Inactive
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    Automatically analyze incoming messages, detect breakdowns, and create cases
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        <p className="mb-2">When enabled, the system will:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Analyze all incoming Telegram messages with AI</li>
                            <li>Automatically detect breakdown reports</li>
                            <li>Create breakdown cases when confidence threshold is met</li>
                            <li>Send automated responses based on your templates</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleInitialize}
                        disabled={isInitializing || isActive}
                        className="w-full"
                    >
                        {isInitializing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Initializing...
                            </>
                        ) : isActive ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                AI Processing Active
                            </>
                        ) : (
                            <>
                                <Bot className="h-4 w-4 mr-2" />
                                Initialize AI Processing
                            </>
                        )}
                    </Button>

                    {isActive && (
                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200">
                                ✓ AI is now monitoring incoming messages and will automatically process them according to your settings.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
