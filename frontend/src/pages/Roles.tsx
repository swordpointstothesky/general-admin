import { useEffect, useState } from 'react';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MenuTree } from '@/components/MenuTree';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Plus, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { usePermission } from '@/contexts/PermissionContext';

//========= 权限分类顺序 ==========
const PERMISSION_CATEGORY_ORDER = [
    '仪表盘',
    '用户管理',
    '角色管理',
    '菜单管理',
    '数据字典',
    '操作日志',
    '消息通知',
    '代码生成器',
    '文件管理',
    '站内消息',
    '学生管理',
    '老师管理',
    '系统设置',
];

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

interface MenuItem {
    id: number;
    parentId: number | null;
    name: string;
    path: string;
    icon: string | null;
    children: MenuItem[];
}

// ========== 主组件 ==========
export default function Roles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { hasPermission } = usePermission();
    // 菜单状态
    const [allMenus, setAllMenus] = useState<MenuItem[]>([]);
    const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);

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

    // 菜单展开状态
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    // ========== 获取数据 ==========
    const fetchRoles = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');

            const [rolesRes, permsRes, menusRes] = await Promise.all([
                api.get('/api/roles', { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/api/roles/permissions', { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/api/menus/all', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const roleList = Array.isArray(rolesRes.data) ? rolesRes.data : [];
            const permissionList = Array.isArray(permsRes.data) ? permsRes.data : [];
            const menuList = Array.isArray(menusRes.data) ? menusRes.data : [];

            setRoles(roleList);
            setPermissions(permissionList);
            setAllMenus(menuList);  // ✅ 关键：把菜单数据设置进去
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
        setSelectedMenuIds([]);
        setDialogOpen(true);
    };

    // ========== 打开编辑弹窗 ==========
    const handleOpenEdit = async (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            permissionIds: role.permissions.map(p => p.id),
        });

        // ✅ 默认展开已选中的分类
        const selectedIds = new Set(role.permissions.map((p) => p.id));
        const expanded = new Set<string>();
        Object.entries(groupedPermissions).forEach(([cat, perms]) => {
            if (perms.some((p) => selectedIds.has(p.id))) expanded.add(cat);
        });
        setExpandedCategories(expanded);

        // 获取角色已分配的菜单
        try {
            const response = await api.get(`/api/roles/${role.id}/menus`);
            setSelectedMenuIds(response.data);
        } catch (error) {
            console.error('获取角色菜单失败:', error);
            setSelectedMenuIds([]);
        }

        setDialogOpen(true);
    };

    // ========== 保存 ==========
    const handleSave = async () => {
        setSubmitting(true);
        try {
            let roleId: number;

            if (editingRole) {
                await api.put(`/api/roles/${editingRole.id}`, formData);
                roleId = editingRole.id;
            } else {
                const response = await api.post('/api/roles', formData);
                roleId = response.data.id;
            }

            // 保存菜单分配
            await api.post(`/api/roles/${roleId}/menus`, {
                menuIds: selectedMenuIds,
            });

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

    // 按分类分组
    const groupedPermissions = permissions.reduce((acc, p) => {
        const cat = p.category || '其他';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

    // 按预定义顺序排序
    const sortedCategories = [
        ...PERMISSION_CATEGORY_ORDER.filter((c) => groupedPermissions[c]),
        ...Object.keys(groupedPermissions).filter((c) => !PERMISSION_CATEGORY_ORDER.includes(c)),
    ];

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
                {/* ✅ 只有 role:create 权限才显示 */}
                {hasPermission('role:create') && (
                    <Button
                        onClick={handleOpenCreate}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        新增角色
                    </Button>
                )}
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
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {role.isActive ? '启用' : '禁用'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* ✅ 只有 role:edit 权限才显示编辑按钮 */}
                                        {hasPermission('role:edit') && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenEdit(role)}
                                                className="text-gray-500 hover:text-emerald-600"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {/* ✅ 只有 role:delete 权限才显示删除按钮 */}
                                        {hasPermission('role:delete') && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenDelete(role)}
                                                className="text-gray-500 hover:text-red-600"
                                                disabled={role.name === 'Admin'}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
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
                        {/* ===== 权限分配 ===== */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">权限分配</Label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedCategories(new Set(sortedCategories))}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        全部展开
                                    </button>
                                    <span className="text-muted-foreground">|</span>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedCategories(new Set())}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        全部收起
                                    </button>
                                    <Badge variant="secondary" className="text-xs">
                                        已选 {formData.permissionIds.length} / {permissions.length}
                                    </Badge>
                                </div>
                            </div>

                            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                                {sortedCategories.map((category) => {
                                    const perms = groupedPermissions[category];
                                    const selectedCount = perms.filter((p) =>
                                        formData.permissionIds.includes(p.id)
                                    ).length;
                                    const isExpanded = expandedCategories.has(category);
                                    const allSelected = selectedCount === perms.length && perms.length > 0;

                                    return (
                                        <div key={category} className="border-b last:border-b-0">
                                            <div
                                                className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => {
                                                    setExpandedCategories((prev) => {
                                                        const next = new Set(prev);
                                                        if (next.has(category)) next.delete(category);
                                                        else next.add(category);
                                                        return next;
                                                    });
                                                }}
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    )}
                                                    <span className="text-sm font-medium truncate">{category}</span>
                                                    {selectedCount > 0 && (
                                                        <Badge
                                                            variant={allSelected ? 'default' : 'secondary'}
                                                            className="text-[10px] h-4 px-1.5 shrink-0"
                                                        >
                                                            {selectedCount}/{perms.length}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const ids = perms.map((p) => p.id);
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            permissionIds: allSelected
                                                                ? prev.permissionIds.filter((id) => !ids.includes(id))
                                                                : Array.from(new Set([...prev.permissionIds, ...ids])),
                                                        }));
                                                    }}
                                                    className="text-xs text-primary hover:underline shrink-0 ml-2"
                                                >
                                                    {allSelected ? '取消全选' : '全选'}
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-3 pb-3 pt-1">
                                                    {perms.map((perm) => (
                                                        <div
                                                            key={perm.id}
                                                            className="flex items-center space-x-2 py-0.5"
                                                        >
                                                            <Checkbox
                                                                id={`perm-${perm.id}`}
                                                                checked={formData.permissionIds.includes(perm.id)}
                                                                onCheckedChange={() => togglePermission(perm.id)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label
                                                                htmlFor={`perm-${perm.id}`}
                                                                className="text-sm font-normal cursor-pointer truncate"
                                                                title={perm.displayName}
                                                            >
                                                                {perm.displayName}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ===== 菜单分配 ===== */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">菜单分配</Label>
                                <Badge variant="secondary" className="text-xs">
                                    已选 {selectedMenuIds.length} 个菜单
                                </Badge>
                            </div>

                            <div className="border rounded-lg max-h-[300px] overflow-y-auto p-3">
                                <MenuTree
                                    menus={allMenus}
                                    selectedIds={selectedMenuIds}
                                    onChange={setSelectedMenuIds}
                                />
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