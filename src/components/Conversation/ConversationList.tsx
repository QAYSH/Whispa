import { useState, useEffect } from 'react';
import type { Conversation, User } from '../../types';
import { ConversationItem } from './ConversationItem';
import { searchUsers } from '../../api/user';
import { Avatar } from '../Common/Avatar';
import { useDebounce } from '../../hooks/useDebounce';

interface ConversationListProps {
    conversations: Conversation[];
    currentConversationId: string | null;
    onSelectConversation: (conversation: Conversation) => void;
    onStartNewChat: (user?: User) => void;
}

export function ConversationList({
                                     conversations,
                                     currentConversationId,
                                     onSelectConversation,
                                     onStartNewChat,
                                 }: ConversationListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        if (!debouncedSearch.trim()) {
            setSearchResults([]);
            return;
        }

        const doSearch = async () => {
            setIsSearching(true);
            try {
                const results = await searchUsers(debouncedSearch);
                setSearchResults(results);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        };

        doSearch();
    }, [debouncedSearch]);

    return (
        <div className="flex flex-col h-full">
            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Search Results</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {searchResults.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => {
                                    onStartNewChat(user);
                                    setSearchResults([]);
                                    setSearchQuery('');
                                }}
                                className="w-full p-2 text-left hover:bg-blue-50 rounded-lg transition-all flex items-center gap-3"
                            >
                                <Avatar name={user.display_name} size="sm" />
                                <div>
                                    <p className="font-medium text-sm text-gray-900">{user.display_name}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isSearching && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                </div>
            )}

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <p className="text-sm text-gray-500">No conversations yet</p>
                        <p className="text-xs text-gray-400 mt-1">Search for users to start chatting</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <ConversationItem
                            key={conv.user_id}
                            conversation={conv}
                            isActive={currentConversationId === conv.user_id}
                            onClick={() => onSelectConversation(conv)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}