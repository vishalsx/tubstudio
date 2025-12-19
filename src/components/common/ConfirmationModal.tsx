// src/components/common/ConfirmationModal.tsx
import React from 'react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[var(--bg-panel)] bg-panel-texture rounded-lg shadow-xl w-full max-w-md border border-[var(--border-main)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[var(--text-main)]">{title}</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{message}</p>
        </div>
        <div className="bg-[var(--bg-input)] px-6 py-3 flex justify-end items-center space-x-3 rounded-b-lg border-t border-[var(--border-main)]">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
