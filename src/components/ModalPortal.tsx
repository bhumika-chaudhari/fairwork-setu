import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Custom z-index class, defaults to z-50 */
  zIndexClass?: string;
  /** Optional custom container width/max-width class */
  maxWidthClass?: string;
  /** Whether backdrop click closes the modal. Defaults to true */
  closeOnBackdropClick?: boolean;
  /** Custom backdrop styling */
  backdropClassName?: string;
  /** Optional custom styling for the inner panel */
  panelClassName?: string;
}

/**
 * Universal Modal Portal for FairWork Setu
 * - Renders directly into document.body to avoid parent transforms, filters, and overflow traps.
 * - Locks background body scrolling while active.
 * - Handles Escape key to close.
 * - Mobile-first bottom sheet docking on mobile (< sm:), centered compact modal on desktop (sm:).
 */
export default function ModalPortal({
  isOpen,
  onClose,
  children,
  zIndexClass = 'z-50',
  maxWidthClass = 'sm:max-w-lg',
  closeOnBackdropClick = true,
  backdropClassName = '',
  panelClassName = '',
}: ModalPortalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      className={`fixed inset-0 ${zIndexClass} flex flex-col justify-end sm:justify-center sm:items-center bg-[#1E2B3E]/60 backdrop-blur-xs sm:p-4 animate-fade-in ${backdropClassName}`}
      onClick={() => {
        if (closeOnBackdropClick) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${maxWidthClass} rounded-t-[28px] sm:rounded-3xl bg-white border border-[#F4EBDD] shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile top drag indicator pill */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#1E2B3E]/15 sm:hidden shrink-0" />
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
