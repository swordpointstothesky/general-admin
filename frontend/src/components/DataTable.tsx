import type { ReactNode } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== 列配置 ==========
export interface ColumnConfig<T> {
    key: string;
    title: string;
    sortable?: boolean;
    width?: string;
    className?: string;
    render?: (value: any, record: T, index: number) => ReactNode;
}

// ========== 分页配置 ==========
export interface PaginationConfig {
    page: number;
    pageSize: number;
    total: number;
    pageSizeOptions?: number[];
    onPageChange: (page: number, pageSize: number) => void;
}

// ========== 组件 Props ==========
interface DataTableProps<T> {
    columns: ColumnConfig<T>[];
    data: T[];
    loading?: boolean;
    rowKey?: keyof T | ((record: T) => string | number);

    // ✅ 新增：显示序号列
    showIndex?: boolean;
    indexOffset?: number;  // 序号起始偏移（如第二页从 11 开始）
    indexTitle?: string;   // 序号列表头，默认 "#"

    // 多选
    selectable?: boolean;
    selectedKeys?: (string | number)[];
    onSelectionChange?: (keys: (string | number)[]) => void;

    // 排序
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    onSortChange?: (field: string, order: 'asc' | 'desc') => void;

    // 分页
    pagination?: PaginationConfig;

    // 操作列
    actions?: (record: T, index: number) => ReactNode;
    actionsTitle?: string;
    actionsWidth?: string;

    // 工具栏
    toolbar?: ReactNode;
    toolbarRight?: ReactNode;

    // 空状态
    emptyText?: string;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    rowKey = 'id' as keyof T,
    showIndex = false,           // ✅ 新增
    indexOffset = 0,             // ✅ 新增
    indexTitle = '#',            // ✅ 新增
    selectable = false,
    selectedKeys = [],
    onSelectionChange,
    sortField,
    sortOrder,
    onSortChange,
    pagination,
    actions,
    actionsTitle = '操作',
    actionsWidth = '120px',
    toolbar,
    toolbarRight,
    emptyText = '暂无数据',
}: DataTableProps<T>) {
    const getRowKey = (record: T, index: number): string | number => {
        if (typeof rowKey === 'function') return rowKey(record);
        return record[rowKey] ?? index;
    };

    const getCellValue = (record: T, key: string): any => {
        return key.split('.').reduce((obj: any, k) => obj?.[k], record);
    };

    // ========== 多选逻辑 ==========
    const allKeys = data.map((r, i) => getRowKey(r, i));
    const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.includes(k));
    const someSelected = allKeys.some((k) => selectedKeys.includes(k)) && !allSelected;

    const handleSelectAll = (checked: boolean) => {
        if (!onSelectionChange) return;
        if (checked) {
            // 合并现有选中
            const merged = Array.from(new Set([...selectedKeys, ...allKeys]));
            onSelectionChange(merged);
        } else {
            // 移除当前页的选中
            onSelectionChange(selectedKeys.filter((k) => !allKeys.includes(k)));
        }
    };

    const handleSelectOne = (key: string | number, checked: boolean) => {
        if (!onSelectionChange) return;
        if (checked) {
            onSelectionChange([...selectedKeys, key]);
        } else {
            onSelectionChange(selectedKeys.filter((k) => k !== key));
        }
    };

    // ========== 排序逻辑 ==========
    const handleSort = (field: string) => {
        if (!onSortChange) return;
        if (sortField === field) {
            onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            onSortChange(field, 'asc');
        }
    };

    // ========== 分页逻辑 ==========
    const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) || 1 : 1;

    const renderPagination = () => {
        if (!pagination) return null;
        const { page, pageSize, total, pageSizeOptions = [10, 20, 50, 100], onPageChange } = pagination;

        return (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-background">
                <div className="text-sm text-muted-foreground">
                    共 <strong>{total}</strong> 条
                </div>
                <div className="flex items-center gap-4">
                    {/* 每页条数 */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">每页</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(v) => onPageChange(1, Number(v))}
                        >
                            <SelectTrigger className="h-8 w-[72px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((n) => (
                                    <SelectItem key={n} value={String(n)}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-muted-foreground">条</span>
                    </div>

                    {/* 页码 */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onPageChange(page - 1, pageSize)}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <span className="text-sm px-3">
                            {page} / {totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onPageChange(page + 1, pageSize)}
                            disabled={page >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // ========== 加载状态 ==========
    if (loading) {
        return (
            <div className="border rounded-lg bg-background">
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    const colSpan =
        columns.length
        + (selectable ? 1 : 0)
        + (showIndex ? 1 : 0)   // ✅ 新增
        + (actions ? 1 : 0);


    return (
        <div className="border rounded-lg bg-background overflow-hidden">
            {/* ===== 工具栏 ===== */}
            {(toolbar || toolbarRight) && (
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2">{toolbar}</div>
                    <div className="flex items-center gap-1">{toolbarRight}</div>
                </div>
            )}

            {/* ===== 表格 ===== */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            {selectable && (
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                        onCheckedChange={(v) => handleSelectAll(!!v)}
                                    />
                                </TableHead>
                            )}
                            {showIndex && (
                                <TableHead className="w-16 text-center">{indexTitle}</TableHead>
                            )}
                            {columns.map((col) => (
                                <TableHead
                                    key={col.key}
                                    style={{ width: col.width }}
                                    className={cn(
                                        col.sortable && 'cursor-pointer select-none hover:bg-muted/60',
                                        col.className
                                    )}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        <span>{col.title}</span>
                                        {col.sortable && (
                                            <span className="text-muted-foreground">
                                                {sortField === col.key ? (
                                                    sortOrder === 'asc' ? (
                                                        <ChevronUp className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                    )
                                                ) : (
                                                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                            {actions && (
                                <TableHead className="text-right" style={{ width: actionsWidth }}>
                                    {actionsTitle}
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colSpan}
                                    className="text-center text-muted-foreground py-12"
                                >
                                    {emptyText}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((record, index) => {
                                const key = getRowKey(record, index);
                                const isSelected = selectedKeys.includes(key);
                                return (
                                    <TableRow
                                        key={key}
                                        className={cn(isSelected && 'bg-muted/40')}
                                    >
                                        {selectable && (
                                            <TableCell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(v) => handleSelectOne(key, !!v)}
                                                />
                                            </TableCell>
                                        )}
                                        {showIndex && (
                                            <TableCell className="text-center text-muted-foreground">
                                                {indexOffset + index + 1}
                                            </TableCell>
                                        )}
                                        {columns.map((col) => {
                                            const value = getCellValue(record, col.key);
                                            return (
                                                <TableCell key={col.key} className={col.className}>
                                                    {col.render
                                                        ? col.render(value, record, index)
                                                        : String(value ?? '')}
                                                </TableCell>
                                            );
                                        })}
                                        {actions && (
                                            <TableCell className="text-right">
                                                {actions(record, index)}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ===== 分页 ===== */}
            {renderPagination()}
        </div>
    );
}