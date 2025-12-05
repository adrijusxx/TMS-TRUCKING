/**
 * LoadDraftManager - Manages draft loads in localStorage
 * Allows users to save load creation progress and resume later
 */

import type { CreateLoadInput } from '@/lib/validations/load';

const DRAFT_STORAGE_KEY = 'tms_load_draft';
const DRAFT_LIST_KEY = 'tms_load_drafts_list';

export interface LoadDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  step: number;
  data: Partial<CreateLoadInput>;
  pendingFileNames?: string[];
}

export interface LoadDraftListItem {
  id: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  step: number;
  previewInfo?: {
    loadNumber?: string;
    customerName?: string;
    pickupCity?: string;
    deliveryCity?: string;
  };
}

/**
 * Generate a unique draft ID
 */
function generateDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save current draft to localStorage
 */
export function saveDraft(
  data: Partial<CreateLoadInput>,
  step: number,
  existingDraftId?: string,
  name?: string,
  pendingFileNames?: string[]
): string {
  if (!isStorageAvailable()) {
    throw new Error('localStorage is not available');
  }

  const draftId = existingDraftId || generateDraftId();
  const now = new Date().toISOString();

  const draft: LoadDraft = {
    id: draftId,
    createdAt: existingDraftId
      ? getDraft(existingDraftId)?.createdAt || now
      : now,
    updatedAt: now,
    name,
    step,
    data,
    pendingFileNames,
  };

  // Save the draft
  localStorage.setItem(`${DRAFT_STORAGE_KEY}_${draftId}`, JSON.stringify(draft));

  // Update the drafts list
  const drafts = getDraftsList();
  const existingIndex = drafts.findIndex((d) => d.id === draftId);

  const listItem: LoadDraftListItem = {
    id: draftId,
    name,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    step,
    previewInfo: {
      loadNumber: data.loadNumber,
      customerName: (data as any).customerName || undefined,
      pickupCity: data.pickupCity,
      deliveryCity: data.deliveryCity,
    },
  };

  if (existingIndex >= 0) {
    drafts[existingIndex] = listItem;
  } else {
    drafts.unshift(listItem);
  }

  localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(drafts));

  return draftId;
}

/**
 * Get a specific draft
 */
export function getDraft(draftId: string): LoadDraft | null {
  if (!isStorageAvailable()) return null;

  const stored = localStorage.getItem(`${DRAFT_STORAGE_KEY}_${draftId}`);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as LoadDraft;
  } catch {
    return null;
  }
}

/**
 * Get all drafts list (metadata only)
 */
export function getDraftsList(): LoadDraftListItem[] {
  if (!isStorageAvailable()) return [];

  const stored = localStorage.getItem(DRAFT_LIST_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as LoadDraftListItem[];
  } catch {
    return [];
  }
}

/**
 * Delete a draft
 */
export function deleteDraft(draftId: string): void {
  if (!isStorageAvailable()) return;

  localStorage.removeItem(`${DRAFT_STORAGE_KEY}_${draftId}`);

  const drafts = getDraftsList().filter((d) => d.id !== draftId);
  localStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(drafts));
}

/**
 * Clear all drafts
 */
export function clearAllDrafts(): void {
  if (!isStorageAvailable()) return;

  const drafts = getDraftsList();
  drafts.forEach((draft) => {
    localStorage.removeItem(`${DRAFT_STORAGE_KEY}_${draft.id}`);
  });

  localStorage.removeItem(DRAFT_LIST_KEY);
}

/**
 * Get the most recent draft
 */
export function getMostRecentDraft(): LoadDraft | null {
  const drafts = getDraftsList();
  if (drafts.length === 0) return null;

  // Sort by updatedAt descending
  const sorted = [...drafts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return getDraft(sorted[0].id);
}

/**
 * Check if there are any saved drafts
 */
export function hasDrafts(): boolean {
  return getDraftsList().length > 0;
}

/**
 * Get draft count
 */
export function getDraftCount(): number {
  return getDraftsList().length;
}



