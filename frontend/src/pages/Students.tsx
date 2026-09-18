import { useEffect, useState } from 'react';
import api from '@/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnConfig } from '@/components/DataTable';
import { EntityFormDialog } from '@/components/EntityFormDialog';
import type { FormField } from '@/components/EntityFormDialog';
import { ColumnSettings } from '@/components/ColumnSettings';
import type { ColumnSettingItem } from '@/components/ColumnSettings';
import { exportToExcel } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    Plus, Trash2, Upload, RefreshCw, Settings2, Maximize2, Pencil, Loader2, Download
} from 'lucide-react';

interface Student {
    id: number;
    name: string;
    gender: string;
    age: number;
    grade: string;
    className: string;
    createTime: string;
}

export default function Students() {
    const [items, setItems] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);

    // 查询
    const [filters, setFilters] = useState({ name: '', gender: '' });
    const [filterExpanded, setFilterExpanded] = useState(false);

    // 分页
    const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

    // 排序
    const [sortField, setSortField] = useState('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // 弹窗
    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Student | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

    // 删除
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<Student | null>(null);
    const [deleting, setDeleting] = useState(false);

    // 批量删除
    const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

    // 列设置
    const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
    const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
        const saved = localStorage.getItem('students-columns-visible');
        return saved ? JSON.parse(saved) : ['id', 'name', 'gender', 'age', 'grade', 'className', 'createTime'];
    });
    const [columnOrder, setColumnOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('students-columns-order');
        return saved ? JSON.parse(saved) : ['id', 'name', 'gender', 'age', 'grade', 'className', 'createTime'];
    });




    // ========== 获取数据 ==========
    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/students');
            setItems(res.data);
            setPagination((p) => ({ ...p, total: res.data.length }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // ========== 前端筛选 + 排序 + 分页 ==========
    const filteredData = items
        .filter((s) => !filters.name || s.name.includes(filters.name))
        .filter((s) => !filters.gender || s.gender === filters.gender);

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

    // 全部列的完整定义
    const allColumns: (ColumnConfig<Student> & { fixed?: boolean })[] = [
        { key: 'id', title: 'ID', width: '80px', sortable: true, fixed: false },
        { key: 'name', title: '姓名', sortable: true },
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
        { key: 'age', title: '年龄', width: '80px', sortable: true },
        { key: 'grade', title: '年级', sortable: true },
        { key: 'className', title: '班级' },
        {
            key: 'createTime',
            title: '创建时间',
            render: (v) => (v ? new Date(v).toLocaleDateString('zh-CN') : '-'),
        },
    ];

    // 导出时使用的列配置
    const exportColumns = [
        { key: 'id', title: 'ID' },
        { key: 'name', title: '姓名' },
        { key: 'gender', title: '性别' },
        { key: 'age', title: '年龄' },
        { key: 'grade', title: '年级' },
        { key: 'className', title: '班级' },
        {
            key: 'createTime',
            title: '创建时间',
            format: (v: any) => (v ? new Date(v).toLocaleString('zh-CN') : '-'),
        },
    ];
    // 根据可见性和顺序生成最终列
    const columns = columnOrder
        .filter((key) => visibleColumnKeys.includes(key))
        .map((key) => allColumns.find((c) => c.key === key)!)
        .filter(Boolean);

    // ========== 表单字段配置 ==========
    const formFields: FormField[] = [
        { key: 'name', label: '姓名', required: true, placeholder: '请输入姓名' },
        {
            key: 'gender',
            label: '性别',
            type: 'select',
            required: true,
            options: [
                { label: '男', value: '男' },
                { label: '女', value: '女' },
            ],
        },
        { key: 'age', label: '年龄', type: 'number', required: true, placeholder: '请输入年龄' },
        { key: 'grade', label: '年级', required: true, placeholder: '请输入年级' },
        { key: 'className', label: '班级', required: true, placeholder: '请输入班级' },
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

    // 保存时同步到 localStorage
    const handleSaveColumnSettings = (newColumns: ColumnSettingItem[]) => {
        const order = newColumns.map((c) => c.key);
        const visible = newColumns.filter((c) => c.visible).map((c) => c.key);
        setColumnOrder(order);
        setVisibleColumnKeys(visible);
        localStorage.setItem('students-columns-order', JSON.stringify(order));
        localStorage.setItem('students-columns-visible', JSON.stringify(visible));
    };

    // ========== 新增 ==========
    const handleOpenCreate = () => {
        setEditingItem(null);
        setFormData({});
        setFormOpen(true);
    };

    // ========== 编辑 ==========
    const handleOpenEdit = (item: Student) => {
        setEditingItem(item);
        setFormData({ ...item });
        setFormOpen(true);
    };

    // ========== 保存 ==========
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (editingItem) {
                await api.put(`/api/students/${editingItem.id}`, formData);
            } else {
                await api.post('/api/students', formData);
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
    const handleOpenDelete = (item: Student) => {
        setDeletingItem(item);
        setDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setDeleting(true);
        try {
            await api.delete(`/api/students/${deletingItem.id}`);
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
            await Promise.all(
                selectedKeys.map((key) => api.delete(`/api/students/${key}`))
            );
            setBatchDeleteOpen(false);
            setSelectedKeys([]);
            fetchItems();
        } catch (err: any) {
            alert(err.response?.data?.message || '批量删除失败');
        } finally {
            setDeleting(false);
        }
    };

    // ========== 导出当前页 ==========
    const handleExportCurrentPage = () => {
        exportToExcel(pagedData, exportColumns, '学生列表_当前页', '学生');
    };

    // ========== 导出全部（筛选后） ==========
    const handleExportAll = () => {
        exportToExcel(sortedData, exportColumns, '学生列表_全部', '学生');
    };

    // ========== 导出选中 ==========
    const handleExportSelected = () => {
        const selectedData = items.filter((s) =>
            selectedKeys.includes(s.id)
        );
        exportToExcel(selectedData, exportColumns, '学生列表_选中', '学生');
    };

    return (
        <div className="space-y-4">
            {/* ===== 查询表单 ===== */}
            <div className="border rounded-lg bg-background p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">姓名</Label>
                        <Input
                            placeholder="请输入姓名"
                            value={filters.name}
                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            className="w-48 h-10"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">性别</Label>
                        <Select
                            value={filters.gender || 'all'}
                            onValueChange={(value) =>
                                setFilters({ ...filters, gender: value === 'all' ? '' : value })
                            }
                        >
                            <SelectTrigger className="w-32 h-9">
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部</SelectItem>
                                <SelectItem value="男">男</SelectItem>
                                <SelectItem value="女">女</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {filterExpanded && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">年级</Label>
                            <Input placeholder="请输入年级" className="w-32 h-10" />
                        </div>
                    )}
                    <div className="space-y-1.5 ml-auto">
                        <Label className="text-xs text-muted-foreground invisible">占位</Label>
                        <div className="flex items-center gap-2">
                            <Button className="h-10" onClick={fetchItems}>查询</Button>
                            <Button
                                variant="outline"
                                className="h-10"
                                onClick={() => {
                                    setFilters({ name: '', gender: '' });
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
            <DataTable
                columns={columns}
                data={pagedData}
                loading={loading}
                rowKey="id"
                showIndex                                  // ✅ 启用序号列
                indexOffset={(pagination.page - 1) * pagination.pageSize}  // ✅ 跨页连续
                selectable
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={(field, order) => {
                    setSortField(field);
                    setSortOrder(order);
                }}
                pagination={{
                    page: pagination.page,
                    pageSize: pagination.pageSize,
                    total: filteredData.length,
                    onPageChange: (page, pageSize) => {
                        setPagination({ page, pageSize, total: filteredData.length });
                    },
                }}
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
                        <Button size="icon" variant="ghost" className="h-8 w-8">
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

            {/* ===== 新增/编辑弹窗 ===== */}
            <EntityFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                title={editingItem ? '编辑学生' : '新增学生'}
                description={editingItem ? '修改学生信息' : '填写学生信息'}
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
                            确定要删除学生 <strong>{deletingItem?.name}</strong> 吗？此操作不可撤销。
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