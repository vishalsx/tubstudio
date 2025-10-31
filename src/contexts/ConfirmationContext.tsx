import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

type ConfirmFunction = (options: ConfirmationOptions) => Promise<boolean>;

const ConfirmationContext = createContext<ConfirmFunction>(() => Promise.resolve(false));

export const useConfirmation = () => useContext(ConfirmationContext);

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(options);
      setResolver({ resolve });
    });
  }, []);

  const handleClose = () => {
    if (resolver) {
      resolver.resolve(false);
    }
    setOptions(null);
    setResolver(null);
  };

  const handleConfirm = () => {
    if (resolver) {
      resolver.resolve(true);
    }
    setOptions(null);
    setResolver(null);
  };
  
  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      {options && (
        <ConfirmationModal
          isOpen={!!options}
          onConfirm={handleConfirm}
          onCancel={handleClose}
          {...options}
        />
      )}
    </ConfirmationContext.Provider>
  );
};
