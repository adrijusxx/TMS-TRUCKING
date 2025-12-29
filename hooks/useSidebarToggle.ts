import { useState, useEffect } from 'react';

export function useSidebarToggle(storageKey: string, defaultOpen: boolean = true) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Load preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      setIsOpen(saved === 'true');
    }
  }, [storageKey]);

  // Toggle and save preference
  const toggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem(storageKey, String(newState));
  };

  return { isOpen, toggle };
}

