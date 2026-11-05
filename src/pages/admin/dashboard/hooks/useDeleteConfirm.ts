// The "are you sure?" window before a delete; when something blocks the delete, it says why instead.
import { useState } from 'react';

export interface DeleteRequest {
  title: string;
  message: string;
  // Set when the item cannot be deleted yet (for example a category that still has series)
  blockedReason?: string;
  onConfirm: () => Promise<void>;
}

export type AskDelete = (request: DeleteRequest) => void;

export function useDeleteConfirm() {
  const [request, setRequest] = useState<DeleteRequest | null>(null);
  const ask: AskDelete = (next) => setRequest(next);
  return { request, ask, close: () => setRequest(null) };
}
