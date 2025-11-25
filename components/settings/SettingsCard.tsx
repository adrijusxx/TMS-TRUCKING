'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LucideIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  buttonText?: string;
  children?: ReactNode;
  className?: string;
  usageInfo?: string;
}

/**
 * Reusable card component for settings pages
 * Supports both link-based cards and cards with embedded content
 */
export default function SettingsCard({
  title,
  description,
  icon: Icon,
  href,
  buttonText,
  children,
  className,
  usageInfo,
}: SettingsCardProps) {
  const hasLink = href && buttonText;
  const hasContent = !!children;
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
          {usageInfo && (
            <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
        {usageInfo && (
          <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <CollapsibleContent className="mt-3">
              <div className="rounded-lg bg-muted/50 p-3 border border-border">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">How to use:</p>
                    <p className="whitespace-pre-line">{usageInfo}</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardHeader>
      <CardContent>
        {hasContent ? (
          children
        ) : hasLink ? (
          <div className="flex items-center justify-end">
            <Link href={href}>
              <Button variant="outline">
                {buttonText}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

