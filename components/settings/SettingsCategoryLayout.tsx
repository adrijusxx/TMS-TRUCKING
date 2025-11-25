'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsCategoryLayoutProps {
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
}

export default function SettingsCategoryLayout({
  title,
  description,
  icon,
  children,
}: SettingsCategoryLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {children}
    </div>
  );
}





