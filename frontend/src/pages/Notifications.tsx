import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublishDialog } from '@/components/notifications/PublishDialog';
import { Info, CheckCircle2, AlertTriangle, XCircle, Trash2, CheckCheck, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

export default function Notifications() {
    const [items, setItems] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [clearOpen, setClearOpen] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/notifications', {
                params: { page: 1, pageSize: 100 },
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
        fetchItems();
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            toast.error('操作失败');
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

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/api/notifications/${id}`);
            setItems((prev) => prev.filter((n) => n.id !== id));
            toast.success('已删除');
        } catch {
            toast.error('删除失败');
        }
    };

    const handleClearAll = async () => {
        try {
            await api.delete('/api/notifications/clear-all');
            setItems([]);
            setUnreadCount(0);
            setClearOpen(false);
            toast.success('已清空');
        } catch {
            toast.error('操作失败');
        }
    };

    const formatTime = (time: string) => {
        return new Date(time).toLocaleString('zh-CN');
    };

    return (
        <div className="flex flex-col h-full gap-3">
            {/* 头部 */}
            <div className="rounded-lg bg-background p-4 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold">消息通知</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        共 {items.length} 条，{unreadCount} 条未读
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setPublishOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        发布通知
                    </Button>
                    {unreadCount > 0 && (

                        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                            <CheckCheck className="mr-1.5 h-4 w-4" />
                            全部已读
                        </Button>
                    )}
                    {items.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setClearOpen(true)}>
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            清空
                        </Button>
                    )}
                </div>
            </div>

            {/* 列表 */}
            <div className="flex-1 rounded-lg bg-background overflow-auto">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 text-sm text-muted-foreground">
                        暂无通知
                    </div>
                ) : (
                    <div className="divide-y">
                        {items.map((item) => {
                            const Icon = typeIcons[item.type] || Info;
                            const colorClass = typeColors[item.type] || typeColors.info;
                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'group flex gap-4 px-6 py-4 hover:bg-muted/30 transition-colors',
                                        !item.isRead && 'bg-primary/5'
                                    )}
                                >
                                    <div className={cn(
                                        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                                        colorClass
                                    )}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'text-sm',
                                                !item.isRead && 'font-medium'
                                            )}>
                                                {item.title}
                                            </span>
                                            {!item.isRead && (
                                                <Badge variant="default" className="text-xs h-5">未读</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {item.content}
                                        </p>
                                        <span className="text-xs text-muted-foreground mt-2 inline-block">
                                            {formatTime(item.createTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        {!item.isRead && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2 text-primary"
                                                onClick={() => handleMarkAsRead(item.id)}
                                                title="标记已读"
                                            >
                                                <CheckCheck className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-destructive"
                                            onClick={() => handleDelete(item.id)}
                                            title="删除"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认清空</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要清空所有通知吗？此操作不可撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearAll}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            确认清空
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PublishDialog
                open={publishOpen}
                onOpenChange={setPublishOpen}
                onSuccess={fetchItems}
            />
        </div>

    );
}