import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FolderOpen,
    FileText,
    Plus,
    Trash2,
    Pencil,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorOptions, getBadgeColor } from '@/lib/colorMap';

// ========== 类型 ==========
interface DictTreeNode {
    id: string;
    type: 'menu' | 'dict' | 'group';
    name: string;
    dictId?: number;
    menuId?: number;
    children: DictTreeNode[];
}

interface DictItem {
    id: number;
    dictTypeId: number;
    label: string;
    value: string;
    color?: string;
    sortOrder: number;
    isDefault: boolean;
    isActive: boolean;
}

export default function Dict() {
    // ===== 树 =====
    const [tree, setTree] = useState<DictTreeNode[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [loadingTree, setLoadingTree] = useState(true);

    // ===== 当前选中字典 =====
    const [selectedDict, setSelectedDict] = useState<{ id: number; name: string; description?: string } | null>(null);
    const [items, setItems] = useState<DictItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // ===== 菜单选项 =====
    const [menuOptions, setMenuOptions] = useState<{ id: number; label: string }[]>([]);

    // ===== 字典类型弹窗 =====
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<{ id: number; name: string } | null>(null);
    const [typeForm, setTypeForm] = useState({ name: '', displayName: '', description: '', menuId: 0 });

    // ===== 字典项弹窗 =====
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DictItem | null>(null);
    const [itemForm, setItemForm] = useState({ label: '', value: '', color: '', sortOrder: 0, isDefault: false });

    // ===== 删除确认 =====
    const [deleteTypeOpen, setDeleteTypeOpen] = useState(false);
    const [deletingType, setDeletingType] = useState<{ id: number; name: string } | null>(null);

    const [deleteItemOpen, setDeleteItemOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<DictItem | null>(null);

    const [submitting, setSubmitting] = useState(false);

    // ================================================================
    //  数据加载
    // ================================================================
    const fetchTree = async () => {
        setLoadingTree(true);
        try {
            const res = await api.get('/api/dict/tree');
            setTree(res.data);
            setExpanded(new Set(res.data.map((n: DictTreeNode) => n.id)));
        } catch {
            toast.error('加载字典树失败');
        } finally {
            setLoadingTree(false);
        }
    };

    const fetchMenuOptions = async () => {
        try {
            const res = await api.get('/api/menus/all');
            const flat: { id: number; label: string }[] = [];
            const walk = (nodes: any[], level = 0) => {
                nodes.forEach((n) => {
                    flat.push({
                        id: n.id,
                        label: '　'.repeat(level) + (level > 0 ? '└ ' : '') + n.name,
                    });
                    if (n.children?.length) walk(n.children, level + 1);
                });
            };
            walk(res.data);
            setMenuOptions(flat);
        } catch {
            // 静默
        }
    };

    const fetchItems = async (dictId: number) => {
        setLoadingItems(true);
        try {
            const [itemsRes, detailRes] = await Promise.all([
                api.get(`/api/dict/types/${dictId}/items`),
                api.get(`/api/dict/types/${dictId}`),
            ]);
            setItems(itemsRes.data);
            setSelectedDict({
                id: detailRes.data.id,
                name: detailRes.data.displayName,
                description: detailRes.data.description,
            });
        } catch {
            toast.error('加载字典项失败');
        } finally {
            setLoadingItems(false);
        }
    };

    useEffect(() => {
        fetchTree();
        fetchMenuOptions();
    }, []);

    // ================================================================
    //  展开/折叠
    // ================================================================
    const toggleExpand = (nodeId: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    };

    // ================================================================
    //  树节点渲染
    // ================================================================
    const renderNode = (node: DictTreeNode, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expanded.has(node.id);
        const isSelected = selectedDict?.id === node.dictId;

        // ===== 字典节点 =====
        if (node.type === 'dict') {
            return (
                <div
                    key={node.id}
                    onClick={() => fetchItems(node.dictId!)}
                    className={cn(
                        'group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors',
                        isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                    )}
                    style={{ paddingLeft: `${12 + level * 16}px` }}
                >
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="flex-1 truncate">{node.name}</span>

                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEditType(node.dictId!); }}
                            className="p-0.5 hover:bg-background rounded"
                            title="编辑"
                        >
                            <Pencil className="h-3 w-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleOpenDeleteType(node.dictId!, node.name); }}
                            className="p-0.5 hover:bg-background rounded text-destructive"
                            title="删除"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            );
        }

        // ===== 菜单/分组节点 =====
        return (
            <div key={node.id}>
                <div
                    onClick={() => hasChildren && toggleExpand(node.id)}
                    className="group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm hover:bg-muted transition-colors"
                    style={{ paddingLeft: `${12 + level * 16}px` }}
                >
                    {hasChildren ? (
                        isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                            : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                        <span className="w-3.5" />
                    )}

                    {node.type === 'group' ? (
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    ) : (
                        <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}

                    <span className="flex-1 truncate font-medium">{node.name}</span>

                    {node.type === 'menu' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleOpenCreateType(node.menuId!); }}
                            className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-background rounded"
                            title="在此菜单下新增字典"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {isExpanded && hasChildren && (
                    <div>{node.children.map((child) => renderNode(child, level + 1))}</div>
                )}
            </div>
        );
    };

    // ================================================================
    //  字典类型操作
    // ================================================================
    const handleOpenCreateType = (menuId: number) => {
        setEditingType(null);
        setTypeForm({ name: '', displayName: '', description: '', menuId });
        setTypeDialogOpen(true);
    };

    const handleOpenEditType = async (dictId: number) => {
        try {
            const res = await api.get(`/api/dict/types/${dictId}`);
            const d = res.data;
            setEditingType({ id: d.id, name: d.name });
            setTypeForm({
                name: d.name,
                displayName: d.displayName,
                description: d.description || '',
                menuId: d.menuId || 0,
            });
            setTypeDialogOpen(true);
        } catch {
            toast.error('加载字典详情失败');
        }
    };

    const handleSubmitType = async () => {
        setSubmitting(true);
        try {
            if (editingType) {
                await api.put(`/api/dict/types/${editingType.id}`, {
                    displayName: typeForm.displayName,
                    description: typeForm.description,
                    moveToCommon: typeForm.menuId === 0,
                    menuId: typeForm.menuId > 0 ? typeForm.menuId : null,
                });
                toast.success('字典已更新');
            } else {
                await api.post('/api/dict/types', {
                    name: typeForm.name,
                    displayName: typeForm.displayName,
                    description: typeForm.description,
                    menuId: typeForm.menuId > 0 ? typeForm.menuId : null,
                });
                toast.success('字典已创建');
            }
            setTypeDialogOpen(false);
            fetchTree();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDeleteType = (dictId: number, dictName: string) => {
        setDeletingType({ id: dictId, name: dictName });
        setDeleteTypeOpen(true);
    };

    const handleConfirmDeleteType = async () => {
        if (!deletingType) return;
        try {
            await api.delete(`/api/dict/types/${deletingType.id}`);
            toast.success('字典已删除');
            if (selectedDict?.id === deletingType.id) {
                setSelectedDict(null);
                setItems([]);
            }
            setDeleteTypeOpen(false);
            setDeletingType(null);
            fetchTree();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '删除失败');
        }
    };

    // ================================================================
    //  字典项操作
    // ================================================================
    const handleOpenCreateItem = () => {
        if (!selectedDict) return;
        setEditingItem(null);
        setItemForm({ label: '', value: '', color: '', sortOrder: items.length + 1, isDefault: false });
        setItemDialogOpen(true);
    };

    const handleOpenEditItem = (item: DictItem) => {
        setEditingItem(item);
        setItemForm({
            label: item.label,
            value: item.value,
            color: item.color || '',
            sortOrder: item.sortOrder,
            isDefault: item.isDefault,
        });
        setItemDialogOpen(true);
    };

    const handleSubmitItem = async () => {
        if (!selectedDict) return;
        setSubmitting(true);
        try {
            if (editingItem) {
                await api.put(`/api/dict/items/${editingItem.id}`, itemForm);
                toast.success('字典项已更新');
            } else {
                await api.post('/api/dict/items', { ...itemForm, dictTypeId: selectedDict.id });
                toast.success('字典项已创建');
            }
            setItemDialogOpen(false);
            fetchItems(selectedDict.id);
            fetchTree();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDeleteItem = (item: DictItem) => {
        setDeletingItem(item);
        setDeleteItemOpen(true);
    };

    const handleConfirmDeleteItem = async () => {
        if (!deletingItem) return;
        try {
            await api.delete(`/api/dict/items/${deletingItem.id}`);
            toast.success('字典项已删除');
            setDeleteItemOpen(false);
            setDeletingItem(null);
            if (selectedDict) fetchItems(selectedDict.id);
            fetchTree();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '删除失败');
        }
    };

    // ================================================================
    //  渲染
    // ================================================================
    return (
        <div className="flex flex-col h-full gap-3">
            <div className="flex-1 flex gap-3 overflow-hidden">

                {/* ===== 左侧：字典树 ===== */}
                <div className="w-72 rounded-lg bg-background ring-1 ring-border shadow-sm flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                        <span className="font-medium text-sm">字典目录</span>
                    </div>

                    <div className="flex-1 overflow-auto p-2">
                        {loadingTree ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : tree.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <p className="text-sm text-muted-foreground mb-2">暂无字典</p>
                                <p className="text-xs text-muted-foreground">
                                    鼠标悬停菜单节点，点击 + 新增
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {tree.map((node) => renderNode(node))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== 右侧：字典项 ===== */}
                <div className="flex-1 rounded-lg bg-background ring-1 ring-border shadow-sm flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                        <div>
                            <span className="font-medium text-sm">
                                {selectedDict ? selectedDict.name : '字典项'}
                            </span>
                            {selectedDict?.description && (
                                <span className="text-xs text-muted-foreground ml-2">
                                    {selectedDict.description}
                                </span>
                            )}
                        </div>
                        {selectedDict && (
                            <Button size="sm" onClick={handleOpenCreateItem}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                新增项
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {!selectedDict ? (
                            <p className="text-center text-sm text-muted-foreground py-12">
                                请从左侧选择一个字典
                            </p>
                        ) : loadingItems ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : items.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-12">
                                暂无字典项，点击右上角新增
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60 sticky top-0 z-10">
                                    <tr className="border-b">
                                        <th className="text-left p-3 font-medium text-muted-foreground">显示文本</th>
                                        <th className="text-left p-3 font-medium text-muted-foreground">值</th>
                                        <th className="text-center p-3 font-medium text-muted-foreground w-20">排序</th>
                                        <th className="text-center p-3 font-medium text-muted-foreground w-20">默认</th>
                                        <th className="text-center p-3 font-medium text-muted-foreground w-20">状态</th>
                                        <th className="text-right p-3 font-medium text-muted-foreground w-28">操作</th>
                                        <th className="text-center p-3 font-medium text-muted-foreground w-20">颜色</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3">{item.label}</td>
                                            <td className="p-3 text-muted-foreground font-mono text-xs">{item.value}</td>
                                            <td className="p-3 text-center text-muted-foreground">{item.sortOrder}</td>
                                            <td className="p-3 text-center">
                                                {item.isDefault && (
                                                    <Badge variant="secondary" className="text-xs">默认</Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-xs">
                                                    {item.isActive ? '启用' : '禁用'}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary h-8 px-2"
                                                    onClick={() => handleOpenEditItem(item)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive h-8 px-2"
                                                    onClick={() => handleOpenDeleteItem(item)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-block w-4 h-4 rounded-full ${item.color ? getBadgeColor(item.color).split(' ')[0] : 'bg-gray-200'}`} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>

            {/* ===== 字典类型弹窗 ===== */}
            <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingType ? '编辑字典' : '新增字典'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>编码 *</Label>
                            <Input
                                value={typeForm.name}
                                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                                placeholder="如：user_status"
                                disabled={!!editingType}
                            />
                            <p className="text-xs text-muted-foreground">编码创建后不可修改</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label>显示名 *</Label>
                            <Input
                                value={typeForm.displayName}
                                onChange={(e) => setTypeForm({ ...typeForm, displayName: e.target.value })}
                                placeholder="如：用户状态"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>描述</Label>
                            <Input
                                value={typeForm.description}
                                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                                placeholder="可选"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>归属菜单</Label>
                            <Select
                                value={String(typeForm.menuId)}
                                onValueChange={(v) => setTypeForm({ ...typeForm, menuId: Number(v) })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="选择菜单" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] min-w-[320px]">
                                    <SelectItem value="0">通用字典（不归属任何菜单）</SelectItem>
                                    {menuOptions.map((m) => (
                                        <SelectItem key={m.id} value={String(m.id)}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>取消</Button>
                        <Button
                            onClick={handleSubmitType}
                            disabled={submitting || !typeForm.name || !typeForm.displayName}
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== 字典项弹窗 ===== */}
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? '编辑字典项' : '新增字典项'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>显示文本 *</Label>
                            <Input
                                value={itemForm.label}
                                onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                                placeholder="如：启用"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>值 *</Label>
                            <Input
                                value={itemForm.value}
                                onChange={(e) => setItemForm({ ...itemForm, value: e.target.value })}
                                placeholder="如：active"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>颜色</Label>
                            <Select
                                value={itemForm.color || 'none'}
                                onValueChange={(v) => setItemForm({ ...itemForm, color: v === 'none' ? '' : v })}
                            >
                                <SelectTrigger className="w-full">
                                    <span className="flex items-center gap-2">
                                        {itemForm.color && (
                                            <span className={`inline-block w-3 h-3 rounded-full ${getBadgeColor(itemForm.color).split(' ')[0]}`} />
                                        )}
                                        {colorOptions.find((c) => c.value === itemForm.color)?.label || '默认（灰色）'}
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">默认（灰色）</SelectItem>
                                    {colorOptions.filter((c) => c.value).map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            <span className="flex items-center gap-2">
                                                <span className={`inline-block w-3 h-3 rounded-full ${getBadgeColor(c.value).split(' ')[0]}`} />
                                                {c.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>排序</Label>
                                <Input
                                    type="number"
                                    value={itemForm.sortOrder}
                                    onChange={(e) => setItemForm({ ...itemForm, sortOrder: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>是否默认</Label>
                                <div className="flex items-center h-10">
                                    <input
                                        type="checkbox"
                                        checked={itemForm.isDefault}
                                        onChange={(e) => setItemForm({ ...itemForm, isDefault: e.target.checked })}
                                        className="h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-muted-foreground">默认选中</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setItemDialogOpen(false)}>取消</Button>
                        <Button
                            onClick={handleSubmitItem}
                            disabled={submitting || !itemForm.label || !itemForm.value}
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== 删除字典类型确认 ===== */}
            <AlertDialog open={deleteTypeOpen} onOpenChange={setDeleteTypeOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除字典</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除字典「<strong>{deletingType?.name}</strong>」及其
                            <strong className="text-destructive">所有字典项</strong>吗？此操作不可撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDeleteType}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ===== 删除字典项确认 ===== */}
            <AlertDialog open={deleteItemOpen} onOpenChange={setDeleteItemOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除字典项</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除「<strong>{deletingItem?.label}</strong>」吗？此操作不可撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDeleteItem}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}