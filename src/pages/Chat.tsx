import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useMessageStore, useCryptoStore } from '../store/useStore';
import { getMessages, sendMessage as sendMessageAPI } from '../api/message';
import { searchUsers, getUserPublicKey } from '../api/user';
import { hybridEncrypt, hybridDecrypt } from '../crypto/hybrid';
import { importPublicKey } from '../crypto/rsa';
import { useWebSocket } from '../hooks/useWebsocket.ts';
import  { MessageBubble, type MessageStatus } from '../components/Chat/MessageBubble';
import { TypingIndicator } from '../components/Chat/TypingIndicator';
import { EmptyState } from '../components/Common/EmptyState';
import { MobileMenuButton } from '../components/Chat/MobileMenuButton';
import { MobileSidebar } from '../components/Chat/MobileSidebar';
import { ConversationList } from '../components/Conversation/ConversationList';
import { LogOut, Search, Send, Wifi, WifiOff, Users, X } from 'lucide-react';
import { logout } from '../api/auth';
import type { User, Conversation, Message } from '../types';

// Extend Message type to include status
interface MessageWithStatus extends Message {
    status?: MessageStatus;
}

export function Chat() {
    const navigate = useNavigate();
    const { user, logout: clearAuth } = useAuthStore();
    const { privateKey, publicKey } = useCryptoStore();
    const {
        conversations,
        currentConversation,
        messages,
        setConversations,
        setCurrentConversation,
        setMessages,
        addMessage,
    } = useMessageStore();

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [knownUsers, setKnownUsers] = useState<Map<string, User>>(new Map());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [typers, setTypers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // WebSocket for real-time messages
    const { sendMessage: wsSend, isConnected } = useWebSocket({
        token: sessionStorage.getItem('access_token'),
        privateKey,
        currentUserId: user?.id || '',
        onNewMessage: useCallback((message: Message) => {
            const conversationUserId = message.from_user_id === user?.id
                ? message.to_user_id
                : message.from_user_id;

            addMessage(conversationUserId, { ...message, status: 'delivered' });
            scrollToBottom();

            const sender = knownUsers.get(message.from_user_id);
            if (sender) {
                const updatedConversations = updateConversationList(conversations, message, sender);
                setConversations(updatedConversations);
            }
        }, [user, knownUsers, conversations, addMessage, setConversations])
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const updateConversationList = (convos: Conversation[], msg: Message, sender: User): Conversation[] => {
        const existingIndex = convos.findIndex(c => c.user_id === sender.id);
        const newConversation: Conversation = {
            user_id: sender.id,
            display_name: sender.display_name,
            username: sender.username,
            last_message_at: msg.created_at,
        };

        if (existingIndex >= 0) {
            const updated = [...convos];
            updated[existingIndex] = newConversation;
            return updated.sort((a, b) =>
                new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
            );
        }
        return [newConversation, ...convos];
    };

    useEffect(() => {
        if (!user || !privateKey) {
            navigate('/login');
            return;
        }
        loadConversationHistory();
    }, [user, privateKey]);

    const loadConversationHistory = async () => {
        // Load any existing message history from all known users
        // For now, start with empty list
        setConversations([]);
    };

    const loadMessages = async (userId: string) => {
        setIsLoading(true);
        try {
            const msgs = await getMessages(userId);

            const decryptedMsgs = await Promise.all(
                msgs.map(async (msg, index) => {
                    try {
                        const isOwnMessage = msg.from_user_id === user?.id;
                        const plaintext = await hybridDecrypt(msg.payload, privateKey!, isOwnMessage);
                        return {
                            ...msg,
                            decryptedText: plaintext,
                            status: 'delivered' as MessageStatus,
                            created_at: msg.created_at
                        };
                    } catch {
                        return { ...msg, decryptedText: '[Failed to decrypt]', status: 'delivered' as MessageStatus };
                    }
                })
            );

            setMessages(userId, decryptedMsgs as MessageWithStatus[]);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchUsers(searchQuery);
            setSearchResults(results.filter(r => r.id !== user?.id));
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = async (userToChat: User) => {
        const publicKeyBase64 = await getUserPublicKey(userToChat.id);
        const fullUser = { ...userToChat, public_key: publicKeyBase64 };
        setSelectedUser(fullUser);

        knownUsers.set(userToChat.id, fullUser);
        setKnownUsers(new Map(knownUsers));

        setCurrentConversation({
            user_id: userToChat.id,
            display_name: userToChat.display_name,
            username: userToChat.username,
            last_message_at: null,
        });

        await loadMessages(userToChat.id);
        setShowSearch(false);
        setMobileMenuOpen(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSendMessage = async (plaintext: string) => {
        if (!selectedUser || !privateKey || !publicKey || !user || isSending) return;

        // Create temporary message with sending status
        const tempId = `temp-${Date.now()}`;
        const tempMessage: MessageWithStatus = {
            id: tempId,
            from_user_id: user.id,
            to_user_id: selectedUser.id,
            payload: {} as any,
            decryptedText: plaintext,
            created_at: new Date().toISOString(),
            delivered: false,
            status: 'sending',
        };

        addMessage(selectedUser.id, tempMessage);
        scrollToBottom();

        setIsSending(true);
        try {
            let recipientPublicKey: CryptoKey;
            if (selectedUser.public_key) {
                recipientPublicKey = await importPublicKey(selectedUser.public_key);
            } else {
                const publicKeyBase64 = await getUserPublicKey(selectedUser.id);
                recipientPublicKey = await importPublicKey(publicKeyBase64);
                selectedUser.public_key = publicKeyBase64;
            }

            const payload = await hybridEncrypt(plaintext, recipientPublicKey, publicKey);

            const wsSent = wsSend(payload);

            if (!wsSent) {
                await sendMessageAPI(selectedUser.id, payload);
            }

            // Update message status
            const currentMsgs = messages.get(selectedUser.id) || [];
            const updatedMsgs = currentMsgs.map(msg =>
                msg.id === tempId ? { ...msg, status: wsSent ? 'delivered' as MessageStatus : 'sent' as MessageStatus } : msg
            );
            setMessages(selectedUser.id, updatedMsgs);

            if (!conversations.find(c => c.user_id === selectedUser.id)) {
                const newConversation: Conversation = {
                    user_id: selectedUser.id,
                    display_name: selectedUser.display_name,
                    username: selectedUser.username,
                    last_message_at: new Date().toISOString(),
                };
                setConversations([newConversation, ...conversations]);
            }
        } catch (error) {
            // Update to error status
            const currentMsgs = messages.get(selectedUser.id) || [];
            const updatedMsgs = currentMsgs.map(msg =>
                msg.id === tempId ? { ...msg, decryptedText: '[Failed to send]', status: 'sent' as MessageStatus } : msg
            );
            setMessages(selectedUser.id, updatedMsgs);
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleTyping = () => {
        // Send typing indicator via WebSocket (implement if backend supports)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            // Clear typing indicator after 2 seconds of no typing
        }, 2000);
    };

    const handleLogout = async () => {
        await logout();
        clearAuth();
        navigate('/login');
    };

    const currentMessages = (messages.get(selectedUser?.id || '') || []) as MessageWithStatus[];
    const hasMessages = currentMessages.length > 0;
    const hasConversations = conversations.length > 0;

    return (
        <div className="h-screen flex bg-white">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:w-80 flex-col border-r border-gray-200 bg-white">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="font-semibold text-gray-900">{user?.display_name}</h2>
                            <p className="text-xs text-gray-500">@{user?.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1" title={isConnected ? 'Connected' : 'Using REST fallback'}>
                                {isConnected ? (
                                    <Wifi className="w-4 h-4 text-green-500" />
                                ) : (
                                    <WifiOff className="w-4 h-4 text-gray-400" />
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search users..."
                            className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {searchResults.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className="w-full p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <p className="font-medium text-sm">{user.display_name}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {!hasConversations && !showSearch ? (
                        <EmptyState
                            type="no-conversations"
                            action={() => setShowSearch(true)}
                            actionText="Find Friends"
                        />
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            currentConversationId={currentConversation?.user_id || null}
                            onSelectConversation={(conv) => {
                                const userData = knownUsers.get(conv.user_id);
                                if (userData) handleSelectUser(userData);
                            }}
                            onStartNewChat={() => setShowSearch(true)}
                        />
                    )}
                </div>
            </div>

            {/* Mobile Sidebar */}
            <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Conversations">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search users..."
                            className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {searchResults.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    className="w-full p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <p className="font-medium text-sm">{user.display_name}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {!hasConversations ? (
                        <EmptyState type="no-conversations" action={() => setShowSearch(true)} />
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            currentConversationId={currentConversation?.user_id || null}
                            onSelectConversation={(conv) => {
                                const userData = knownUsers.get(conv.user_id);
                                if (userData) handleSelectUser(userData);
                            }}
                            onStartNewChat={() => setShowSearch(true)}
                        />
                    )}
                </div>
            </MobileSidebar>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50">
                {/* Chat Header */}
                {selectedUser ? (
                    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                        <MobileMenuButton isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                        <div className="flex-1">
                            <h2 className="font-semibold text-gray-900">{selectedUser.display_name}</h2>
                            <p className="text-xs text-gray-500">@{selectedUser.username}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">🔐 E2EE</span>
                            <div className="w-2 h-2 rounded-full bg-green-500" title="Online" />
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                        <MobileMenuButton isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                        <div className="flex-1">
                            <h2 className="font-semibold text-gray-900">WhisperBox</h2>
                            <p className="text-xs text-gray-500">Secure messaging</p>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                    {!selectedUser ? (
                        <EmptyState type="welcome" action={() => setShowSearch(true)} />
                    ) : isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                        </div>
                    ) : !hasMessages ? (
                        <EmptyState type="no-messages" action={() => {}} />
                    ) : (
                        <>
                            {currentMessages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    text={msg.decryptedText || '[Encrypted]'}
                                    isOwn={msg.from_user_id === user?.id}
                                    timestamp={msg.created_at}
                                    status={msg.status}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Typing Indicator */}
                <TypingIndicator typers={typers} />

                {/* Message Input */}
                {selectedUser && (
                    <div className="bg-white border-t border-gray-200 p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                onKeyDown={handleTyping}
                                placeholder={`Message ${selectedUser.display_name}...`}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        const input = e.target as HTMLInputElement;
                                        if (input.value.trim()) {
                                            handleSendMessage(input.value);
                                            input.value = '';
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                                    if (input?.value.trim()) {
                                        handleSendMessage(input.value);
                                        input.value = '';
                                    }
                                }}
                                disabled={isSending}
                                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}