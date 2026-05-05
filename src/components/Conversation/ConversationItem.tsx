import type { Conversation } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                isActive ? 'bg-blue-50 border-r-4 border-blue-600' : ''
            }`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-gray-900">{conversation.display_name}</h3>
                    <p className="text-sm text-gray-500">@{conversation.username}</p>
                </div>
                {conversation.last_message_at && (
                    <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
          </span>
                )}
            </div>
        </button>
    );
}