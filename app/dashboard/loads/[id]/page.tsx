'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEntitySheet } from '@/lib/contexts/EntitySheetContext';
import { Loader2 } from 'lucide-react';

export default function LoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { openEntitySheet } = useEntitySheet();

  useEffect(() => {
    openEntitySheet('loads', id);
    router.replace('/dashboard/loads');
  }, [id, openEntitySheet, router]);

  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
