import { useEffect, useState } from 'react';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/DataTable';
import type { ColumnConfig } from '@/components/DataTable';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus, Loader2, ShieldCheck } from 'lucide-react';
import { usePermission } from '@/contexts/PermissionContext';
import { toast } from 'sonner';
import { RoleAuthorizeDialog } from '@/components/RoleAuthorizeDialog';

interface Role {
    id: number;
    name: string;
    description?: string;
    createTime: string;
    isActive: boolean;
    permissions: any[]; // 仅用于列表展示数量
}

export default function Roles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { hasPermission } = usePermission();

    // 分页
    const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

    // 基础信息弹窗（新增/编辑）
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    // 授权弹窗
    const [authorizeOpen, setAuthorizeOpen] = useState(false);
    const [authorizeRole, setAuthorizeRole] = useState<{ id: number; name: string } | null>(null);

    // 删除
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/api/roles', { headers: { Authorization: `Bearer ${token}` } });
            setRoles(res.data);
            setPagination(p => ({ ...p, total: res.data.length }));
        } catch (err: any) {
            setError(err.response?.data?.message || '获取数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRoles(); }, []);

    const pagedRoles = roles.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize);
    const tablePagination = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: roles.length,
        onPageChange: (page: number, pageSize: number) => setPagination({ page, pageSize, total: roles.length }),
    };

    const columns: ColumnConfig<Role>[] = [
        { key: 'id', title: 'ID', width: '80px' },
        { key: 'name', title: '角色名称', className: 'font-medium' },
        { key: 'description', title: '描述', render: (val) => val || '-' },
        { key: 'permissions', title: '权限数', render: (val) => val?.length ?? 0 },
        { key: 'createTime', title: '创建时间', render: (val) => new Date(val).toLocaleDateString('zh-CN') },
        {
            key: 'isActive', title: '状态',
            render: (val) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${val ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {val ? '启用' : '禁用'}
                </span>
            )
        }
    ];

    const handleOpenCreate = () => {
        setEditingRole(null);
        setFormData({ name: '', description: '' });
        setDialogOpen(true);
    };

    const handleOpenEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({ name: role.name, description: role.description || '' });
        setDialogOpen(true);
    };

    const handleOpenAuthorize = (role: Role) => {
        setAuthorizeRole({ id: role.id, name: role.name });
        setAuthorizeOpen(true);
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            if (editingRole) {
                await api.put(`/api/roles/${editingRole.id}`, formData);
            } else {
                await api.post('/api/roles', formData);
            }
            toast.success('保存成功');
            setDialogOpen(false);
            fetchRoles();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingRole) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/api/roles/${deletingRole.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('删除成功');
            setDeleteDialogOpen(false);
            fetchRoles();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '删除失败');
        } finally {
            setDeleting(false);
            setDeletingRole(null);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;

    return (
        <div className="flex flex-col h-full gap-3">
            {error && <div className="text-destructive text-sm bg-destructive/10 p-4 rounded-lg">{error}</div>}

            <DataTable
                columns={columns}
                data={pagedRoles}
                loading={loading}
                rowKey="id"
                pagination={tablePagination}
                toolbar={
                    <>
                        {hasPermission('role:create') && (
                            <Button size="sm" onClick={handleOpenCreate}>
                                <Plus className="mr-1.5 h-4 w-4" /> 新增角色
                            </Button>
                        )}
                    </>
                }
                actions={(record) => (
                    <>
                        {hasPermission('role:edit') && (
                            <Button variant="ghost" size="sm" onClick={() => handleOpenAuthorize(record)} className="text-primary h-8 px-2" title="分配权限/菜单">
                                <ShieldCheck className="h-4 w-4" />
                            </Button>
                        )}
                        {hasPermission('role:edit') && (
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(record)} className="text-primary h-8 px-2" title="编辑基本信息">
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        {hasPermission('role:delete') && (
                            <Button variant="ghost" size="sm" onClick={() => { setDeletingRole(record); setDeleteDialogOpen(true); }} className="text-destructive h-8 px-2" disabled={record.name === 'Admin'}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </>
                )}
            />

            {/* ===== 基础信息编辑弹窗 ===== */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRole ? '编辑角色' : '新增角色'}</DialogTitle>
                        <DialogDescription>填写角色基本信息</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label>角色名称 *</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="如：Admin" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>描述</Label>
                            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="描述此角色的职责" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                        <Button onClick={handleSave} disabled={submitting || !formData.name.trim()}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== 权限和菜单授权弹窗 ===== */}
            <RoleAuthorizeDialog
                open={authorizeOpen}
                onOpenChange={setAuthorizeOpen}
                roleId={authorizeRole?.id || null}
                roleName={authorizeRole?.name || ''}
                onSuccess={fetchRoles}
            />

            {/* ===== 删除确认弹窗 ===== */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>确定要删除角色 <strong>{deletingRole?.name}</strong> 吗？</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}