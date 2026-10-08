import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnConfig } from '@/components/DataTable';
import { EntityFormDialog } from '@/components/EntityFormDialog';
import type { FormField } from '@/components/EntityFormDialog';
import { ColumnSettings } from '@/components/ColumnSettings';
import type { ColumnSettingItem } from '@/components/ColumnSettings';
import { useFullscreen } from '@/hooks/useFullscreen';
import { exportToExcel } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DictSelect } from '@/components/DictSelect';
import { useDict } from '@/hooks/useDict';
import { getBadgeColor } from '@/lib/colorMap';
import { getFullUrl } from '@/lib/upload';
import { Image as ImageIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    Plus, Trash2, Upload, RefreshCw, Settings2, Maximize2, Pencil, Loader2, Download,
} from 'lucide-react';

// ========== 类型 ==========
interface Teacher {
    id: number;
    name: string;
    gender: string;
    age: number;
    createTime: string;
    photo: string;
}

// ========== 主组件 ==========
export default function Teachers() {
    const [items, setItems] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);

    // ✅ 只声明一次
    const [keyword, setKeyword] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [filterExpanded, setFilterExpanded] = useState(false);

    // 分页
    const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

    // 排序
    const [sortField, setSortField] = useState('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // 弹窗
    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Teacher | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

    // 删除
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<Teacher | null>(null);
    const [deleting, setDeleting] = useState(false);

    // 批量删除
    const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

    // 全屏
    const tableFullscreen = useFullscreen<HTMLDivElement>();

    // 列设置
    const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
    const defaultVisible = ['id', 'name', 'gender', 'age', 'createTime', 'photo'];

    const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
        const saved = localStorage.getItem('teacher-columns-visible');
        if (!saved) return defaultVisible;
        const parsed: string[] = JSON.parse(saved);
        return Array.from(new Set([...parsed, ...defaultVisible]));
    });

    const [columnOrder, setColumnOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('teacher-columns-order');
        if (!saved) return defaultVisible;
        const parsed: string[] = JSON.parse(saved);
        return Array.from(new Set([...parsed, ...defaultVisible]));
    });

    // ========== 字典加载 ==========
    const { options: genderOptions } = useDict('gender');

    const genderLabel = (value: string) =>
        genderOptions.find((o) => o.value === value)?.label || value;

    // ========== 获取数据 ==========
    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/teachers');
            setItems(res.data);
            setPagination((p) => ({ ...p, total: res.data.length }));
        } catch {
            toast.error('加载数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // ========== 筛选（模糊 + 精确）+ 排序 + 分页 ==========
    const filteredData = items
        .filter((item: any) => {
            if (!keyword) return true;
            const kw = keyword.toLowerCase();
            return Object.entries(item).some(([key, v]) => {
                const str = String(v ?? '').toLowerCase();
                if (str.includes(kw)) return true;
                if (key === 'gender') {
                    const label = genderOptions.find((o) => o.value === v)?.label || '';
                    if (label.toLowerCase().includes(kw)) return true;
                }
                return false;
            });
        })
        .filter((item: any) =>
            Object.entries(filters).every(([key, filterValue]) => {
                if (!filterValue) return true;
                if (key === 'gender') {
                    const itemValue = String(item[key] ?? '');
                    const label = genderOptions.find((o) => o.value === itemValue)?.label || '';
                    return (
                        itemValue === filterValue ||
                        label === filterValue ||
                        label.includes(filterValue)
                    );
                }
                return String(item[key] ?? '')
                    .toLowerCase()
                    .includes(filterValue.toLowerCase());
            })
        );

    const sortedData = [...filteredData].sort((a: any, b: any) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (av < bv) return sortOrder === 'asc' ? -1 : 1;
        if (av > bv) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const pagedData = sortedData.slice(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize
    );

    const tablePagination = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: filteredData.length,
        onPageChange: (page: number, pageSize: number) =>
            setPagination({ page, pageSize, total: filteredData.length }),
    };

    // ========== 列定义 ==========
    const allColumns: (ColumnConfig<Teacher> & { fixed?: boolean })[] = [
        { key: 'id', title: 'Id', width: '80px', sortable: true },
        { key: 'name', title: '姓名' },
        {
            key: 'gender',
            title: '性别',
            render: (value) => {
                const opt = genderOptions.find((o) => o.value === value);
                return opt?.color ? (
                    <Badge variant="outline" className={cn('font-normal', getBadgeColor(opt.color))}>
                        {opt.label}
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="font-normal">
                        {genderLabel(value)}
                    </Badge>
                );
            },
        },
        { key: 'age', title: '年龄', sortable: true },
        { key: 'createTime', title: '创建时间' },
        {
            key: 'photo',
            title: '照片',
            render: (value) => value ? (
                <img
                    src={getFullUrl(value)}
                    alt="照片"
                    className="h-10 w-10 rounded-md object-cover border"
                />
            ) : (
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
            ),
        },
    ];

    const exportColumns = [
        { key: 'id', title: 'Id' },
        { key: 'name', title: '姓名' },
        { key: 'gender', title: '性别' },
        { key: 'age', title: '年龄' },
        { key: 'createTime', title: '创建时间' },
        { key: 'photo', title: '照片' },
    ];

    const columns = columnOrder
        .filter((key) => visibleColumnKeys.includes(key))
        .map((key) => allColumns.find((c) => c.key === key)!)
        .filter(Boolean);

    // ========== 表单字段 ==========
    const formFields: FormField[] = [
        {
            key: 'name',
            label: '姓名',
            required: true,
            placeholder: '请输入姓名',
        },
        {
            key: 'gender',
            label: '性别',
            type: 'select',
            options: genderOptions.map((o) => ({ label: o.label, value: o.value })),
            required: true,
            placeholder: '请选择性别',
        },
        {
            key: 'age',
            label: '年龄',
            type: 'number',
            required: true,
            placeholder: '请输入年龄',
        },
        {
            key: 'photo',
            label: '照片',
            type: 'image',
            required: false,
        },
    ];

    const columnSettingItems: ColumnSettingItem[] = columnOrder.map((key) => {
        const col = allColumns.find((c) => c.key === key)!;
        return {
            key: col.key,
            title: col.title,
            visible: visibleColumnKeys.includes(col.key),
            fixed: col.fixed,
        };
    });

    const handleSaveColumnSettings = (newColumns: ColumnSettingItem[]) => {
        const order = newColumns.map((c) => c.key);
        const visible = newColumns.filter((c) => c.visible).map((c) => c.key);
        setColumnOrder(order);
        setVisibleColumnKeys(visible);
        localStorage.setItem('teacher-columns-order', JSON.stringify(order));
        localStorage.setItem('teacher-columns-visible', JSON.stringify(visible));
    };

    const handleReset = () => {
        setKeyword('');
        setFilters({});
        setPagination((p) => ({ ...p, page: 1 }));
    };

    // ========== 新增 / 编辑 / 保存 / 删除 ==========
    const handleOpenCreate = () => {
        setEditingItem(null);
        setFormData({});
        setFormOpen(true);
    };

    const handleOpenEdit = (item: Teacher) => {
        setEditingItem(item);
        setFormData({ ...item });
        setFormOpen(true);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (editingItem) {
                await api.put(`/api/teachers/${(editingItem as any).id}`, formData);
                toast.success('修改成功');
            } else {
                await api.post('/api/teachers', formData);
                toast.success('创建成功');
            }
            setFormOpen(false);
            fetchItems();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDelete = (item: Teacher) => {
        setDeletingItem(item);
        setDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setDeleting(true);
        try {
            await api.delete(`/api/teachers/${(deletingItem as any).id}`);
            toast.success('删除成功');
            setDeleteOpen(false);
            setDeletingItem(null);
            fetchItems();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '删除失败');
        } finally {
            setDeleting(false);
        }
    };

    const handleBatchDelete = async () => {
        setDeleting(true);
        try {
            await Promise.all(
                selectedKeys.map((key) => api.delete(`/api/teachers/${key}`))
            );
            toast.success(`已删除 ${selectedKeys.length} 条数据`);
            setBatchDeleteOpen(false);
            setSelectedKeys([]);
            fetchItems();
        } catch (err: any) {
            toast.error(err.response?.data?.message || '批量删除失败');
        } finally {
            setDeleting(false);
        }
    };

    const handleExportAll = () => {
        exportToExcel(sortedData, exportColumns, '老师列表', '老师');
    };

    const handleExportSelected = () => {
        const selected = items.filter((s: any) => selectedKeys.includes(s.id));
        exportToExcel(selected, exportColumns, '老师列表_选中', '老师');
    };

    return (
        <div className="flex flex-col h-full gap-3">
            {/* ===== 查询表单 ===== */}
            <div className="rounded-lg bg-background p-4 shrink-0 space-y-3">
                {/* 第一行：模糊搜索 + 操作按钮 */}
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索所有字段..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="h-10 pl-9"
                        />
                    </div>

                    <Button className="h-10" onClick={fetchItems}>查询</Button>
                    <Button variant="outline" className="h-10" onClick={handleReset}>
                        重置
                    </Button>

                    <button
                        type="button"
                        onClick={() => setFilterExpanded(!filterExpanded)}
                        className="h-10 px-3 ml-auto inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {filterExpanded ? '收起' : '展开'} {filterExpanded ? '▲' : '▼'}
                    </button>
                </div>

                {/* 第二行：精确筛选（可展开） */}
                {filterExpanded && (
                    <div className="flex flex-wrap gap-4 pt-3 border-t">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">姓名</Label>
                            <Input
                                placeholder="请输入姓名"
                                value={filters.name || ''}
                                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                className="w-40 h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">性别</Label>
                            <DictSelect
                                value={filters.gender || ''}
                                onChange={(v) => setFilters({ ...filters, gender: v })}
                                options={genderOptions}
                                allowAll
                                className="w-40 h-10"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">年龄</Label>
                            <Input
                                placeholder="请输入年龄"
                                value={filters.age || ''}
                                onChange={(e) => setFilters({ ...filters, age: e.target.value })}
                                className="w-40 h-10"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ===== 数据表格 ===== */}
            <div ref={tableFullscreen.ref} className="flex-1 overflow-hidden mb-4">
                <DataTable
                    columns={columns}
                    data={pagedData}
                    loading={loading}
                    rowKey="id"
                    showIndex
                    indexOffset={(pagination.page - 1) * pagination.pageSize}
                    selectable
                    selectedKeys={selectedKeys}
                    onSelectionChange={setSelectedKeys}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSortChange={(field, order) => {
                        setSortField(field);
                        setSortOrder(order);
                    }}
                    pagination={tablePagination}
                    toolbar={
                        <>
                            <Button size="sm" onClick={handleOpenCreate}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                新增
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setBatchDeleteOpen(true)}
                                disabled={selectedKeys.length === 0}
                            >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                删除
                                {selectedKeys.length > 0 && ` (${selectedKeys.length})`}
                            </Button>
                            {selectedKeys.length > 0 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleExportSelected}
                                >
                                    <Download className="mr-1.5 h-4 w-4" />
                                    导出选中 ({selectedKeys.length})
                                </Button>
                            )}
                            <Button size="sm" variant="outline">
                                <Upload className="mr-1.5 h-4 w-4" />
                                导入
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleExportAll}>
                                <Download className="mr-1.5 h-4 w-4" />
                                导出
                            </Button>
                        </>
                    }
                    toolbarRight={
                        <>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={fetchItems}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={tableFullscreen.toggle}
                                title={tableFullscreen.isFullscreen ? '退出全屏' : '全屏'}
                            >
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setColumnSettingsOpen(true)}
                                title="列设置"
                            >
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </>
                    }
                    actions={(record) => (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary h-8 px-2"
                                onClick={() => handleOpenEdit(record)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive h-8 px-2"
                                onClick={() => handleOpenDelete(record)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                />
            </div>

            {/* ===== 新增/编辑弹窗 ===== */}
            <EntityFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                title={editingItem ? '编辑老师' : '新增老师'}
                description={editingItem ? '修改老师信息' : '填写老师信息'}
                fields={formFields}
                formData={formData}
                onFormChange={setFormData}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitText={editingItem ? '保存修改' : '创建'}
            />

            {/* ===== 单条删除确认 ===== */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除这条 老师 记录吗？此操作不可撤销。
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

            {/* ===== 批量删除确认 ===== */}
            <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除选中的 <strong>{selectedKeys.length}</strong> 条数据吗？此操作不可撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBatchDelete}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ColumnSettings
                open={columnSettingsOpen}
                onOpenChange={setColumnSettingsOpen}
                columns={columnSettingItems}
                onSave={handleSaveColumnSettings}
            />
        </div>
    );
}