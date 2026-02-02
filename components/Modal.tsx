import React, { useEffect } from 'react';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    title?: string;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ children, onClose, title, maxWidth = 'max-w-6xl' }) => {
    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Content Container */}
            <div className={`relative w-full ${maxWidth} bg-white dark:bg-panel-dark rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200`}>

                {/* Header (optional, usually views act as their own header but we explicitly add a close button if needed) */}
                {/* We can float the close button or put it in a header bar */}

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-100 dark:bg-black/20 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-black/40 transition-all shadow-sm"
                    title="Close"
                >
                    <span className="material-symbols-outlined text-xl font-bold">close</span>
                </button>

                {/* Content */}
                <div className="flex-1 overflow-y-auto h-full">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
