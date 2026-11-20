import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '@/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnConfig } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronRight, ChevronDown, Plus, Trash2, RefreshCw, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react'; // 动态引入图标

// ====== 1. 类型定义 ======
export interface MenuNode {
    id: number;
    parentId: number | null;
    name: string;
    type: 'directory' | 'menu' | 'button';
    path: string;
    component?: string | null;
    icon?: string | null;
    permission?: string | null;
    sortOrder: number;
    visible: boolean;
    isActive: boolean;
    children?: MenuNode[];
}

// ====== 2. 动态图标渲染 ======
function DynamicIcon({ name }: { name?: string | null }) {
    if (!name) return null;
    const IconCmp = (Icons as any)[name];
    if (!IconCmp) return <Icons.Square className="h-4 w-4" />;
    return <IconCmp className="h-4 w-4" />;
}

// ====== 3. 树形结构拍平 ======
interface FlatRow extends MenuNode {
    __level: number;
    __hasChildren: boolean;
    __expanded: boolean;
    __nameNode: React.ReactNode;
}

function flattenTree(tree: MenuNode[], expanded: Set<number>, level = 0, toggle?: (id: number) => void): FlatRow[] {
    const out: FlatRow[] = [];
    for (const m of tree) {
        const hasChildren = !!(m.children && m.children.length > 0);
        const isExpanded = expanded.has(m.id);

        const nameNode = (
            <span className="inline-flex items-center gap-1" style={{ paddingLeft: level * 20 }}>
                {hasChildren ? (
                    <button type="button" onClick={e => { e.stopPropagation(); toggle?.(m.id); }} className="text-muted-foreground hover:text-foreground">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                ) : <span className="inline-block w-4" />}
                <DynamicIcon name={m.icon} />
                <span>{m.name}</span>
            </span>
        );

        out.push({ ...m, __level: level, __hasChildren: hasChildren, __expanded: isExpanded, __nameNode: nameNode });
        if (hasChildren && isExpanded) out.push(...flattenTree(m.children!, expanded, level + 1, toggle));
    }
    return out;
}

