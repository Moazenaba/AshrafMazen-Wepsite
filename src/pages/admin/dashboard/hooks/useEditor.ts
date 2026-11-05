// The open / closed state of an add-or-edit window and the item it edits (null = a new one).
import { useState } from 'react';

export interface Editor<T> {
  isOpen: boolean;
  editing: T | null;
  openNew: () => void;
  openEdit: (item: T) => void;
  close: () => void;
}

export function useEditor<T>(): Editor<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  return {
    isOpen,
    editing,
    openNew: () => {
      setEditing(null);
      setIsOpen(true);
    },
    openEdit: (item) => {
      setEditing(item);
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
  };
}
