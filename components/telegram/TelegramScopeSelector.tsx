'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Building2, Network } from 'lucide-react';

interface TelegramScopeSelectorProps {
  telegramScope: 'COMPANY' | 'MC';
  isConnected: boolean;
  onScopeChange: (scope: 'COMPANY' | 'MC') => void;
}

export default function TelegramScopeSelector({
  telegramScope,
  isConnected,
  onScopeChange,
}: TelegramScopeSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Connection Scope</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={telegramScope}
          onValueChange={(v) => onScopeChange(v as 'COMPANY' | 'MC')}
          disabled={isConnected}
          className="grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="scope-company"
            className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
              telegramScope === 'COMPANY' ? 'border-primary bg-primary/5' : 'border-border'
            } ${isConnected ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <RadioGroupItem value="COMPANY" id="scope-company" className="mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Company-wide</span>
              </div>
              <p className="text-xs text-muted-foreground">
                One shared Telegram connection for all MC numbers
              </p>
            </div>
          </Label>

          <Label
            htmlFor="scope-mc"
            className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
              telegramScope === 'MC' ? 'border-primary bg-primary/5' : 'border-border'
            } ${isConnected ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <RadioGroupItem value="MC" id="scope-mc" className="mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Per MC Number</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Independent Telegram connection per MC number
              </p>
            </div>
          </Label>
        </RadioGroup>

        {isConnected && (
          <p className="text-xs text-muted-foreground mt-2">
            Disconnect Telegram before changing the connection scope.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
