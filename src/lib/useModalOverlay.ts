'use client';

import { useEffect } from 'react';

interface UseModalOverlayOptions {
  isOpen: boolean;
  onClose?: () => void;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
}

/**
 * Standard enterprise modal overlay hook:
 * 1. Locks background document scroll when modal is active.
 * 2. Listens for the Escape key to close the modal gracefully.
 * 3. Restores scroll position & previous styles on cleanup.
 */
export function useModalOverlay({
  isOpen,
  onClose,
  closeOnEscape = true,
  lockScroll = true,
}: UseModalOverlayOptions) {
  useEffect(() => {
    if (!isOpen) return;

    let originalOverflow = '';
    if (lockScroll && typeof document !== 'undefined') {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (lockScroll && typeof document !== 'undefined') {
        document.body.style.overflow = originalOverflow;
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, lockScroll, onClose]);
}
