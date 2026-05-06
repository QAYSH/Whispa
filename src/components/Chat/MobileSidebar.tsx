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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed left-0 top-0 bottom-0 w-80 bg-[var(--bg-secondary)] z-50 shadow-2xl animate-slide-in lg:hidden flex flex-col border-r border-[var(--border-subtle)]">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                    <h2 className="font-bold text-[var(--text-primary)]">{title || 'Conversations'}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto flex flex-col">
                    {children}
                </div>
            </div>
        </>
    );
}