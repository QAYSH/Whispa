import { Menu, X } from 'lucide-react';

interface MobileMenuButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

export function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
    return (
        <button
            onClick={onClick}
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
            {isOpen ? (
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
            ) : (
                <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
            )}
        </button>
    );
}