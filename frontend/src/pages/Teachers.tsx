import { useEffect, useState } from 'react';
import api from '@/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnConfig } from '@/components/DataTable';
import { EntityFormDialog } from '@/components/EntityFormDialog';
import type { FormField } from '@/components/EntityFormDialog';
import { ColumnSettings } from '@/components/ColumnSettings';
import type { ColumnSettingItem } from '@/components/ColumnSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { exportToExcel } from '@/lib/export';
import { useFullscreen } from '@/hooks/useFullscreen';
import {
    Plus, Trash2, RefreshCw, Settings2, Maximize2, Pencil, Download, Upload, Loader2,
} from 'lucide-react';

// ========== 类型定义 ==========
interface Teacher {
    id: number;
    name: string;
    gender: string;
    age: number;
    createTime: string;
}

// ========== 主组件 ==========
export default function Teachers() {
    const [items, setItems] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);

    // 查询
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
    const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // 列设置
    const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
    const defaultVisible = ['id', 'name', 'gender', 'age', 'createTime'];
    const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
        const saved = localStorage.getItem('teacher-columns-visible');
        return saved ? JSON.parse(saved) : defaultVisible;
    });
    const [columnOrder, setColumnOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('teacher-columns-order');
        return saved ? JSON.parse(saved) : defaultVisible;
    });

    // 全屏
    const tableFullscreen = useFullscreen<HTMLDivElement>();

    // ========== 获取数据 ==========
    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/teachers');
            setItems(res.data);
            setPagination((p) => ({ ...p, total: res.data.length }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // ========== 筛选 + 排序 + 分页 ==========
    const filteredData = items.filter((item: any) =>
        Object.entries(filters).every(([key, value]) =>
            !value || String(item[key] ?? '').toLowerCase().includes(value.toLowerCase())
        )
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

    // 分页配置
    const tablePagination = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: filteredData.length,
        onPageChange: (page: number, pageSize: number) =>
            setPagination({ page, pageSize, total: filteredData.length }),
    };

    // ========== 列定义 ==========
    const allColumns: ColumnConfig<Teacher>[] = [
        {
            key: 'id',
            title: 'Id',
            width: '80px',
            sortable: true,
        },
        {
            key: 'name',
            title: '姓名',
        },
        {
            key: 'gender',
            title: '性别',
            width: '90px',
            render: (value) => (
                <Badge variant={value === '男' ? 'default' : 'secondary'} className="font-normal">
                    {value}
                </Badge>
            ),
        },
        {
            key: 'age',
            title: '年龄',
            sortable: true,
        },
        {
            key: 'createTime',
            title: '创建时间',
            render: (v) => (v ? new Date(v).toLocaleDateString('zh-CN') : '-'),
        },
    ];

    const columns = columnOrder
        .filter((key) => visibleColumnKeys.includes(key))
        .map((key) => allColumns.find((c) => c.key === key)!)
        .filter(Boolean);

    // 列设置项
    const columnSettingItems: ColumnSettingItem[] = columnOrder.map((key) => {
        const col = allColumns.find((c) => c.key === key)!;
        return {
            key: col.key,
            title: col.title,
            visible: visibleColumnKeys.includes(col.key),
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

    // ========== 表单字段 ==========
    const formFields: FormField[] = [
        {
            key: 'name',
            label: '姓名',
        },
        {
            key: 'gender',
            label: '性别',
            type: 'select',
            options: [
                { label: '男', value: '男' },
                { label: '女', value: '女' },
            ],
        },
        {
            key: 'age',
            label: '年龄',
            type: 'number',
        },
    ];

    // ========== 导出列 ==========
    const exportColumns = [
        { key: 'id', title: 'Id' },
        { key: 'name', title: '姓名' },
        { key: 'gender', title: '性别' },
        { key: 'age', title: '年龄' },
        { key: 'createTime', title: '创建时间' },
    ];

    // ========== 新增 ==========
    const handleOpenCreate = () => {
        setEditingItem(null);
        setFormData({});
        setFormOpen(true);
    };

    // ========== 编辑 ==========
    const handleOpenEdit = (item: Teacher) => {
        setEditingItem(item);
        setFormData({ ...item });
        setFormOpen(true);
    };

    // ========== 保存 ==========
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (editingItem) {
                await api.put(`/api/teachers/${(editingItem as any).id}`, formData);
            } else {
                await api.post('/api/teachers', formData);
            }
            setFormOpen(false);
            fetchItems();
        } catch (err: any) {
            alert(err.response?.data?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    // ========== 删除 ==========
    const handleOpenDelete = (item: Teacher) => {
        setDeletingItem(item);
        setDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setDeleting(true);
        try {
            await api.delete(`/api/teachers/${(deletingItem as any).id}`);
            setDeleteOpen(false);
            setDeletingItem(null);
            fetchItems();
        } catch (err: any) {
            alert(err.response?.data?.message || '删除失败');
        } finally {
            setDeleting(false);
        }
    };

    // ========== 批量删除 ==========
    const handleBatchDelete = async () => {
        setDeleting(true);
        try {
            await Promise.all(selectedKeys.map((key) => api.delete(`/api/teachers/${key}`)));
            setBatchDeleteOpen(false);
            setSelectedKeys([]);
            fetchItems();
        } catch (err: any) {
            alert(err.response?.data?.message || '批量删除失败');
        } finally {
            setDeleting(false);
        }
    };

    // ========== 导出 ==========
    const handleExportAll = () => {
        exportToExcel(sortedData, exportColumns, 'Teacher列表', 'Teacher');
    };

    const handleExportSelected = () => {
        const selected = items.filter((s: any) => selectedKeys.includes(s.id));
        exportToExcel(selected, exportColumns, 'Teacher列表_选中', 'Teacher');
    };

    return (
        <div className="space-y-3">
            {/* ===== 查询表单 ===== */}
            <div className="rounded-lg bg-background p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">姓名</Label>
                        <Input
                            placeholder="请输入姓名"
                            value={filters.name || ''}
                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            className="w-48 h-10"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">性别</Label>
                        <Input
                            placeholder="请输入性别"
                            value={filters.gender || ''}
                            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                            className="w-48 h-10"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">年龄</Label>
                        <Input
                            placeholder="请输入年龄"
                            value={filters.age || ''}
                            onChange={(e) => setFilters({ ...filters, age: e.target.value })}
                            className="w-48 h-10"
                        />
                    </div>
                    <div className="space-y-1.5 ml-auto">
                        <Label className="text-xs text-muted-foreground invisible">占位</Label>
                        <div className="flex items-center gap-2">
                            <Button className="h-10" onClick={fetchItems}>查询</Button>
                            <Button
                                variant="outline"
                                className="h-10"
                                onClick={() => {
                                    setFilters({});
                                    setPagination((p) => ({ ...p, page: 1 }));
                                }}
                            >
                                重置
                            </Button>
                            <button
                                type="button"
                                onClick={() => setFilterExpanded(!filterExpanded)}
                                className="h-10 px-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                展开 {filterExpanded ? '▲' : '▼'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== 数据表格 ===== */}
            <div ref={tableFullscreen.ref}>
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
                    onSortChange={(field, order) => { setSortField(field); setSortOrder(order); }}
                    pagination={tablePagination}
                    toolbar={
                        <>
                            <Button size="sm" onClick={handleOpenCreate}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                新增
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setBatchDeleteOpen(true)} disabled={selectedKeys.length === 0}>
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                删除
                                {selectedKeys.length > 0 && ` (${selectedKeys.length})`}
                            </Button>
                            {selectedKeys.length > 0 && (
                                <Button size="sm" variant="outline" onClick={handleExportSelected}>
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
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={tableFullscreen.toggle}>
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setColumnSettingsOpen(true)}>
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </>
                    }
                    actions={(record) => (
                        <>
                            <Button variant="ghost" size="sm" className="text-primary h-8 px-2" onClick={() => handleOpenEdit(record)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive h-8 px-2" onClick={() => handleOpenDelete(record)}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                />
            </div>

            {/* ===== 列设置 ===== */}
            <ColumnSettings
                open={columnSettingsOpen}
                onOpenChange={setColumnSettingsOpen}
                columns={columnSettingItems}
                onSave={handleSaveColumnSettings}
            />

            {/* ===== 新增/编辑 ===== */}
            <EntityFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                title={editingItem ? '编辑Teacher' : '新增Teacher'}
                fields={formFields}
                formData={formData}
                onFormChange={setFormData}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitText={editingItem ? '保存修改' : '创建'}
            />

            {/* ===== 删除确认 ===== */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除这条 Teacher 记录吗？此操作不可撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ===== 批量删除 ===== */}
            <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要删除选中的 <strong>{selectedKeys.length}</strong> 条数据吗？
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBatchDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            确认删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}