import { useEffect, useState } from 'react';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Search, Loader2, Eye } from 'lucide-react';

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

    // ========== 获取日志列表 ==========
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.action) params.append('action', filters.action);
            if (filters.module) params.append('module', filters.module);
            if (filters.keyword) params.append('keyword', filters.keyword);
            if (filters.startTime) params.append('startTime', filters.startTime);
            if (filters.endTime) params.append('endTime', filters.endTime);
            params.append('page', String(filters.page));
            params.append('pageSize', String(filters.pageSize));

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
        setFilters({ ...filters, page: 1 });
        fetchLogs();
    };

    // ========== 分页 ==========
    const totalPages = Math.ceil(totalCount / filters.pageSize);

    return (
        <div className="p-6 space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">操作日志</h1>
                <p className="text-sm text-gray-500 mt-1">查看所有用户的操作记录</p>
            </div>

            {/* 筛选栏 */}
            <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-1">
                    <Label className="text-sm">操作类型</Label>
                    <Select
                        value={filters.action}
                        onValueChange={(value) => setFilters({ ...filters, action: value ?? '' })}
                    >
                        <SelectTrigger className="w-[140px]">
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

                <div className="space-y-1">
                    <Label className="text-sm">关键词</Label>
                    <Input
                        placeholder="搜索用户名或操作内容..."
                        value={filters.keyword}
                        onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                        className="w-[220px]"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <Button onClick={handleSearch} className="bg-emerald-500 hover:bg-emerald-600">
                    <Search className="mr-2 h-4 w-4" />
                    搜索
                </Button>

                <Button
                    variant="outline"
                    onClick={() => setFilters({ action: '', module: '', keyword: '', startTime: '', endTime: '', page: 1, pageSize: 20 })}
                >
                    重置
                </Button>
            </div>

            {/* 表格 */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-500">{error}</div>
            ) : (
                <div className="border rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">ID</TableHead>
                                <TableHead>用户</TableHead>
                                <TableHead>操作</TableHead>
                                <TableHead>模块</TableHead>
                                <TableHead>路径</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>耗时(ms)</TableHead>
                                <TableHead>时间</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                                        暂无日志记录
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.id}</TableCell>
                                        <TableCell className="font-medium">{log.username}</TableCell>
                                        <TableCell>
                                            <Badge className={actionColors[log.action] || 'bg-gray-100'}>
                                                {actionLabels[log.action] || log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{log.module}</TableCell>
                                        <TableCell className="max-w-[150px] truncate" title={log.path}>
                                            {log.path}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`font-medium ${log.statusCode && log.statusCode < 400 ? 'text-green-600' : 'text-red-600'}`}>
                                                {log.statusCode || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{log.executionTime || '-'}</TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {new Date(log.createTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetail(log.id)}
                                                className="text-gray-500 hover:text-emerald-600"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* 分页 */}
            {totalCount > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        共 {totalCount} 条记录
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                            disabled={filters.page <= 1}
                        >
                            上一页
                        </Button>
                        <span className="flex items-center px-3 text-sm">
                            {filters.page} / {totalPages || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                            disabled={filters.page >= totalPages}
                        >
                            下一页
                        </Button>
                    </div>
                </div>
            )}

            {/* ===== 查看详情弹窗 ===== */}
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
                                    <Badge className={actionColors[selectedLog.action]}>
                                        {actionLabels[selectedLog.action] || selectedLog.action}
                                    </Badge>
                                </div>
                                <div><span className="text-gray-500">模块：</span>{selectedLog.module}</div>
                                <div><span className="text-gray-500">方法：</span>{selectedLog.method}</div>
                                <div><span className="text-gray-500">状态码：</span>{selectedLog.statusCode || '-'}</div>
                                <div><span className="text-gray-500">耗时：</span>{selectedLog.executionTime}ms</div>
                                <div><span className="text-gray-500">IP：</span>{selectedLog.clientIP || '-'}</div>
                                <div className="col-span-2"><span className="text-gray-500">路径：</span>{selectedLog.path}</div>
                                <div className="col-span-2"><span className="text-gray-500">时间：</span>
                                    {new Date(selectedLog.createTime).toLocaleString('zh-CN')}
                                </div>
                            </div>
                            {selectedLog.queryString && (
                                <div>
                                    <div className="text-gray-500 font-medium">查询参数：</div>
                                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-24">{selectedLog.queryString}</pre>
                                </div>
                            )}
                            {selectedLog.requestBody && (
                                <div>
                                    <div className="text-gray-500 font-medium">请求体：</div>
                                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-48">{selectedLog.requestBody}</pre>
                                </div>
                            )}
                            {selectedLog.userAgent && (
                                <div>
                                    <div className="text-gray-500 font-medium">User Agent：</div>
                                    <div className="bg-gray-50 p-2 rounded text-xs break-all">{selectedLog.userAgent}</div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}