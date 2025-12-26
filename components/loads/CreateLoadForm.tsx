'use client';

import CreateLoadWizard from '@/components/loads/CreateLoadWizard/CreateLoadWizard';

interface CreateLoadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isSheet?: boolean;
}

export default function CreateLoadForm({ onSuccess, onCancel, isSheet }: CreateLoadFormProps) {
  // Use the new wizard component for creating loads
  return <CreateLoadWizard onSuccess={onSuccess} onCancel={onCancel} isSheet={isSheet} />;
}

