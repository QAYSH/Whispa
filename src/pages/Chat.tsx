import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useMessageStore, useCryptoStore } from '../store/useStore';
import { getMessages, getConversations, sendMessage as sendMessageAPI } from '../api/message';
import { searchUsers, getUserPublicKey } from '../api/user';
import { hybridEncrypt, hybridDecrypt } from '../crypto/hybrid';
import { importPublicKey } from '../crypto/rsa';
import { useWebSocket } from '../hooks/useWebsocket';
import { useDebounce } from '../hooks/useDebounce';
import { MessageBubble } from '../components/Chat/MessageBubble';
import type { MessageStatus } from '../components/Chat/MessageBubble';
import { TypingIndicator } from '../components/Chat/TypingIndicator';
import { EmptyState } from '../components/Common/EmptyState';
import { Avatar } from '../components/Common/Avatar';
import { MobileMenuButton } from '../components/Chat/MobileMenuButton';
import { MobileSidebar } from '../components/Chat/MobileSidebar';
import { ConversationList } from '../components/Conversation/ConversationList';
import { LogOut, Search, Send, Wifi, WifiOff, Shield, Lock, MessageSquare } from 'lucide-react';
import { logout } from '../api/auth';
import type { User, Conversation, Message } from '../types';

interface MessageWithStatus extends Message {
    status?: MessageStatus;
}

