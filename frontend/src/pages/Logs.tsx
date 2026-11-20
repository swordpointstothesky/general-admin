import { useEffect, useMemo, useState } from 'react';
import api from '@/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnConfig } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Eye, RefreshCw } from 'lucide-react';

// ========== 类型定义 ==========
interface Log {
    id: number;
    userId: number | null;
    username: string;
    action: string;
    module: string;
    method: string;
    path: string;
    queryString?: string;
    requestBody?: string;
    statusCode?: number;
    clientIP?: string;
    userAgent?: string;
    executionTime?: number;
    createTime: string;
}

interface LogPageResponse {
    items: Log[];
    totalCount: number;
    page: number;
    pageSize: number;
}

// ========== 状态标签颜色 ==========
const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-emerald-100 text-emerald-700',
    LOGOUT: 'bg-gray-100 text-gray-700',
    VIEW: 'bg-sky-100 text-sky-700',
    ERROR: 'bg-rose-100 text-rose-700',
};

const actionLabels: Record<string, string> = {
    CREATE: '新增',
    UPDATE: '更新',
    DELETE: '删除',
    LOGIN: '登录',
    LOGOUT: '退出',
    VIEW: '查询',
    ERROR: '错误',
};

// ========== 主组件 ==========
export default function Logs() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterExpanded, setFilterExpanded] = useState(false);
    const [sortField, setSortField] = useState('createTime');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // 筛选条件
    const [filters, setFilters] = useState({
        action: '',
        module: '',
        keyword: '',
        startTime: '',
        endTime: '',
        page: 1,
        pageSize: 20,
    });

    // 查看详情
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);

    const fetchLogs = async (nextFilters = filters) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (nextFilters.action) params.append('action', nextFilters.action);
            if (nextFilters.module) params.append('module', nextFilters.module);
            if (nextFilters.keyword) params.append('keyword', nextFilters.keyword);
            if (nextFilters.startTime) params.append('startTime', nextFilters.startTime);
            if (nextFilters.endTime) params.append('endTime', nextFilters.endTime);
            params.append('page', String(nextFilters.page));
            params.append('pageSize', String(nextFilters.pageSize));

            const response = await api.get(`/api/logs?${params.toString()}`);
            const data: LogPageResponse = response.data;
            setLogs(data.items);
            setTotalCount(data.totalCount);
        } catch (err: any) {
            setError(err.response?.data?.message || '获取日志失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filters.page, filters.pageSize, filters.action, filters.module]);

    const sortedLogs = useMemo(() => {
        const list = [...logs];
        list.sort((a, b) => {
            const av = a[sortField as keyof Log] as string | number | undefined;
            const bv = b[sortField as keyof Log] as string | number | undefined;

            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;

            if (typeof av === 'number' && typeof bv === 'number') {
                return sortOrder === 'asc' ? av - bv : bv - av;
            }

            const as = String(av).toLowerCase();
            const bs = String(bv).toLowerCase();
            if (as < bs) return sortOrder === 'asc' ? -1 : 1;
            if (as > bs) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [logs, sortField, sortOrder]);

    const columns: ColumnConfig<Log>[] = [
        { key: 'id', title: 'ID', width: '80px', sortable: true },
        { key: 'username', title: '用户', sortable: true },
        {
            key: 'action',
            title: '操作',
            sortable: true,
            render: (value) => (
                <Badge className={actionColors[String(value)] || 'bg-gray-100 text-gray-700'}>
                    {actionLabels[String(value)] || value}
                </Badge>
            ),
        },
        { key: 'module', title: '模块', sortable: true },
        {
            key: 'path',
            title: '路径',
            className: 'max-w-[220px]',
            render: (value) => (
                <span className="block max-w-[220px] truncate" title={String(value || '')}>
                    {value || '-'}
                </span>
            ),
        },
        {
            key: 'statusCode',
            title: '状态',
            sortable: true,
            render: (value) => (
                <span className={`font-medium ${value && Number(value) < 400 ? 'text-green-600' : 'text-red-600'}`}>
                    {value || '-'}
                </span>
            ),
        },
        { key: 'executionTime', title: '耗时(ms)', sortable: true },
        {
            key: 'createTime',
            title: '时间',
            sortable: true,
            render: (value) => (
                <span className="text-sm text-muted-foreground">
                    {value ? new Date(String(value)).toLocaleString('zh-CN') : '-'}
                </span>
            ),
        },
    ];

    const tablePagination = {
        page: filters.page,
        pageSize: filters.pageSize,
        total: totalCount,
        onPageChange: (page: number, pageSize: number) => {
            setFilters((prev) => ({ ...prev, page, pageSize }));
        },
    };

    // ========== 查看详情 ==========
    const handleViewDetail = async (id: number) => {
        try {
            const response = await api.get(`/api/logs/${id}`);
            setSelectedLog(response.data);
            setDetailOpen(true);
        } catch (err) {
            alert('获取日志详情失败');
        }
    };

    // ========== 搜索 ==========
    const handleSearch = () => {
        const nextFilters = { ...filters, page: 1 };
        setFilters(nextFilters);
        fetchLogs(nextFilters);
    };

    const handleReset = () => {
        const nextFilters = {
            action: '',
            module: '',
            keyword: '',
            startTime: '',
            endTime: '',
            page: 1,
            pageSize: 20,
        };
        setFilters(nextFilters);
        fetchLogs(nextFilters);
    };

    return (
        <div className="flex h-full flex-col gap-3">
            <div className="rounded-lg border bg-background p-4 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filters.keyword}
                            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                            placeholder="搜索用户名或操作内容..."
                            className="h-10 pl-9"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">操作类型</Label>
                        <Select
                            value={filters.action}
                            onValueChange={(value) => setFilters({ ...filters, action: value ?? '' })}
                        >
                            <SelectTrigger className="h-10 w-[140px]">
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">全部</SelectItem>
                                <SelectItem value="CREATE">新增</SelectItem>
                                <SelectItem value="UPDATE">更新</SelectItem>
                                <SelectItem value="DELETE">删除</SelectItem>
                                <SelectItem value="LOGIN">登录</SelectItem>
                                <SelectItem value="VIEW">查询</SelectItem>
                                <SelectItem value="ERROR">错误</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleSearch} className="h-10">
                        <Search className="mr-2 h-4 w-4" />
                        查询
                    </Button>

                    <Button variant="outline" className="h-10" onClick={handleReset}>
                        重置
                    </Button>

                    <button
                        type="button"
                        onClick={() => setFilterExpanded((prev) => !prev)}
                        className="ml-auto h-10 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {filterExpanded ? '收起' : '展开'} {filterExpanded ? '▲' : '▼'}
                    </button>
                </div>

                {filterExpanded && (
                    <div className="flex flex-wrap gap-4 border-t pt-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">模块</Label>
                            <Input
                                placeholder="请输入模块"
                                value={filters.module || ''}
                                onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                                className="h-10 w-40"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">开始时间</Label>
                            <Input
                                type="datetime-local"
                                value={filters.startTime || ''}
                                onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
                                className="h-10 w-52"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">结束时间</Label>
                            <Input
                                type="datetime-local"
                                value={filters.endTime || ''}
                                onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
                                className="h-10 w-52"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                {error ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500">
                        {error}
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={sortedLogs}
                        loading={loading}
                        rowKey="id"
                        showIndex
                        indexOffset={(filters.page - 1) * filters.pageSize}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSortChange={(field, order) => {
                            setSortField(field);
                            setSortOrder(order);
                        }}
                        pagination={tablePagination}
                        actions={(log) => (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(log.id)}
                                className="text-muted-foreground hover:text-emerald-600"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}
                        actionsTitle="操作"
                        toolbar={
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchLogs()}
                            >
                                <RefreshCw className="mr-1.5 h-4 w-4" />
                                刷新
                            </Button>
                        }
                        emptyText="暂无日志记录"
                    />
                )}
            </div>

            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>日志详情</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-gray-500">ID：</span>{selectedLog.id}</div>
                                <div><span className="text-gray-500">用户：</span>{selectedLog.username}</div>
                                <div><span className="text-gray-500">操作：</span>
                                    <Badge className={actionColors[selectedLog.action] || 'bg-gray-100 text-gray-700'}>
                                        {actionLabels[selectedLog.action] || selectedLog.action}
                                    </Badge>
                                </div>
                                <div><span className="text-gray-500">模块：</span>{selectedLog.module}</div>
                                <div><span className="text-gray-500">方法：</span>{selectedLog.method}</div>
                                <div><span className="text-gray-500">状态码：</span>{selectedLog.statusCode || '-'}</div>
                                <div><span className="text-gray-500">耗时：</span>{selectedLog.executionTime || '-'}ms</div>
                                <div><span className="text-gray-500">IP：</span>{selectedLog.clientIP || '-'}</div>
                                <div className="col-span-2"><span className="text-gray-500">路径：</span>{selectedLog.path}</div>
                                <div className="col-span-2"><span className="text-gray-500">时间：</span>
                                    {new Date(selectedLog.createTime).toLocaleString('zh-CN')}
                                </div>
                            </div>
                            {selectedLog.queryString && (
                                <div>
                                    <div className="text-gray-500 font-medium">查询参数：</div>
                                    <pre className="max-h-24 overflow-x-auto rounded bg-gray-50 p-2 text-xs">{selectedLog.queryString}</pre>
                                </div>
                            )}
                            {selectedLog.requestBody && (
                                <div>
                                    <div className="text-gray-500 font-medium">请求体：</div>
                                    <pre className="max-h-48 overflow-x-auto rounded bg-gray-50 p-2 text-xs">{selectedLog.requestBody}</pre>
                                </div>
                            )}
                            {selectedLog.userAgent && (
                                <div>
                                    <div className="text-gray-500 font-medium">User Agent：</div>
                                    <div className="rounded bg-gray-50 p-2 text-xs break-all">{selectedLog.userAgent}</div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}