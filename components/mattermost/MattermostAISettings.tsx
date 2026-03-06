'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Bot, Shield, Zap } from 'lucide-react';

interface Props {
    confidenceThreshold: number;
    emergencyKeywords: string[];
    aiProvider: string;
    onUpdate: (data: Record<string, any>) => void;
}

export default function MattermostAISettings({ confidenceThreshold, emergencyKeywords, aiProvider, onUpdate }: Props) {
    const [keywordsInput, setKeywordsInput] = useState('');

    useEffect(() => {
        if (emergencyKeywords) setKeywordsInput(emergencyKeywords.join(', '));
    }, [emergencyKeywords]);

    const handleSaveKeywords = () => {
        const keywords = keywordsInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
        onUpdate({ emergencyKeywords: keywords });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        AI Configuration
                    </CardTitle>
                    <CardDescription className="text-xs">Thresholds, keywords, and provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Confidence Threshold</Label>
                            <span className="text-sm font-medium">{Math.round(confidenceThreshold * 100)}%</span>
                        </div>
                        <Slider
                            value={[confidenceThreshold * 100]}
                            onValueChange={v => onUpdate({ confidenceThreshold: v[0] / 100 })}
                            min={50} max={100} step={5}
                        />
                        <p className="text-xs text-muted-foreground">
                            Minimum confidence for AI to auto-create cases or respond
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label className="text-sm">Emergency Keywords</Label>
                        <Input
                            value={keywordsInput}
                            onChange={e => setKeywordsInput(e.target.value)}
                            placeholder="accident, injured, fire, police"
                            className="h-8 text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                            Comma-separated. Messages with these words bypass confidence threshold and force CRITICAL urgency.
                        </p>
                        <Button onClick={handleSaveKeywords} size="sm" variant="outline">Save Keywords</Button>
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                        <Label className="text-sm">AI Provider</Label>
                        <Select value={aiProvider} onValueChange={v => onUpdate({ aiProvider: v })}>
                            <SelectTrigger className="h-8 text-xs w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OPENAI">OpenAI (GPT-4)</SelectItem>
                                <SelectItem value="GEMINI">Google Gemini</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Presets</CardTitle>
                    <CardDescription className="text-xs">Apply recommended configurations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start h-9 text-xs" onClick={() => onUpdate({
                        confidenceThreshold: 0.9,
                    })}>
                        <Shield className="h-3.5 w-3.5 mr-2" />Conservative (0.9 threshold)
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-9 text-xs" onClick={() => onUpdate({
                        confidenceThreshold: 0.7,
                    })}>
                        <Zap className="h-3.5 w-3.5 mr-2" />Balanced (0.7 threshold)
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-9 text-xs" onClick={() => onUpdate({
                        confidenceThreshold: 0.5,
                    })}>
                        <Bot className="h-3.5 w-3.5 mr-2" />Aggressive (0.5 threshold)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
