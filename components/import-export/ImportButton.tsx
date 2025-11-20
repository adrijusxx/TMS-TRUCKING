'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface ImportButtonProps {
  entityType: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function ImportButton({
  entityType,
  variant = 'outline',
  size = 'default',
}: ImportButtonProps) {
  return (
    <Link href={`/dashboard/import/${entityType}`}>
      <Button variant={variant} size={size}>
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
    </Link>
  );
}

