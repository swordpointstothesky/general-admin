import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MenuTree } from '@/components/MenuTree';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';

interface Permission {
    id: number;
    displayName: string;
    category?: string;
}

interface MenuItem {
    id: number;
    parentId: number | null;
    name: string;
    path: string;
    icon: string | null;
    children: MenuItem[];
}

interface RoleAuthorizeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roleId: number | null;
    roleName: string;
    onSuccess: () => void;
}

const PERMISSION_CATEGORY_ORDER = [
    '仪表盘', '用户管理', '角色管理', '菜单管理', '数据字典', '操作日志',
    '消息通知', '代码生成器', '文件管理', '站内消息', '学生管理', '老师管理', '系统设置',
];

export function RoleAuthorizeDialog({
    open, onOpenChange, roleId, roleName, onSuccess
}: RoleAuthorizeDialogProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [allMenus, setAllMenus] = useState<MenuItem[]>([]);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
    
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // 获取数据
    useEffect(() => {
        if (!open || !roleId) return;

        setLoading(true);
        Promise.all([
            api.get('/api/roles/permissions'), // 所有系统权限
            api.get('/api/menus/all'),         // 所有系统菜单
            api.get(`/api/roles/${roleId}`),   // 当前角色详情（包含已选权限）
            api.get(`/api/roles/${roleId}/menus`) // 当前角色已选菜单
        ]).then(([permsRes, menusRes, roleRes, roleMenusRes]) => {
            const perms = Array.isArray(permsRes.data) ? permsRes.data : [];
            const menus = Array.isArray(menusRes.data) ? menusRes.data : [];
            
            setPermissions(perms);
            setAllMenus(menus);
            
            // 回显已选权限和菜单
            const rolePermIds = roleRes.data.permissions.map((p: any) => p.id);
            setSelectedPermissionIds(rolePermIds);
            setSelectedMenuIds(roleMenusRes.data);

            // 默认展开有选中权限的分类
            const selectedSet = new Set(rolePermIds);
            const expanded = new Set<string>();
            perms.forEach((p: any) => {
                const cat = p.category || '其他';
                if (selectedSet.has(p.id)) expanded.add(cat);
            });
            setExpandedCategories(expanded);

        }).catch(() => {
            toast.error('加载权限数据失败');
        }).finally(() => {
            setLoading(false);
        });
    }, [open, roleId]);

    // 保存
    const handleSave = async () => {
        if (!roleId) return;
        setSubmitting(true);
        try {
            // 保存权限 (PUT /api/roles/{id} 传 permissionIds)
            await api.put(`/api/roles/${roleId}`, {
                permissionIds: selectedPermissionIds
            });
            // 保存菜单 (POST /api/roles/{id}/menus)
            await api.post(`/api/roles/${roleId}/menus`, {
                menuIds: selectedMenuIds
            });
            
            toast.success('授权成功');
            onOpenChange(false);
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '保存失败');
        } finally {
            setSubmitting(false);
        }
    };

    // 切换权限选中
    const togglePermission = (id: number) => {
        setSelectedPermissionIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // 按分类分组
    const groupedPermissions = permissions.reduce((acc, p) => {
        const cat = p.category || '其他';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

    const sortedCategories = [
        ...PERMISSION_CATEGORY_ORDER.filter((c) => groupedPermissions[c]),
        ...Object.keys(groupedPermissions).filter((c) => !PERMISSION_CATEGORY_ORDER.includes(c)),
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>角色授权：{roleName}</DialogTitle>
                    <DialogDescription>
                        为此角色分配系统权限和可见菜单
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Tabs defaultValue="permissions" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 pt-2 shrink-0">
                            <TabsList className="grid w-full max-w-md grid-cols-2">
                                <TabsTrigger value="permissions">
                                    功能权限 ({selectedPermissionIds.length})
                                </TabsTrigger>
                                <TabsTrigger value="menus">
                                    菜单访问 ({selectedMenuIds.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* ===== 权限分配页签 ===== */}
                        <TabsContent value="permissions" className="flex-1 overflow-auto px-6 py-4 m-0 data-[state=active]:flex flex-col">
                            <div className="flex items-center justify-between mb-3 shrink-0">
                                <span className="text-sm text-muted-foreground">勾选角色可以执行的操作</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setExpandedCategories(new Set(sortedCategories))} className="text-xs text-primary hover:underline">全部展开</button>
                                    <span className="text-muted-foreground">|</span>
                                    <button onClick={() => setExpandedCategories(new Set())} className="text-xs text-primary hover:underline">全部收起</button>
                                </div>
                            </div>
                            
                            <div className="border rounded-lg flex-1 overflow-y-auto">
                                {sortedCategories.map((category) => {
                                    const perms = groupedPermissions[category];
                                    const selectedCount = perms.filter((p) => selectedPermissionIds.includes(p.id)).length;
                                    const isExpanded = expandedCategories.has(category);
                                    const allSelected = selectedCount === perms.length && perms.length > 0;

                                    return (
                                        <div key={category} className="border-b last:border-b-0">
                                            <div
                                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => {
                                                    setExpandedCategories(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(category)) next.delete(category);
                                                        else next.add(category);
                                                        return next;
                                                    });
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                    <span className="text-sm font-medium">{category}</span>
                                                    {selectedCount > 0 && (
                                                        <Badge variant={allSelected ? 'default' : 'secondary'} className="text-[10px] h-5">
                                                            {selectedCount}/{perms.length}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const ids = perms.map(p => p.id);
                                                        setSelectedPermissionIds(prev =>
                                                            allSelected ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]))
                                                        );
                                                    }}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    {allSelected ? '取消全选' : '全选'}
                                                </button>
                                            </div>
                                            
                                            {isExpanded && (
                                                <div className="grid grid-cols-4 gap-4 px-10 pb-4 pt-1">
                                                    {perms.map(perm => (
                                                        <div key={perm.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`perm-${perm.id}`}
                                                                checked={selectedPermissionIds.includes(perm.id)}
                                                                onCheckedChange={() => togglePermission(perm.id)}
                                                            />
                                                            <Label htmlFor={`perm-${perm.id}`} className="text-sm font-normal cursor-pointer truncate" title={perm.displayName}>
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
                        </TabsContent>

                        {/* ===== 菜单分配页签 ===== */}
                        <TabsContent value="menus" className="flex-1 overflow-auto px-6 py-4 m-0 data-[state=active]:flex flex-col">
                            <div className="flex items-center justify-between mb-3 shrink-0">
                                <span className="text-sm text-muted-foreground">勾选角色登录后能看到的侧边栏菜单</span>
                            </div>
                            <div className="border rounded-lg flex-1 overflow-y-auto p-4">
                                <MenuTree
                                    menus={allMenus}
                                    selectedIds={selectedMenuIds}
                                    onChange={setSelectedMenuIds}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleSave} disabled={submitting || loading}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        保存授权
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}