import type { Message, Conversation, User } from '../types';

export function buildConversationsFromMessages(
    messagesByUser: Map<string, Message[]>,
    users: Map<string, User>
): Conversation[] {
    const conversations: Conversation[] = [];

    for (const [userId, userMessages] of messagesByUser.entries()) {
        const user = users.get(userId);
        if (!user) continue;

        const lastMessage = userMessages[0]; // newest first
        conversations.push({
            user_id: userId,
            display_name: user.display_name,
            username: user.username,
            last_message_at: lastMessage?.created_at || null,
        });
    }

    // Sort by most recent message
    return conversations.sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });
}

export function updateConversationFromMessage(
    conversations: Conversation[],
    message: Message,
    user: User
): Conversation[] {
    const existingIndex = conversations.findIndex(c => c.user_id === message.from_user_id);
    const newConversation: Conversation = {
        user_id: message.from_user_id,
        display_name: user.display_name,
        username: user.username,
        last_message_at: message.created_at,
    };

    if (existingIndex >= 0) {
        // Update existing
        const updated = [...conversations];
        updated[existingIndex] = newConversation;
        return updated.sort((a, b) =>
            new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
        );
    } else {
        // Add new
        return [newConversation, ...conversations];
    }
}