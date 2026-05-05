import { MessageSquare, Users, Search, Send, Inbox } from 'lucide-react';

interface EmptyStateProps {
    type: 'no-conversations' | 'no-messages' | 'no-search-results' | 'welcome';
    action?: () => void;
    actionText?: string;
}

export function EmptyState({ type, action, actionText }: EmptyStateProps) {
    const config = {
        'no-conversations': {
            icon: <MessageSquare className="w-12 h-12" />,
            title: 'No conversations yet',
            description: 'Search for users to start your first encrypted chat',
            defaultButtonText: 'Find Friends',
        },
        'no-messages': {
            icon: <Inbox className="w-12 h-12" />,
            title: 'No messages',
            description: 'Send an encrypted message to start the conversation',
            defaultButtonText: 'Send Message',
        },
        'no-search-results': {
            icon: <Search className="w-12 h-12" />,
            title: 'No users found',
            description: 'Try a different username or display name',
            defaultButtonText: 'Clear Search',
        },
        'welcome': {
            icon: <Send className="w-12 h-12" />,
            title: 'Welcome to WhisperBox',
            description: 'Your messages are end-to-end encrypted. No one can read them except you and your recipient.',
            defaultButtonText: 'Start a Conversation',
        },
    };

    const current = config[type];

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-blue-500">
                {current.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{current.title}</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-xs leading-relaxed">
                {current.description}
            </p>
            {action && (
                <button
                    onClick={action}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-medium transition-all duration-200"
                >
                    {actionText || current.defaultButtonText}
                </button>
            )}
        </div>
    );
}