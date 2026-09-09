import { useEffect, useState } from 'react';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MultiSelect } from '@/components/ui/multi-select';

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

    // 搜索状态
    const [searchKeyword, setSearchKeyword] = useState('');

    // 新增状态
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

    // ========== 获取用户列表 ==========
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || '获取用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    // 获取角色列表
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

    // ========== 筛选（前端搜索） ==========
    const filteredUsers = users.filter(
        (user) =>
            user.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchKeyword.toLowerCase())
    );

    // ========== 打开新增弹窗 ==========
    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ username: '', password: '', email: '', isActive: true, roleIds: [] });
        setDialogOpen(true);
    };

    // ========== 打开编辑弹窗 ==========
    const handleOpenEdit = async (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            email: user.email || '',
            isActive: user.isActive,
            roleIds: [], // 先清空
        });

        // 获取用户已有角色
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

    // ========== 保存（新增/编辑） ==========
    const handleSave = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (editingUser) {
                // 编辑
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

                // 分配角色
                await api.post(`/api/users/${editingUser.id}/roles`, {
                    roleIds: formData.roleIds
                });
            } else {
                // 新增
                const createData: CreateUserRequest = {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email || undefined,
                    isActive: formData.isActive,
                    roleIds: formData.roleIds, // 创建时直接分配角色
                };
                await api.post('/api/users', createData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            setDialogOpen(false);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    // ========== 打开删除确认 ==========
    const handleOpenDelete = (user: User) => {
        setDeletingUser(user);
        setDeleteDialogOpen(true);
    };

    // ========== 确认删除 ==========
    const handleConfirmDelete = async () => {
        if (!deletingUser) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/api/users/${deletingUser.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDeleteDialogOpen(false);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || '删除失败');
        } finally {
            setDeleting(false);
            setDeletingUser(null);
        }
    };

    // ========== 渲染 ==========
    return (
        <Card>
            <div className="p-6 space-y-6">
                {/* 页面标题 + 操作栏 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
                        <p className="text-sm text-gray-500 mt-1">管理系统中的所有用户</p>
                    </div>
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        新增用户
                    </Button>
                </div>

                {/* 搜索框 */}
                <div className="max-w-sm">
                    <Input
                        placeholder="搜索用户名或邮箱..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                </div>

                {/* 表格 */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-500">{error}</div>
                ) : (
                    <div className="border rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">ID</TableHead>
                                    <TableHead>用户名</TableHead>
                                    <TableHead>邮箱</TableHead>
                                    <TableHead>创建时间</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                                            暂无用户数据
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.id}</TableCell>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>{user.email || '-'}</TableCell>
                                            <TableCell>
                                                {new Date(user.createTime).toLocaleDateString('zh-CN')}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-muted text-muted-foreground'
                                                        }`}
                                                >
                                                    {user.isActive ? '启用' : '禁用'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenDelete(user)}
                                                    className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* ===== 新增/编辑弹窗 ===== */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
                            <DialogDescription>
                                {editingUser
                                    ? '修改用户信息，密码留空表示不修改。'
                                    : '填写以下信息创建新用户。'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <Label htmlFor="edit-username">用户名 *</Label>
                                <Input
                                    id="edit-username"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
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
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    placeholder={editingUser ? '留空表示不修改' : '请输入密码'}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-email">邮箱</Label>
                                <Input
                                    id="edit-email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
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
                                    onChange={(e) =>
                                        setFormData({ ...formData, isActive: e.target.checked })
                                    }
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
                            <Button
                                onClick={handleSave}
                                disabled={submitting || !formData.username.trim()}
                                className=""
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingUser ? '保存修改' : '创建用户'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ===== 删除确认弹窗 ===== */}
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
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                确认删除
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </Card>

    );
}