// ====== 4. 主页面 ======
export default function Menu() {
    const [tree, setTree] = useState<MenuNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    // 弹窗状态
    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuNode | null>(null);
    const [presetParentId, setPresetParentId] = useState<number | null>(null);

    // 删除状态
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<MenuNode | null>(null);
    const [deleting, setDeleting] = useState(false);

    // 获取数据
    const fetchTree = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/menus'); // 你后端的全量菜单接口
            setTree(res.data);
            // 首次加载自动展开所有节点
            const ids = new Set<number>();
            const walk = (arr: MenuNode[]) => arr.forEach(m => { ids.add(m.id); if (m.children) walk(m.children); });
            walk(res.data);
            setExpanded(prev => (prev.size === 0 ? ids : prev));
        } catch {
            toast.error('加载菜单失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTree(); }, [fetchTree]);

    const toggle = useCallback((id: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const rows = useMemo(() => flattenTree(tree, expanded, 0, toggle), [tree, expanded, toggle]);

    // 列定义
    const allColumns: (ColumnConfig<FlatRow> & { fixed?: boolean })[] = [
        {
            key: 'name',
            title: '菜单名称',
            render: (_v, record) => record?.__nameNode || record?.name,
        },
        {
            key: 'type',
            title: '类型',
            width: '80px',
            render: v => {
                const map: any = { directory: '目录', menu: '菜单', button: '按钮' };
                const color: any = { directory: 'bg-sky-100 text-sky-700', menu: 'bg-emerald-100 text-emerald-700', button: 'bg-amber-100 text-amber-700' };
                return <Badge className={cn('font-normal', color[v as string])}>{map[v as string] || v}</Badge>;
            },
        },
        { key: 'path', title: '路由', width: '150px' },
        { key: 'component', title: '组件', width: '150px' },
        { key: 'permission', title: '权限标识', width: '150px' },
        { key: 'sortOrder', title: '排序', width: '70px', sortable: true },
        {
            key: 'isActive',
            title: '状态',
            width: '80px',
            render: v => v ? <Badge variant="default" className="font-normal">启用</Badge> : <Badge variant="destructive" className="font-normal">禁用</Badge>,
        },
    ];

    // 操作逻辑
    const handleOpenCreate = (parent?: MenuNode) => {
        setEditingItem(null);
        setPresetParentId(parent?.id ?? null);
        setFormOpen(true);
    };

    const handleOpenEdit = (row: FlatRow) => {
        setEditingItem(row);
        setPresetParentId(null);
        setFormOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setDeleting(true);
        try {
            await api.delete(`/api/menus/${deletingItem.id}`);
            toast.success('删除成功');
            setDeleteOpen(false);
            setDeletingItem(null);
            fetchTree();
            // 通知外层 Layout 刷新侧边栏
            window.dispatchEvent(new Event('refresh-menus'));
        } catch (err: any) {
            toast.error(err.response?.data?.message || '删除失败');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-3">
            <div className="flex-1 overflow-hidden">
                <DataTable
                    columns={allColumns}
                    data={rows}
                    loading={loading}
                    rowKey="id"
                    showIndex
                    toolbar={
                        <Button size="sm" onClick={() => handleOpenCreate()}>
                            <Plus className="mr-1.5 h-4 w-4" /> 新增根菜单
                        </Button>
                    }
                    toolbarRight={
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={fetchTree}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    }
                    actions={row => (
                        <>
                            {row.type === 'directory' && (
                                <Button variant="ghost" size="sm" className="text-primary h-8 px-2" onClick={() => handleOpenCreate(row)} title="添加子菜单">
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-primary h-8 px-2" onClick={() => handleOpenEdit(row)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive h-8 px-2" onClick={() => { setDeletingItem(row); setDeleteOpen(true); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                />
            </div>

            {/* 表单弹窗 */}
            <MenuFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                editingItem={editingItem}
                presetParentId={presetParentId}
                tree={tree}
                onSuccess={() => {
                    fetchTree();
                    // 通知外层 Layout 刷新侧边栏
                    window.dispatchEvent(new Event('refresh-menus'));
                }}
            />

            {/* 删除确认 */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>删除「{deletingItem?.name}」会一并删除其所有子菜单，此操作不可撤销。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ====== 5. 表单弹窗组件 ======
function MenuFormDialog({ open, onOpenChange, editingItem, presetParentId, tree, onSuccess }: any) {
    const [form, setForm] = useState<any>({ type: 'menu', sortOrder: 0, isActive: true, visible: true, icon: '' });
    const [submitting, setSubmitting] = useState(false);

    // 拍平父级下拉选项（排除自己及子级）
    const parentOptions = useMemo(() => {
        const out: any[] = [];
        const walk = (arr: MenuNode[], level: number, skip: boolean) => {
            for (const m of arr) {
                const isSelf = m.id === editingItem?.id;
                if (!skip && !isSelf && m.type !== 'button') out.push({ id: m.id, name: m.name, level });
                if (m.children?.length) walk(m.children, level + 1, skip || isSelf);
            }
        };
        walk(tree, 0, false);
        return out;
    }, [tree, editingItem]);

    useEffect(() => {
        if (open) {
            setForm(editingItem ? { ...editingItem } : { type: 'menu', sortOrder: 0, isActive: true, visible: true, icon: '', parentId: presetParentId });
        }
    }, [open, editingItem, presetParentId]);

    const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.name?.trim()) return toast.error('请填写菜单名称');
        if (form.type === 'menu' && !form.path?.trim()) return toast.error('菜单类型必须填写路由路径');
        
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                parentId: form.parentId || null,
            };
            if (editingItem) {
                await api.put(`/api/menus/${editingItem.id}`, payload);
                toast.success('修改成功');
            } else {
                await api.post('/api/menus', payload);
                toast.success('创建成功');
            }
            onOpenChange(false);
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>{editingItem ? '编辑菜单' : '新增菜单'}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                    
                    <div className="space-y-1">
                        <Label>父级菜单</Label>
                        <Select value={form.parentId == null ? 'ROOT' : String(form.parentId)} onValueChange={v => set('parentId', v === 'ROOT' ? null : Number(v))}>
                            <SelectTrigger><SelectValue placeholder="顶级菜单" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ROOT">顶级菜单</SelectItem>
                                {parentOptions.map(o => (
                                    <SelectItem key={o.id} value={String(o.id)}>{'— '.repeat(o.level)}{o.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label>类型 <span className="text-destructive">*</span></Label>
                        <Select value={form.type} onValueChange={v => set('type', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="directory">目录</SelectItem>
                                <SelectItem value="menu">菜单</SelectItem>
                                <SelectItem value="button">按钮</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label>名称 <span className="text-destructive">*</span></Label>
                        <Input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="如：用户管理" />
                    </div>

                    {form.type !== 'button' && (
                        <div className="space-y-1">
                            <Label>图标 (Lucide 图标名)</Label>
                            <Input value={form.icon || ''} onChange={e => set('icon', e.target.value)} placeholder="如：Users, Settings" />
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                预览: <DynamicIcon name={form.icon} />
                            </p>
                        </div>
                    )}

                    {form.type === 'menu' && (
                        <>
                            <div className="space-y-1">
                                <Label>路由路径 <span className="text-destructive">*</span></Label>
                                <Input value={form.path || ''} onChange={e => set('path', e.target.value)} placeholder="如：/users" />
                            </div>
                            <div className="space-y-1">
                                <Label>组件路径</Label>
                                <Input value={form.component || ''} onChange={e => set('component', e.target.value)} placeholder="如：Users" />
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <Label>权限标识</Label>
                        <Input value={form.permission || ''} onChange={e => set('permission', e.target.value)} placeholder="如：user:add" />
                    </div>

                    <div className="space-y-1">
                        <Label>排序（升序）</Label>
                        <Input type="number" value={form.sortOrder || 0} onChange={e => set('sortOrder', Number(e.target.value))} />
                    </div>

                    <div className="flex items-center gap-2 mt-6">
                        <Switch checked={form.isActive} onCheckedChange={v => set('isActive', v)} /> <Label>启用状态</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}