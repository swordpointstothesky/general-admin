import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import api from '@/api';
import { useChatHub } from '@/hooks/useChatHub';
import type { ChatMessage } from '@/hooks/useChatHub';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    MessageSquarePlus,
    Send,
    Image as ImageIcon,
    Paperclip,
    Loader2,
    FileText,
    X,
    Download,
} from 'lucide-react';
import { getFullUrl, uploadFile, uploadImage } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { NewChatDialog } from '@/components/chat/NewChatDialog';

interface ChatUser {
    id: number;
    username: string;
    avatar?: string;
}

interface Conversation {
    id: number;
    type: 'single' | 'group';
    name?: string;
    peer?: ChatUser;
    members: ChatUser[];
    lastMessageContent?: string;
    lastMessageTime?: string;
    unreadCount: number;
}

export default function Chat() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [newChatOpen, setNewChatOpen] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // 当前用户 ID
    const currentUserId = (() => {
        const token = localStorage.getItem('token');
        if (!token) return 0;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return parseInt(
                payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '0'
            );
        } catch {
            return 0;
        }
    })();

    // ===== SignalR =====
    const { connected, sendMessage, sendTyping, markRead, joinConversation } = useChatHub({
        onMessage: (msg) => {
            if (activeConv && msg.conversationId === activeConv.id) {
                setMessages((prev) => [...prev, msg]);
                if (msg.senderId !== currentUserId) {
                    markRead(activeConv.id, msg.id);
                }
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
            fetchConversations();
        },
        onTyping: (data) => {
            if (activeConv && data.conversationId === activeConv.id && data.userId !== currentUserId) {
                setTypingUsers((prev) => new Set(prev).add(data.userId));
                setTimeout(() => {
                    setTypingUsers((prev) => {
                        const next = new Set(prev);
                        next.delete(data.userId);
                        return next;
                    });
                }, 3000);
            }
        },
    });

    // ===== 加载会话列表 =====
    const fetchConversations = async () => {
        try {
            const res = await api.get('/api/chat/conversations');
            setConversations(res.data);
        } catch {
            toast.error('加载会话失败');
        } finally {
            setLoading(false);
        }
    };

    // ===== 加载消息 =====
    const fetchMessages = async (conversationId: number) => {
        setLoadingMsgs(true);
        try {
            const res = await api.get(`/api/chat/conversations/${conversationId}/messages`, {
                params: { pageSize: 50 },
            });
            setMessages(res.data.items);
            if (res.data.items.length > 0) {
                const lastMsg = res.data.items[res.data.items.length - 1];
                markRead(conversationId, lastMsg.id);
            }
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
        } catch {
            toast.error('加载消息失败');
        } finally {
            setLoadingMsgs(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (activeConv) {
            fetchMessages(activeConv.id);
            setTypingUsers(new Set());
        }
    }, [activeConv?.id]);

    // ===== 发送文本 =====
    const handleSendText = async () => {
        if (!activeConv || !inputText.trim() || sending) return;
        const text = inputText.trim();
        setInputText('');
        setSending(true);
        try {
            await sendMessage({
                conversationId: activeConv.id,
                contentType: 'text',
                content: text,
            });
        } catch {
            toast.error('发送失败');
            setInputText(text);
        } finally {
            setSending(false);
        }
    };

    // ===== 发送图片 =====
    const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !activeConv) return;
        if (!file.type.startsWith('image/')) {
            toast.error('请选择图片');
            return;
        }
        setSending(true);
        try {
            const result = await uploadImage(file);
            await sendMessage({
                conversationId: activeConv.id,
                contentType: 'image',
                fileUrl: result.url,
                fileName: result.fileName,
                fileSize: result.size,
            });
        } catch (err: any) {
            toast.error(err.response?.data?.message || '图片发送失败');
        } finally {
            setSending(false);
        }
    };

    // ===== 发送文件 =====
    const handleSendFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !activeConv) return;
        if (file.size > 20 * 1024 * 1024) {
            toast.error('文件不能超过 20MB');
            return;
        }
        setSending(true);
        try {
            const result = await uploadFile(file);
            await sendMessage({
                conversationId: activeConv.id,
                contentType: 'file',
                fileUrl: result.url,
                fileName: result.fileName,
                fileSize: result.size,
            });
        } catch (err: any) {
            toast.error(err.response?.data?.message || '文件发送失败');
        } finally {
            setSending(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (activeConv) sendTyping(activeConv.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    // ===== 会话显示辅助 =====
    const getConvTitle = (conv: Conversation) => {
        if (conv.type === 'group') return conv.name || '群聊';
        return conv.peer?.username || '未知';
    };

    const getConvAvatar = (conv: Conversation) => {
        if (conv.type === 'group') return null;
        return conv.peer?.avatar;
    };

    const formatTime = (time?: string) => {
        if (!time) return '';
        const date = new Date(time);
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes} 分钟前`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} 小时前`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} 天前`;
        return date.toLocaleDateString('zh-CN');
    };

    const formatMessageTime = (time: string) => {
        const d = new Date(time);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const formatFileSize = (size?: number) => {
        if (!size) return '';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / 1024 / 1024).toFixed(1)} MB`;
    };

    // ===== 渲染 =====
    return (
        <div className="flex h-full gap-3">
            {/* ===== 左侧：会话列表 ===== */}
            <div className="w-72 rounded-lg bg-background ring-1 ring-border shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                    <span className="font-medium text-sm">消息</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setNewChatOpen(true)}
                        title="发起新会话"
                    >
                        <MessageSquarePlus className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-sm text-muted-foreground mb-2">暂无会话</p>
                            <Button size="sm" onClick={() => setNewChatOpen(true)}>
                                发起新会话
                            </Button>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const avatarUrl = getFullUrl(getConvAvatar(conv));
                            const isActive = activeConv?.id === conv.id;
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setActiveConv(conv)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b',
                                        isActive ? 'bg-primary/10' : 'hover:bg-muted/50'
                                    )}
                                >
                                    <Avatar className="h-10 w-10 shrink-0">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                                                {getConvTitle(conv).charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium truncate">
                                                {getConvTitle(conv)}
                                            </span>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatTime(conv.lastMessageTime)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground truncate">
                                                {conv.lastMessageContent || '暂无消息'}
                                            </span>
                                            {conv.unreadCount > 0 && (
                                                <Badge className="h-4 min-w-[16px] px-1 text-[10px] shrink-0">
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ===== 右侧：聊天窗口 ===== */}
            <div className="flex-1 rounded-lg bg-background ring-1 ring-border shadow-sm flex flex-col overflow-hidden">
                {!activeConv ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">选择一个会话开始聊天</p>
                    </div>
                ) : (
                    <>
                        {/* 头部 */}
                        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    {getFullUrl(getConvAvatar(activeConv)) ? (
                                        <img
                                            src={getFullUrl(getConvAvatar(activeConv))}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                            {getConvTitle(activeConv).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium">{getConvTitle(activeConv)}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {typingUsers.size > 0
                                            ? '对方正在输入...'
                                            : connected
                                                ? '在线'
                                                : '连接中...'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 消息列表 */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingMsgs ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    暂无消息，发送第一条吧
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMine = msg.senderId === currentUserId;
                                    const avatarUrl = getFullUrl(msg.senderAvatar);
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                'flex gap-2.5',
                                                isMine ? 'flex-row-reverse' : 'flex-row'
                                            )}
                                        >
                                            <Avatar className="h-8 w-8 shrink-0">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                                        {msg.senderName.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>

                                            <div className={cn('max-w-[70%]', isMine && 'items-end')}>
                                                {/* 发送者 + 时间 */}
                                                <div className={cn(
                                                    'flex items-center gap-2 mb-1 text-xs text-muted-foreground',
                                                    isMine && 'flex-row-reverse'
                                                )}>
                                                    {!isMine && activeConv.type === 'group' && (
                                                        <span>{msg.senderName}</span>
                                                    )}
                                                    <span>{formatMessageTime(msg.createTime)}</span>
                                                </div>

                                                {/* 消息内容 */}
                                                {msg.contentType === 'text' && (
                                                    <div className={cn(
                                                        'inline-block px-3 py-2 rounded-lg text-sm break-all',
                                                        isMine
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                )}

                                                {msg.contentType === 'image' && (
                                                    <div
                                                        className="rounded-lg overflow-hidden border cursor-pointer max-w-[240px]"
                                                        onClick={() => setPreviewImage(getFullUrl(msg.fileUrl))}
                                                    >
                                                        <img
                                                            src={getFullUrl(msg.fileUrl)}
                                                            alt=""
                                                            className="w-full h-auto"
                                                        />
                                                    </div>
                                                )}

                                                {msg.contentType === 'file' && (
                                                    <a
                                                        href={getFullUrl(msg.fileUrl)}
                                                        download={msg.fileName}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={cn(
                                                            'flex items-center gap-3 px-3 py-2 rounded-lg border max-w-[280px]',
                                                            isMine ? 'bg-primary/5' : 'bg-muted/50'
                                                        )}
                                                    >
                                                        <div className="h-10 w-10 rounded bg-background flex items-center justify-center shrink-0">
                                                            <FileText className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm truncate">{msg.fileName}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatFileSize(msg.fileSize)}
                                                            </div>
                                                        </div>
                                                        <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* 输入框 */}
                        <div className="border-t p-3 pr-16 shrink-0">
                            <div className="flex items-end gap-2">
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleSendImage}
                                />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleSendFile}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={sending}
                                    title="发送图片"
                                >
                                    <ImageIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={sending}
                                    title="发送文件"
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                                <Input
                                    value={inputText}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="输入消息，按 Enter 发送"
                                    disabled={sending}
                                    className="flex-1 h-9"
                                />
                                <Button
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={handleSendText}
                                    disabled={sending || !inputText.trim()}
                                >
                                    {sending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 新建会话弹窗 */}
            <NewChatDialog
                open={newChatOpen}
                onOpenChange={setNewChatOpen}
                onCreated={(id) => {
                    fetchConversations();
                    // 稍微延迟一下，等会话列表刷新后再选中
                    setTimeout(() => {
                        const conv = conversations.find((c) => c.id === id);
                        if (conv) setActiveConv(conv);
                    }, 200);
                }}
            />

            {/* 图片预览 */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <img
                        src={previewImage}
                        alt=""
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}