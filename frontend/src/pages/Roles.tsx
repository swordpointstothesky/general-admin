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
    DialogTitle,
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
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react';

// ========== 类型定义 ==========
interface Permission {
    id: number;
    name: string;
    displayName: string;
    category?: string;
}

interface Role {
    id: number;
    name: string;
    description?: string;
    createTime: string;
    isActive: boolean;
    permissions: Permission[];
}

// ========== 主组件 ==========
export default function Roles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 弹窗状态
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissionIds: [] as number[],
    });
    const [submitting, setSubmitting] = useState(false);

    // 删除确认
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ========== 获取数据 ==========
    const fetchRoles = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');

            const [rolesRes, permsRes] = await Promise.all([
                api.get('/api/roles', { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/api/roles/permissions', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const roleList = Array.isArray(rolesRes.data) ? rolesRes.data : [];
            const permissionList = Array.isArray(permsRes.data) ? permsRes.data : [];

            setRoles(roleList);
            setPermissions(permissionList);
        } catch (err: any) {
            setError(err.response?.data?.message || '获取数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // ========== 打开新增弹窗 ==========
    const handleOpenCreate = () => {
        setEditingRole(null);
        setFormData({ name: '', description: '', permissionIds: [] });
        setDialogOpen(true);
    };

    // ========== 打开编辑弹窗 ==========
    const handleOpenEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            permissionIds: Array.isArray(role.permissions) ? role.permissions.map(p => p.id) : [],
        });
        setDialogOpen(true);
    };

    // ========== 保存 ==========
    const handleSave = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (editingRole) {
                await api.put(`/api/roles/${editingRole.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await api.post('/api/roles', formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            setDialogOpen(false);
            fetchRoles();
        } catch (err: any) {
            alert(err.response?.data?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    // ========== 删除 ==========
    const handleOpenDelete = (role: Role) => {
        setDeletingRole(role);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingRole) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            
            
            await api.delete(`/api/roles/${deletingRole.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDeleteDialogOpen(false);
            fetchRoles();
        } catch (err: any) {
            alert(err.response?.data?.message || '删除失败');
        } finally {
            setDeleting(false);
            setDeletingRole(null);
        }
    };

    // ========== 权限切换 ==========
    const togglePermission = (permId: number) => {
        setFormData(prev => ({
            ...prev,
            permissionIds: prev.permissionIds.includes(permId)
                ? prev.permissionIds.filter(id => id !== permId)
                : [...prev.permissionIds, permId],
        }));
    };

    // ========== 按分类分组 ==========
    const groupedPermissions = (Array.isArray(permissions) ? permissions : []).reduce((acc, p) => {
        const category = p.category || '其他';
        if (!acc[category]) acc[category] = [];
        acc[category].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

    // ========== 加载状态 ==========
    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">角色管理</h1>
                    <p className="text-sm text-gray-500 mt-1">管理系统角色与权限分配</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    新增角色
                </Button>
            </div>

            {/* 错误提示 */}
            {error && (
                <div className="text-red-500 text-sm bg-red-50 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* 表格 */}
            <div className="border rounded-xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>角色名称</TableHead>
                            <TableHead>描述</TableHead>
                            <TableHead>权限数</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                                    暂无角色数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>{role.id}</TableCell>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell>{role.description || '-'}</TableCell>
                                    <TableCell>{role.permissions?.length ?? 0}</TableCell>
                                    <TableCell>
                                        {new Date(role.createTime).toLocaleDateString('zh-CN')}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                role.isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {role.isActive ? '启用' : '禁用'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleOpenEdit(role)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleOpenDelete(role)}
                                            disabled={role.name === 'Admin'}
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

            {/* ===== 新增/编辑弹窗 ===== */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? '编辑角色' : '新增角色'}</DialogTitle>
                        <DialogDescription>
                            {editingRole ? '修改角色信息与权限分配' : '创建新角色并分配权限'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="role-name">角色名称 *</Label>
                            <Input
                                id="role-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="请输入角色名称"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="role-desc">描述</Label>
                            <Input
                                id="role-desc"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="请输入角色描述"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>权限分配</Label>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(groupedPermissions).map(([category, perms]) => (
                                            <div key={category} className="space-y-1">
                                                <div className="text-sm font-medium text-gray-600">{category}</div>
                                                {perms.map((perm) => (
                                                    <div key={perm.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`perm-${perm.id}`}
                                                            checked={formData.permissionIds.includes(perm.id)}
                                                            onCheckedChange={() => togglePermission(perm.id)}
                                                        />
                                                        <Label
                                                            htmlFor={`perm-${perm.id}`}
                                                            className="text-sm font-normal cursor-pointer"
                                                        >
                                                            {perm.displayName}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="text-xs text-gray-400">
                                已选 {formData.permissionIds.length} 个权限
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={submitting || !formData.name.trim()}
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingRole ? '保存修改' : '创建角色'}
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
                            确定要删除角色 <strong>{deletingRole?.name}</strong> 吗？
                            {deletingRole?.name === 'Admin' && ' 系统内置角色不可删除。'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deleting || deletingRole?.name === 'Admin'}
                            className={deletingRole?.name === 'Admin' ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'}
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