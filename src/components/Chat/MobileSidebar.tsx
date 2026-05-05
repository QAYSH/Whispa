import { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export function MobileSidebar({ isOpen, onClose, children, title }: MobileSidebarProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('mobile-menu-open');
        } else {
            document.body.classList.remove('mobile-menu-open');
        }
        return () => document.body.classList.remove('mobile-menu-open');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-xl animate-slide-in lg:hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-semibold text-gray-900">{title || 'Conversations'}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </>
    );
}