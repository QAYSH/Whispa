import { MessageSquare, Search, Inbox, Lock, Shield } from 'lucide-react';

interface EmptyStateProps {
    type: 'no-conversations' | 'no-messages' | 'no-search-results' | 'welcome';
    action?: () => void;
    actionText?: string;
}

export function EmptyState({ type, action, actionText }: EmptyStateProps) {
    const config = {
        'no-conversations': {
            icon: <MessageSquare className="w-8 h-8" />,
            title: 'No conversations yet',
            description: 'Search for users to start your first encrypted chat',
            defaultButtonText: 'Find Friends',
        },
        'no-messages': {
            icon: <Inbox className="w-8 h-8" />,
            title: 'Start the conversation',
            description: 'Send an encrypted message — only the two of you can read it',
            defaultButtonText: 'Type a message',
        },
        'no-search-results': {
            icon: <Search className="w-8 h-8" />,
            title: 'No users found',
            description: 'Try a different username or display name',
            defaultButtonText: 'Clear Search',
        },
        'welcome': {
            icon: <Shield className="w-8 h-8" />,
            title: 'Welcome to WhisperBox',
            description: 'Select a conversation or search for users to start messaging with end-to-end encryption.',
            defaultButtonText: 'Start a Conversation',
        },
    };

    const current = config[type];

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 min-h-[350px] animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--accent-primary)]/15 to-purple-500/10 border border-[var(--accent-primary)]/20 flex items-center justify-center mb-5 text-[var(--accent-primary)]">
                {current.icon}
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{current.title}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-5 max-w-xs leading-relaxed">
                {current.description}
            </p>
            {action && (
                <button
                    onClick={action}
                    className="px-5 py-2.5 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-xl text-sm font-semibold transition-all border border-[var(--accent-primary)]/20"
                >
                    {actionText || current.defaultButtonText}
                </button>
            )}
            <div className="flex items-center gap-1.5 mt-6 text-[var(--text-muted)]">
                <Lock className="w-3 h-3" />
                <span className="text-[10px]">Protected by end-to-end encryption</span>
            </div>
        </div>
    );
}