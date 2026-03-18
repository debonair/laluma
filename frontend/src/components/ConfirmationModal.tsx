import React from 'react';
import './ConfirmationModal.css';
import { AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Go Back',
    variant = 'info'
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className={`modal-icon ${variant}`}>
                        <AlertCircle size={24} />
                    </div>
                    <h2 className="modal-title">{title}</h2>
                </div>
                <div className="modal-body">
                    <p className="modal-description">{description}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn-modal cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className={`btn-modal confirm ${variant}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
