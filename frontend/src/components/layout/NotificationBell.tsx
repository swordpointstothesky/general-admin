import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, Trash2, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Notification {
    id: number;
    title: string;
    content: string;
    type: string;
    link?: string;
    isRead: boolean;
    createTime: string;
}

const typeIcons: Record<string, any> = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
};

const typeColors: Record<string, string> = {
    info: 'text-blue-500 bg-blue-50',
    success: 'text-green-600 bg-green-50',
    warning: 'text-orange-500 bg-orange-50',
    error: 'text-red-500 bg-red-50',
};

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // 点击外部关闭
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // 加载未读数
    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/api/notifications/unread-count');
            setUnreadCount(res.data.count);
        } catch {
            // 静默
        }
    };

    // 加载列表（前 5 条）
    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/notifications', {
                params: { page: 1, pageSize: 5 },
            });
            setItems(res.data.items);
            setUnreadCount(res.data.unreadCount);
        } catch {
            toast.error('加载通知失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // 每 60 秒刷新未读数
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (open) fetchList();
    }, [open]);

    const handleItemClick = async (item: Notification) => {
        if (!item.isRead) {
            try {
                await api.put(`/api/notifications/${item.id}/read`);
                setItems((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((c) => Math.max(0, c - 1));
            } catch {
                // 忽略
            }
        }

        if (item.link) {
            navigate(item.link);
            setOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/api/notifications/read-all');
            setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('已全部标记为已读');
        } catch {
            toast.error('操作失败');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await api.delete(`/api/notifications/${id}`);
            setItems((prev) => prev.filter((n) => n.id !== id));
            fetchUnreadCount();
        } catch {
            toast.error('删除失败');
        }
    };

    const formatTime = (time: string) => {
        const date = new Date(time);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes} 分钟前`;
        if (hours < 24) return `${hours} 小时前`;
        if (days < 7) return `${days} 天前`;
        return date.toLocaleDateString('zh-CN');
    };

    return (
        <div className="relative" ref={ref}>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative"
                title="通知"
                onClick={() => setOpen((v) => !v)}
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            {open && (
                <div className="absolute right-0 top-10 w-96 bg-popover text-popover-foreground border rounded-md shadow-lg z-50 overflow-hidden">
                    {/* 头部 */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">通知</span>
                            {unreadCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {unreadCount} 条未读
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <CheckCheck className="h-3 w-3" />
                                全部已读
                            </button>
                        )}
                    </div>

                    {/* 列表 */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                加载中...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                暂无通知
                            </div>
                        ) : (
                            items.map((item) => {
                                const Icon = typeIcons[item.type] || Info;
                                const colorClass = typeColors[item.type] || typeColors.info;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        className={cn(
                                            'group flex gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors',
                                            !item.isRead && 'bg-primary/5'
                                        )}
                                    >
                                        <div className={cn(
                                            'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                                            colorClass
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className={cn(
                                                    'text-sm truncate',
                                                    !item.isRead && 'font-medium'
                                                )}>
                                                    {item.title}
                                                </span>
                                                {!item.isRead && (
                                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                {item.content}
                                            </p>
                                            <span className="text-xs text-muted-foreground mt-1 inline-block">
                                                {formatTime(item.createTime)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, item.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition text-muted-foreground hover:text-destructive shrink-0"
                                            title="删除"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* 底部 */}
                    <div className="border-t">
                        <button
                            onClick={() => {
                                navigate('/notifications');
                                setOpen(false);
                            }}
                            className="w-full py-2.5 text-sm text-center text-primary hover:bg-muted/50 transition"
                        >
                            查看全部通知
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}