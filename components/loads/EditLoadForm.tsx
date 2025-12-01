'use client';

import LoadForm from '@/components/forms/LoadForm';

interface EditLoadFormProps {
  loadId: string;
  initialData: any;
}

export default function EditLoadForm({ loadId, initialData }: EditLoadFormProps) {
  // initialData present = edit mode
  return <LoadForm initialData={initialData} loadId={loadId} />;
}