export function Chat() {
    const navigate = useNavigate();
    const { user, logout: clearAuth } = useAuthStore();
    const { privateKey, publicKey } = useCryptoStore();
    const {
        conversations, currentConversation, messages,
        setConversations, setCurrentConversation, setMessages, addMessage,
    } = useMessageStore();

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [knownUsers, setKnownUsers] = useState<Map<string, User>>(new Map());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const debouncedSearch = useDebounce(searchQuery, 300);

    const { sendMessage: wsSend, isConnected } = useWebSocket({
        token: sessionStorage.getItem('access_token'),
        privateKey,
        currentUserId: user?.id || '',
        onNewMessage: useCallback((message: Message) => {
            const conversationUserId = message.from_user_id === user?.id
                ? message.to_user_id : message.from_user_id;
            addMessage(conversationUserId, { ...message, status: 'delivered' } as Message);
            scrollToBottom();
            const sender = knownUsers.get(message.from_user_id);
            if (sender) {
                setConversations(updateConversationList(conversations, message, sender));
            }
        }, [user, knownUsers, conversations, addMessage, setConversations])
    });

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const updateConversationList = (convos: Conversation[], msg: Message, sender: User): Conversation[] => {
        const idx = convos.findIndex(c => c.user_id === sender.id);
        const conv: Conversation = {
            user_id: sender.id, display_name: sender.display_name,
            username: sender.username, last_message_at: msg.created_at,
        };
        if (idx >= 0) {
            const updated = [...convos];
            updated[idx] = conv;
            return updated.sort((a, b) =>
                new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
            );
        }
        return [conv, ...convos];
    };

    useEffect(() => {
        if (!user || !privateKey) { navigate('/login'); }
    }, [user, privateKey, navigate]);

    useEffect(() => {
        if (!user || !privateKey) return;
        const load = async () => {
            setIsLoadingConversations(true);
            try {
                const convos = await getConversations();
                setConversations(convos);
                const usersMap = new Map(knownUsers);
                convos.forEach((c: Conversation) => {
                    if (!usersMap.has(c.user_id)) {
                        usersMap.set(c.user_id, {
                            id: c.user_id, display_name: c.display_name,
                            username: c.username, public_key: '', created_at: '',
                        });
                    }
                });
                setKnownUsers(usersMap);
            } catch (e) { console.error('Failed to load conversations:', e); }
            finally { setIsLoadingConversations(false); }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, privateKey]);

    useEffect(() => {
        if (!debouncedSearch.trim()) { setSearchResults([]); return; }
        const doSearch = async () => {
            try {
                const results = await searchUsers(debouncedSearch);
                setSearchResults(results.filter((r: User) => r.id !== user?.id));
            } catch (e) { console.error('Search failed:', e); }
        };
        doSearch();
    }, [debouncedSearch, user?.id]);

    const loadMessages = async (userId: string) => {
        setIsLoading(true);
        try {
            const msgs = await getMessages(userId);
            const decrypted = await Promise.all(msgs.map(async (msg) => {
                try {
                    const isOwn = msg.from_user_id === user?.id;
                    const plaintext = await hybridDecrypt(msg.payload, privateKey!, isOwn);
                    return { ...msg, decryptedText: plaintext, status: 'delivered' as MessageStatus };
                } catch {
                    return { ...msg, decryptedText: '[Failed to decrypt]', status: 'delivered' as MessageStatus };
                }
            }));
            setMessages(userId, decrypted.reverse() as MessageWithStatus[]);
            setTimeout(scrollToBottom, 100);
        } catch (e) { console.error('Failed to load messages:', e); }
        finally { setIsLoading(false); }
    };

    const handleSelectUser = async (u: User) => {
        let pk = u.public_key;
        if (!pk) pk = await getUserPublicKey(u.id);
        const full = { ...u, public_key: pk };
        setSelectedUser(full);
        knownUsers.set(u.id, full);
        setKnownUsers(new Map(knownUsers));
        setCurrentConversation({ user_id: u.id, display_name: u.display_name, username: u.username, last_message_at: null });
        await loadMessages(u.id);
        setMobileMenuOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setTimeout(() => inputRef.current?.focus(), 200);
    };

    const handleSendMessage = async (plaintext: string) => {
        if (!selectedUser || !privateKey || !publicKey || !user || isSending) return;
        const tempId = `temp-${Date.now()}`;
        const temp: MessageWithStatus = {
            id: tempId, from_user_id: user.id, to_user_id: selectedUser.id,
            payload: {} as Message['payload'], decryptedText: plaintext,
            created_at: new Date().toISOString(), delivered: false, status: 'sending',
        };
        const cur = messages.get(selectedUser.id) || [];
        setMessages(selectedUser.id, [...cur, temp]);
        scrollToBottom();
        setIsSending(true);
        try {
            let recipientPK: CryptoKey;
            if (selectedUser.public_key) { recipientPK = await importPublicKey(selectedUser.public_key); }
            else {
                const pkb = await getUserPublicKey(selectedUser.id);
                recipientPK = await importPublicKey(pkb);
                selectedUser.public_key = pkb;
            }
            const payload = await hybridEncrypt(plaintext, recipientPK, publicKey);
            const wsSent = wsSend(payload);
            if (!wsSent) await sendMessageAPI(selectedUser.id, payload);
            const updated = (messages.get(selectedUser.id) || []).map(m =>
                m.id === tempId ? { ...m, status: wsSent ? 'delivered' : 'sent' } : m
            );
            setMessages(selectedUser.id, updated);
            if (!conversations.find(c => c.user_id === selectedUser.id)) {
                setConversations([{
                    user_id: selectedUser.id, display_name: selectedUser.display_name,
                    username: selectedUser.username, last_message_at: new Date().toISOString(),
                }, ...conversations]);
            }
        } catch (e) {
            const updated = (messages.get(selectedUser.id) || []).map(m =>
                m.id === tempId ? { ...m, decryptedText: '[Failed to send]', status: 'sent' } : m
            );
            setMessages(selectedUser.id, updated);
            console.error('Failed to send:', e);
        } finally { setIsSending(false); }
    };

    const handleSendFromInput = () => {
        if (messageInput.trim()) { handleSendMessage(messageInput); setMessageInput(''); }
    };

    const handleLogout = async () => { await logout(); clearAuth(); navigate('/login'); };

    const currentMessages = (messages.get(selectedUser?.id || '') || []) as MessageWithStatus[];
    const hasMessages = currentMessages.length > 0;
    const hasConversations = conversations.length > 0;

    const handleTyping = () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUsers([]), 2000);
    };

    // Sidebar content (shared between desktop + mobile)
    const sidebarContent = (
        <>
            {/* User profile */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Avatar name={user?.display_name || 'U'} size="md" />
                        <div>
                            <h2 className="font-semibold text-[var(--text-primary)] text-sm">{user?.display_name}</h2>
                            <p className="text-[11px] text-[var(--text-muted)]">@{user?.username}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {isConnected ? (
                            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/20">
                                <Wifi className="w-3 h-3" />
                                <span className="text-[10px] font-semibold">Live</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">
                                <WifiOff className="w-3 h-3" />
                                <span className="text-[10px] font-semibold">REST</span>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg hover:bg-red-500/10 transition-all group"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 text-[var(--text-muted)] group-hover:text-red-400 transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="input-dark pl-10 py-2.5 text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-3 space-y-1 max-h-52 overflow-y-auto">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1 mb-2">Results</p>
                        {searchResults.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => handleSelectUser(r)}
                                className="w-full p-2.5 text-left hover:bg-[var(--bg-hover)] rounded-xl transition-all flex items-center gap-3"
                            >
                                <Avatar name={r.display_name} size="sm" />
                                <div>
                                    <p className="font-medium text-sm text-[var(--text-primary)]">{r.display_name}</p>
                                    <p className="text-[11px] text-[var(--text-muted)]">@{r.username}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
                {isLoadingConversations ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : !hasConversations ? (
                    <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4">
                            <MessageSquare className="w-7 h-7 text-[var(--accent-primary)]" />
                        </div>
                        <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">No conversations yet</p>
                        <p className="text-xs text-[var(--text-muted)]">Search for users above to start chatting</p>
                    </div>
                ) : (
                    <ConversationList
                        conversations={conversations}
                        currentConversationId={currentConversation?.user_id || null}
                        onSelectConversation={(conv) => {
                            const ud = knownUsers.get(conv.user_id);
                            handleSelectUser(ud || {
                                id: conv.user_id, display_name: conv.display_name,
                                username: conv.username, public_key: '', created_at: '',
                            });
                        }}
                        onStartNewChat={() => {}}
                    />
                )}
            </div>
        </>
    );

    return (
        <div className="h-screen flex bg-[var(--bg-primary)]">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:w-80 flex-col sidebar">
                {sidebarContent}
            </div>

            {/* Mobile Sidebar */}
            <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Conversations">
                {sidebarContent}
            </MobileSidebar>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                {selectedUser ? (
                    <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-4 py-3 flex items-center gap-3">
                        <MobileMenuButton isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                        <Avatar name={selectedUser.display_name} size="md" />
                        <div className="flex-1">
                            <h2 className="font-semibold text-[var(--text-primary)] text-sm">{selectedUser.display_name}</h2>
                            <p className="text-[11px] text-[var(--text-muted)]">@{selectedUser.username}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20">
                            <Shield className="w-3 h-3" />
                            <span className="text-[10px] font-bold tracking-wide">E2EE</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-4 py-3 flex items-center gap-3">
                        <MobileMenuButton isOpen={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="font-semibold text-[var(--text-primary)]">WhisperBox</h2>
                            <p className="text-[11px] text-[var(--text-muted)]">Secure end-to-end encrypted messaging</p>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 chat-pattern">
                    {!selectedUser ? (
                        <EmptyState type="welcome" action={() => {}} />
                    ) : isLoading ? (
                        <div className="flex flex-col justify-center items-center h-full gap-3">
                            <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-[var(--text-muted)]">Decrypting messages...</p>
                        </div>
                    ) : !hasMessages ? (
                        <EmptyState type="no-messages" action={() => inputRef.current?.focus()} />
                    ) : (
                        <>
                            {/* E2EE Banner */}
                            <div className="flex justify-center mb-5">
                                <div className="flex items-center gap-2 bg-[var(--accent-primary)]/8 border border-[var(--accent-primary)]/15 text-[var(--text-secondary)] px-4 py-2 rounded-full text-xs">
                                    <Lock className="w-3 h-3 text-[var(--accent-primary)]" />
                                    <span>Messages are end-to-end encrypted</span>
                                </div>
                            </div>

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

                {/* Typing */}
                <TypingIndicator typers={typingUsers} />

                {/* Input */}
                {selectedUser && (
                    <div className="bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] p-4">
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        handleTyping();
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendFromInput();
                                        }
                                    }}
                                    placeholder={`Message ${selectedUser.display_name}...`}
                                    className="input-dark pr-10 py-3"
                                />
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500/50" />
                            </div>
                            <button
                                onClick={handleSendFromInput}
                                disabled={isSending || !messageInput.trim()}
                                className="btn-accent p-3 rounded-xl flex items-center justify-center"
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