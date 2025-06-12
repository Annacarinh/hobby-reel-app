import React from 'react';
import { CloseIcon } from './icons/CloseIcon'; 
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon'; // Using for confirm

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
}) => {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirmation-modal-title"
    >
      <div className="bg-brand-pink p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative border border-brand-blue/30 text-brand-blue">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-brand-blue hover:text-brand-lime p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-lime"
          aria-label="Close confirmation dialog"
          title="Close"
        >
          <CloseIcon className="w-7 h-7" />
        </button>

        <h2 id="confirmation-modal-title" className="text-2xl font-bold mb-4 text-center">
          {title}
        </h2>
        
        <div className="text-sm text-brand-blue/90 mb-8 text-center leading-relaxed">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onClose}
            className="group flex-1 bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2 text-base order-2 sm:order-1"
            title={cancelButtonText}
          >
            <CloseIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-700" />
            <span>{cancelButtonText}</span>
          </button>
          <button
            onClick={onConfirm}
            className="group flex-1 bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-base order-1 sm:order-2"
            title={confirmButtonText}
          >
            {title.toLowerCase().includes("delete") && <TrashIcon className="w-5 h-5 text-white" /> }
            {!title.toLowerCase().includes("delete") && <CheckCircleIcon className="w-5 h-5 text-white" /> }
            <span>{confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;