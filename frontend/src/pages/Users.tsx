import { useEffect, useState } from 'react';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/DataTable';
import type { ColumnConfig } from '@/components/DataTable';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus, Loader2, Search } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { usePermission } from '@/contexts/PermissionContext';
import { toast } from 'sonner';

// ========== 类型定义 ==========
interface User {
    id: number;
    username: string;
    email: string | null;
    createTime: string;
    isActive: boolean;
}

interface CreateUserRequest {
    username: string;
    password: string;
    email?: string;
    isActive?: boolean;
    roleIds?: number[];
}

interface UpdateUserRequest {
    username?: string;
    password?: string;
    email?: string;
    isActive?: boolean;
}

interface Role {
    id: number;
    name: string;
    description?: string | null;
}

// ========== 主组件 ==========
export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { hasPermission } = usePermission();

    // 分页与搜索
    const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
    const [searchKeyword, setSearchKeyword] = useState('');

    // 角色列表（用于下拉选择）
    const [allRoles, setAllRoles] = useState<Role[]>([]);

    // 新增/编辑弹窗
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        isActive: true,
        roleIds: [] as number[],
    });
    const [submitting, setSubmitting] = useState(false);

    // 删除确认弹窗
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ========== 获取数据 ==========
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
            setPagination(p => ({ ...p, total: response.data.length }));
        } catch (err: any) {
            setError(err.response?.data?.message || '获取用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllRoles = async () => {
        try {
            const response = await api.get('/api/roles');
            setAllRoles(response.data);
        } catch (error) {
            console.error('获取角色列表失败:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchAllRoles();
    }, []);

    // ========== 筛选与分页 ==========
    const filteredUsers = users.filter(
        (user) =>
            user.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchKeyword.toLowerCase())
    );

    const pagedUsers = filteredUsers.slice(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize
    );

    const tablePagination = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: filteredUsers.length,
        onPageChange: (page: number, pageSize: number) =>
            setPagination({ page, pageSize, total: filteredUsers.length }),
    };

    // ========== 列定义 ==========
    const columns: ColumnConfig<User>[] = [
        { key: 'id', title: 'ID', width: '80px' },
        { key: 'username', title: '用户名', className: 'font-medium' },
        { key: 'email', title: '邮箱', render: (val) => val || '-' },
        { key: 'createTime', title: '创建时间', render: (val) => new Date(val).toLocaleDateString('zh-CN') },
        {
            key: 'isActive',
            title: '状态',
            render: (val) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${val
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                        }`}
                >
                    {val ? '启用' : '禁用'}
                </span>
            )
        }
    ];

    // ========== 弹窗逻辑 ==========
    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ username: '', password: '', email: '', isActive: true, roleIds: [] });
        setDialogOpen(true);
    };

    const handleOpenEdit = async (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            email: user.email || '',
            isActive: user.isActive,
            roleIds: [],
        });

        try {
            const response = await api.get(`/api/users/${user.id}/roles`);
            const userRoles = response.data;
            setFormData(prev => ({
                ...prev,
                roleIds: userRoles.map((r: any) => r.id)
            }));
        } catch (error) {
            console.error('获取用户角色失败:', error);
        }

        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (editingUser) {
                const updateData: UpdateUserRequest = {
                    username: formData.username,
                    email: formData.email || undefined,
                    isActive: formData.isActive,
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await api.put(`/api/users/${editingUser.id}`, updateData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                await api.post(`/api/users/${editingUser.id}/roles`, {
                    roleIds: formData.roleIds
                });
            } else {
                const createData: CreateUserRequest = {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email || undefined,
                    isActive: formData.isActive,
                    roleIds: formData.roleIds,
                };
                await api.post('/api/users', createData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            toast.success(editingUser ? '修改成功' : '创建成功');
            setDialogOpen(false);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDelete = (user: User) => {
        setDeletingUser(user);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingUser) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/api/users/${deletingUser.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('删除成功');
            setDeleteDialogOpen(false);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '删除失败');
        } finally {
            setDeleting(false);
            setDeletingUser(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-3">
            {error && <div className="text-destructive text-sm bg-destructive/10 p-4 rounded-lg">{error}</div>}

            <DataTable
                columns={columns}
                data={pagedUsers}
                loading={loading}
                rowKey="id"
                pagination={tablePagination}
                toolbar={
                    <>
                        {hasPermission('user:create') && (
                            <Button size="sm" onClick={handleOpenCreate}>
                                <Plus className="mr-1.5 h-4 w-4" /> 新增用户
                            </Button>
                        )}
                        <div className="relative w-64 ml-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索用户名或邮箱..."
                                value={searchKeyword}
                                onChange={(e) => {
                                    setSearchKeyword(e.target.value);
                                    setPagination(p => ({ ...p, page: 1 }));
                                }}
                                className="h-9 pl-9"
                            />
                        </div>
                    </>
                }
                actions={(record) => (
                    <>
                        {hasPermission('user:edit') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(record)}
                                className="text-primary h-8 px-2"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        {hasPermission('user:delete') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDelete(record)}
                                className="text-destructive h-8 px-2"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </>
                )}
            />

            {/* 弹窗部分完全保持原样 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? '修改用户信息，密码留空表示不修改。' : '填写以下信息创建新用户。'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="edit-username">用户名 *</Label>
                            <Input
                                id="edit-username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="请输入用户名"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="edit-password">
                                {editingUser ? '密码（留空不修改）' : '密码 *'}
                            </Label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={editingUser ? '留空表示不修改' : '请输入密码'}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="edit-email">邮箱</Label>
                            <Input
                                id="edit-email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="请输入邮箱（可选）"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>角色</Label>
                            <MultiSelect
                                options={allRoles.map((role) => ({
                                    value: String(role.id),
                                    label: role.name || role.description || '角色',
                                }))}
                                value={formData.roleIds.map(String)}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        roleIds: value.map((id) => Number(id)),
                                    })
                                }
                                placeholder="请选择角色"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 rounded"
                            />
                            <Label htmlFor="edit-isActive" className="text-sm font-normal">
                                启用状态
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSave} disabled={submitting || !formData.username.trim()}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingUser ? '保存修改' : '创建用户'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除用户 <strong>{deletingUser?.username}</strong> 吗？此操作不可撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}