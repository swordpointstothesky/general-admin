import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export interface ChatMessage {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatar?: string;
    contentType: 'text' | 'image' | 'file';
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    createTime: string;
}

interface UseChatHubOptions {
    onMessage?: (msg: ChatMessage) => void;
    onTyping?: (data: { conversationId: number; userId: number }) => void;
    onRead?: (data: { conversationId: number; userId: number; lastMessageId: number }) => void;
}

export function useChatHub(options: UseChatHubOptions = {}) {
    const [connected, setConnected] = useState(false);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        // 开发环境走 Vite 代理时，用相对路径 + ws 代理
        const hubUrl = apiBase ? `${apiBase}/hubs/chat` : `/hubs/chat`;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => localStorage.getItem('token') || '',
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connection.on('ReceiveMessage', (msg: ChatMessage) => {
            optionsRef.current.onMessage?.(msg);
        });

        connection.on('UserTyping', (data: any) => {
            optionsRef.current.onTyping?.(data);
        });

        connection.on('UserRead', (data: any) => {
            optionsRef.current.onRead?.(data);
        });

        connection.onreconnected(() => setConnected(true));
        connection.onclose(() => setConnected(false));

        connection
            .start()
            .then(() => setConnected(true))
            .catch((err) => console.error('SignalR 连接失败:', err));

        connectionRef.current = connection;

        return () => {
            connection.stop();
        };
    }, []);

    const sendMessage = async (request: {
        conversationId: number;
        contentType: string;
        content?: string;
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
    }): Promise<ChatMessage | null> => {
        if (!connectionRef.current) return null;
        try {
            return await connectionRef.current.invoke('SendMessage', request);
        } catch (err) {
            console.error('发送失败:', err);
            return null;
        }
    };

    const sendTyping = async (conversationId: number) => {
        try {
            await connectionRef.current?.invoke('Typing', conversationId);
        } catch { /* 忽略 */ }
    };

    const markRead = async (conversationId: number, lastMessageId: number) => {
        try {
            await connectionRef.current?.invoke('MarkRead', conversationId, lastMessageId);
        } catch { /* 忽略 */ }
    };

    const joinConversation = async (conversationId: number) => {
        try {
            await connectionRef.current?.invoke('JoinConversation', conversationId);
        } catch { /* 忽略 */ }
    };

    return { connected, sendMessage, sendTyping, markRead, joinConversation };
}