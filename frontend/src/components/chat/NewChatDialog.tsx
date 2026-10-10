import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/api';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Search, User } from 'lucide-react';
import { getFullUrl } from '@/lib/upload';
import { cn } from '@/lib/utils';

interface ChatUser {
    id: number;
    username: string;
    avatar?: string;
}

interface NewChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (conversationId: number) => void;
}

export function NewChatDialog({ open, onOpenChange, onCreated }: NewChatDialogProps) {
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isGroup, setIsGroup] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 打开时加载用户
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setKeyword('');
        setSelectedIds([]);
        setGroupName('');
        setIsGroup(false);
        api.get('/api/chat/users')
            .then((res) => setUsers(res.data))
            .catch(() => toast.error('加载用户失败'))
            .finally(() => setLoading(false));
    }, [open]);

    const filteredUsers = users.filter((u) =>
        !keyword || u.username.toLowerCase().includes(keyword.toLowerCase())
    );

    const toggleUser = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) {
            toast.error('请选择至少一个用户');
            return;
        }

        // 单聊：只能选一个人
        if (!isGroup && selectedIds.length !== 1) {
            toast.error('单聊只能选择一位用户');
            return;
        }

        // 群聊：至少 2 个人
        if (isGroup && selectedIds.length < 2) {
            toast.error('群聊至少选择 2 位用户');
            return;
        }

        setSubmitting(true);
        try {
            const payload = isGroup
                ? { memberIds: selectedIds, name: groupName || '群聊' }
                : { peerUserId: selectedIds[0] };

            const res = await api.post('/api/chat/conversations', payload);
            toast.success('会话已创建');
            onOpenChange(false);
            onCreated?.(res.data.id);
        } catch (err: any) {
            toast.error(err.response?.data?.message || '创建失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>发起新会话</DialogTitle>
                    <DialogDescription>选择聊天对象</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {/* 单聊 / 群聊切换 */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsGroup(false)}
                            className={cn(
                                'flex-1 py-2 rounded-md border-2 text-sm transition-all',
                                !isGroup
                                    ? 'border-primary bg-primary/5 text-primary font-medium'
                                    : 'border-border text-muted-foreground'
                            )}
                        >
                            单聊
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsGroup(true)}
                            className={cn(
                                'flex-1 py-2 rounded-md border-2 text-sm transition-all',
                                isGroup
                                    ? 'border-primary bg-primary/5 text-primary font-medium'
                                    : 'border-border text-muted-foreground'
                            )}
                        >
                            群聊
                        </button>
                    </div>

                    {/* 群聊名称 */}
                    {isGroup && (
                        <div className="space-y-1.5">
                            <Label>群聊名称</Label>
                            <Input
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="可选，默认「群聊」"
                            />
                        </div>
                    )}

                    {/* 搜索 */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索用户..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* 用户列表 */}
                    <div className="border rounded-md max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                没有可聊天的用户
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredUsers.map((u) => {
                                    const checked = selectedIds.includes(u.id);
                                    return (
                                        <div
                                            key={u.id}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50',
                                                checked && 'bg-primary/5'
                                            )}
                                            onClick={() => toggleUser(u.id)}
                                        >
                                            {isGroup ? (
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={() => toggleUser(u.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <div className={cn(
                                                    'h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                                                    checked ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                                                )}>
                                                    {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                </div>
                                            )}
                                            <Avatar className="h-8 w-8 shrink-0">
                                                {u.avatar ? (
                                                    <img src={getFullUrl(u.avatar)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <span className="text-sm flex-1">{u.username}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 已选统计 */}
                    {selectedIds.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                            已选 {selectedIds.length} 位用户
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || selectedIds.length === 0}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        发起会话
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}