import { Search, Users } from 'lucide-react';
import { useState } from 'react';
import type { Conversation, User } from '../../types';
import { ConversationItem } from './ConversationItem';
import { searchUsers } from '../../api/user';

interface ConversationListProps {
    conversations: Conversation[];
    currentConversationId: string | null;
    onSelectConversation: (conversation: Conversation) => void;
    onStartNewChat: (user: User) => void;
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

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchUsers(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search users..."
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Users className="w-4 h-4" />
                    </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-500 mb-2">Search Results</h4>
                        <div className="space-y-2">
                            {searchResults.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => {
                                        onStartNewChat(user);
                                        setSearchResults([]);
                                        setSearchQuery('');
                                    }}
                                    className="w-full p-2 text-left hover:bg-gray-50 rounded"
                                >
                                    <p className="font-medium">{user.display_name}</p>
                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                    <ConversationItem
                        key={conv.user_id}
                        conversation={conv}
                        isActive={currentConversationId === conv.user_id}
                        onClick={() => onSelectConversation(conv)}
                    />
                ))}
            </div>
        </div>
    );
}