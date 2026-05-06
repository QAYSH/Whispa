import type { Conversation } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../Common/Avatar';
import { Lock } from 'lucide-react';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-3.5 text-left transition-all duration-200 border-b border-[var(--border-subtle)] group ${
                isActive
                    ? 'bg-[var(--accent-primary)]/10 border-l-[3px] border-l-[var(--accent-primary)]'
                    : 'hover:bg-[var(--bg-hover)] border-l-[3px] border-l-transparent'
            }`}
        >
            <div className="flex items-center gap-3">
                <Avatar name={conversation.display_name} size="md" />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <h3 className={`font-semibold text-sm truncate ${
                            isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                        }`}>
                            {conversation.display_name}
                        </h3>
                        {conversation.last_message_at && (
                            <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 ml-2">
                                {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <Lock className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                        <p className="text-[11px] text-[var(--text-muted)] truncate">@{conversation.username}</p>
                    </div>
                </div>
            </div>
        </button>
    );
}