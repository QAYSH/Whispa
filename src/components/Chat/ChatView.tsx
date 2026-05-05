import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble.tsx';
import { MessageInput } from './MessageInput';
import { EncryptedBadge } from '../Common/EncryptedBadge.tsx';
import type { Message, User } from '../../types';

interface ChatViewProps {
    recipient: User | null;
    messages: Message[];
    onSendMessage: (text: string) => void;
    currentUserId: string;
    isLoading?: boolean;
    isSending?: boolean;
}



export function ChatView({
                             recipient,
                             messages,
                             onSendMessage,
                             currentUserId,
                             isLoading,
                         }: ChatViewProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!recipient) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-500">Select a conversation to start messaging</p>
                    <p className="text-sm text-gray-400 mt-2">Messages are end-to-end encrypted</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold">{recipient.display_name}</h2>
                        <p className="text-sm text-gray-500">@{recipient.username}</p>
                    </div>
                    <EncryptedBadge />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        No messages yet. Send an encrypted message!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            text={msg.decryptedText || '[Encrypted Message]'}
                            isOwn={msg.from_user_id === currentUserId}
                            timestamp={msg.created_at}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MessageInput onSend={onSendMessage} disabled={isLoading} />
        </div>
    );
}