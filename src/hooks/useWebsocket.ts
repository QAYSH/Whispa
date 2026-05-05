import { useEffect, useRef, useState, useCallback } from 'react';
import { hybridDecrypt } from '../crypto/hybrid';
import type { EncryptedPayload, Message } from '../types';

interface WebSocketMessage {
    type: string;
    payload: {
        from_user_id: string;
        payload: EncryptedPayload;
        created_at: string;
        id: string;
    };
}

interface UseWebSocketProps {
    token: string | null;
    privateKey: CryptoKey | null;
    currentUserId: string;
    onNewMessage: (message: Message) => void;
}

export function useWebSocket({ token, privateKey, currentUserId, onNewMessage }: UseWebSocketProps) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const connect = useCallback(() => {
        if (!token) return;

        const ws = new WebSocket(`wss://whisperbox.koyeb.app/ws?token=${token}`);

        ws.onopen = () => {
            console.log('🔌 WebSocket connected');
            setIsConnected(true);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };

        ws.onmessage = async (event) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                if (data.type === 'message.receive') {
                    const { from_user_id, payload, created_at, id } = data.payload;

                    // Decrypt the message
                    const isOwnMessage = from_user_id === currentUserId;
                    const decryptedText = await hybridDecrypt(payload, privateKey!, isOwnMessage);

                    const newMessage: Message = {
                        id,
                        from_user_id,
                        to_user_id: currentUserId,
                        payload,
                        decryptedText,
                        created_at,
                        delivered: true,
                    };

                    onNewMessage(newMessage);
                }
            } catch (error) {
                console.error('Failed to process WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket disconnected, reconnecting in 3s...');
            setIsConnected(false);
            reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
        };

        wsRef.current = ws;
    }, [token, privateKey, currentUserId, onNewMessage]);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [connect]);

    const sendMessage = useCallback((payload: EncryptedPayload) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'message.send',
                payload
            }));
            return true;
        }
        console.warn('WebSocket not connected, message not sent');
        return false;
    }, []);

    return { sendMessage, isConnected };
}