import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/api';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info, CheckCircle2, AlertTriangle, XCircle, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserItem {
    id: number;
    username: string;
}

interface PublishDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const TYPES = [
    { value: 'info', label: '普通', icon: Info, color: 'text-blue-500 border-blue-200 bg-blue-50' },
    { value: 'success', label: '成功', icon: CheckCircle2, color: 'text-green-600 border-green-200 bg-green-50' },
    { value: 'warning', label: '警告', icon: AlertTriangle, color: 'text-orange-500 border-orange-200 bg-orange-50' },
    { value: 'error', label: '错误', icon: XCircle, color: 'text-red-500 border-red-200 bg-red-50' },
];

export function PublishDialog({ open, onOpenChange, onSuccess }: PublishDialogProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('info');
    const [link, setLink] = useState('');
    const [sendToAll, setSendToAll] = useState(true);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 打开时加载用户列表
    useEffect(() => {
        if (!open) return;
        setLoadingUsers(true);
        api.get('/api/users')
            .then((res) => setUsers(res.data))
            .catch(() => toast.error('加载用户列表失败'))
            .finally(() => setLoadingUsers(false));
    }, [open]);

    // 每次打开时重置表单
    useEffect(() => {
        if (open) {
            setTitle('');
            setContent('');
            setType('info');
            setLink('');
            setSendToAll(true);
            setSelectedUserIds([]);
        }
    }, [open]);

    const handleToggleUser = (id: number) => {
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error('请输入标题');
            return;
        }
        if (!content.trim()) {
            toast.error('请输入内容');
            return;
        }
        if (!sendToAll && selectedUserIds.length === 0) {
            toast.error('请选择至少一个接收人');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/api/notifications/publish', {
                title: title.trim(),
                content: content.trim(),
                type,
                link: link.trim() || null,
                sendToAll,
                userIds: sendToAll ? null : selectedUserIds,
            });
            toast.success(res.data.message || '发布成功');
            onOpenChange(false);
            onSuccess?.();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '发布失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>发布通知</DialogTitle>
                    <DialogDescription>选择接收人和通知内容</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* 标题 */}
                    <div className="space-y-1.5">
                        <Label>标题 *</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="请输入通知标题"
                            maxLength={200}
                        />
                    </div>

                    {/* 类型 */}
                    <div className="space-y-1.5">
                        <Label>类型</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {TYPES.map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setType(t.value)}
                                        className={cn(
                                            'flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border-2 text-sm transition-all',
                                            type === t.value
                                                ? t.color
                                                : 'border-border text-muted-foreground hover:border-primary/50'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 内容 */}
                    <div className="space-y-1.5">
                        <Label>内容 *</Label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="请输入通知内容"
                            rows={4}
                            className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    {/* 跳转链接 */}
                    <div className="space-y-1.5">
                        <Label>跳转链接（可选）</Label>
                        <Input
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="如 /students，点击通知跳转到该页面"
                        />
                    </div>

                    {/* 接收人 */}
                    <div className="space-y-2">
                        <Label>接收人</Label>

                        {/* 快捷选项 */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSendToAll(true)}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border-2 text-sm transition-all',
                                    sendToAll
                                        ? 'border-primary bg-primary/5 text-primary font-medium'
                                        : 'border-border text-muted-foreground hover:border-primary/50'
                                )}
                            >
                                <Users className="h-4 w-4" />
                                全体用户
                            </button>
                            <button
                                type="button"
                                onClick={() => setSendToAll(false)}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border-2 text-sm transition-all',
                                    !sendToAll
                                        ? 'border-primary bg-primary/5 text-primary font-medium'
                                        : 'border-border text-muted-foreground hover:border-primary/50'
                                )}
                            >
                                <User className="h-4 w-4" />
                                指定用户
                            </button>
                        </div>

                        {/* 用户多选列表 */}
                        {!sendToAll && (
                            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                                {loadingUsers ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="text-sm text-muted-foreground text-center py-4">
                                        暂无用户
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {users.map((u) => (
                                            <div key={u.id} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`user-${u.id}`}
                                                    checked={selectedUserIds.includes(u.id)}
                                                    onCheckedChange={() => handleToggleUser(u.id)}
                                                />
                                                <Label
                                                    htmlFor={`user-${u.id}`}
                                                    className="text-sm cursor-pointer font-normal flex-1"
                                                >
                                                    {u.username}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 已选统计 */}
                        {!sendToAll && selectedUserIds.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                                已选 <Badge variant="secondary">{selectedUserIds.length}</Badge> 位用户
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        发布通知
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}