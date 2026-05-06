import { create } from 'zustand';
import type { User, Message, Conversation } from '../types';

interface CryptoState {
    privateKey: CryptoKey | null;
    publicKey: CryptoKey | null;
    setKeys: (privateKey: CryptoKey | null, publicKey: CryptoKey | null) => void;
}

interface MessageState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Map<string, Message[]>; // userId -> messages
    addMessage: (userId: string, message: Message) => void;
    setMessages: (userId: string, messages: Message[]) => void;
    setConversations: (conversations: Conversation[]) => void;
    setCurrentConversation: (conversation: Conversation | null) => void;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
    privateKey: null,
    publicKey: null,
    setKeys: (privateKey, publicKey) => set({ privateKey, publicKey }),
}));

export const useMessageStore = create<MessageState>((set) => ({
    conversations: [],
    currentConversation: null,
    messages: new Map(),
    addMessage: (userId, message) =>
        set((state) => {
            const newMessages = new Map(state.messages);
            const existing = newMessages.get(userId) || [];
            newMessages.set(userId, [...existing, message]);
            return { messages: newMessages };
        }),
    setMessages: (userId, messages) =>
        set((state) => {
            const newMessages = new Map(state.messages);
            newMessages.set(userId, messages);
            return { messages: newMessages };
        }),
    setConversations: (conversations) => set({ conversations }),
    setCurrentConversation: (currentConversation) => set({ currentConversation }),
}));

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    logout: () => {
        sessionStorage.clear();
        set({ user: null, isAuthenticated: false });
    },
}));