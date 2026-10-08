import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { DictSelect } from '@/components/DictSelect';

// ========== 类型 ==========
interface Column {
    columnName: string;
    camelName: string;
    dataType: string;
    csharpType: string;
    tsType: string;
    isPrimaryKey: boolean;
    isNullable: boolean;
    displayName: string;
    showInList: boolean;
    showInForm: boolean;
    dictType?: string | null;
    inputType: string;
}

interface DictType {
    id: number;
    name: string;
    displayName: string;
    description?: string;
    itemCount: number;
}

const INPUT_TYPES = [
    { value: 'text', label: '文本' },
    { value: 'number', label: '数字' },
    { value: 'textarea', label: '多行文本' },
    { value: 'select', label: '下拉选择' },
    { value: 'date', label: '日期' },
    { value: 'image', label: '图片' },
    { value: 'switch', label: '开关' },
];

export default function Generator() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [columns, setColumns] = useState<Column[]>([]);
    const [moduleName, setModuleName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [generating, setGenerating] = useState(false);
    const [loadingColumns, setLoadingColumns] = useState(false);

    // 字典列表（用于选择）
    const [dictTypes, setDictTypes] = useState<DictType[]>([]);

    // ========== 加载表列表 ==========
    const fetchTables = async () => {
        try {
            const res = await api.get('/api/generator/tables');
            setTables(res.data);
        } catch {
            toast.error('加载表列表失败');
        }
    };

    // ========== 加载字典列表 ==========
    const fetchDictTypes = async () => {
        try {
            const res = await api.get('/api/dict/types');
            setDictTypes(res.data);
        } catch {
            // 静默，字典加载失败不影响核心功能
        }
    };

    useEffect(() => {
        fetchTables();
        fetchDictTypes();
    }, []);

    // ========== 选择表 → 加载字段 ==========
    const handleSelectTable = async (table: string | null) => {
        if (!table) return;
        setSelectedTable(table);
        setLoadingColumns(true);

        try {
            const res = await api.get(`/api/generator/tables/${table}/columns`);
            const cols: Column[] = res.data.columns.map((c: any) => ({
                ...c,
                dictType: null,
                inputType: c.inputType || 'text',
            }));
            setColumns(cols);

            // 默认模块名（去掉复数 s，首字母大写）
            const name = table.replace(/s$/, '');
            setModuleName(name.charAt(0).toUpperCase() + name.slice(1));
            setDisplayName(name);
        } catch {
            toast.error('加载字段失败');
        } finally {
            setLoadingColumns(false);
        }
    };

    // ========== 更新字段 ==========
    const updateColumn = (index: number, patch: Partial<Column>) => {
        setColumns((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    };

    // ========== 生成代码 ==========
    const handleGenerate = async () => {
        if (!selectedTable || !moduleName || !displayName) {
            toast.error('请填写完整信息');
            return;
        }

        setGenerating(true);
        try {
            const res = await api.post(
                '/api/generator/generate',
                {
                    tableName: selectedTable,
                    moduleName,
                    displayName,
                    columns,
                },
                { responseType: 'blob' }
            );

            // 下载 ZIP
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${moduleName}_generated.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('代码生成成功');
        } catch (err: any) {
            toast.error(err.response?.data?.message || '生成失败');
        } finally {
            setGenerating(false);
        }
    };

    // ========== 重置 ==========
    const handleReset = () => {
        setSelectedTable('');
        setColumns([]);
        setModuleName('');
        setDisplayName('');
    };

    return (
        <div className="h-full overflow-auto">
            <div className="space-y-4 max-w-5xl mx-auto">
                {/* ===== 页面标题 ===== */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">代码生成器</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            选择数据表，自动生成前后端 CRUD 代码
                        </p>
                    </div>
                    {selectedTable && (
                        <Button variant="outline" size="sm" onClick={handleReset}>
                            <RefreshCw className="mr-1.5 h-4 w-4" />
                            重新开始
                        </Button>
                    )}
                </div>

                {/* ===== 步骤 1：选择表 ===== */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">1. 选择数据表</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label>数据表 *</Label>
                                <Select
                                    value={selectedTable}
                                    onValueChange={handleSelectTable}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择要生成的数据表" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tables.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>模块名（英文）*</Label>
                                <Input
                                    value={moduleName}
                                    onChange={(e) => setModuleName(e.target.value)}
                                    placeholder="如：Student"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label>中文显示名 *</Label>
                                <Input
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="如：学生"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ===== 步骤 2：配置字段 ===== */}
                {selectedTable && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">2. 配置字段</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingColumns ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/60">
                                            <tr className="border-b">
                                                <th className="text-left p-3 font-medium text-muted-foreground w-32">输入类型</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">字段名</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">类型</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">显示名</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground w-40">字典</th>
                                                <th className="text-center p-3 font-medium text-muted-foreground w-20">列表</th>
                                                <th className="text-center p-3 font-medium text-muted-foreground w-20">表单</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {columns.map((col, idx) => (
                                                <tr key={col.columnName} className="border-b hover:bg-muted/30">
                                                    <td className="p-3">
                                                        <Select
                                                            value={col.inputType || 'text'}
                                                            onValueChange={(v) => updateColumn(idx, { inputType: v || 'text' })}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <span className="flex-1 text-left truncate">
                                                                    {INPUT_TYPES.find((t) => t.value === col.inputType)?.label || '文本'}
                                                                </span>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {INPUT_TYPES.map((t) => (
                                                                    <SelectItem key={t.value} value={t.value}>
                                                                        {t.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="p-3 font-mono text-xs">
                                                        {col.columnName}
                                                        {col.isPrimaryKey && (
                                                            <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                                                PK
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground text-xs">
                                                        {col.dataType}
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            value={col.displayName}
                                                            onChange={(e) => updateColumn(idx, { displayName: e.target.value })}
                                                            className="h-8"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <DictSelect
                                                            value={col.dictType || ''}
                                                            onChange={(v) => updateColumn(idx, { dictType: v || null })}
                                                            options={[
                                                                { label: '无', value: '' },
                                                                ...dictTypes.map((d) => ({
                                                                    label: `${d.displayName} (${d.name})`,
                                                                    value: d.name,
                                                                })),
                                                            ]}
                                                            placeholder="无"
                                                            className="h-8"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Checkbox
                                                            checked={col.showInList}
                                                            onCheckedChange={(v) => updateColumn(idx, { showInList: !!v })}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Checkbox
                                                            checked={col.showInForm}
                                                            onCheckedChange={(v) => updateColumn(idx, { showInForm: !!v })}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 提示 */}
                            <p className="text-xs text-muted-foreground mt-3">
                                💡 为字段绑定字典后，生成的代码会自动使用 <code className="bg-muted px-1 rounded">DictSelect</code> 组件和颜色 Badge
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* ===== 步骤 3：生成 ===== */}
                {selectedTable && columns.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <Button
                                onClick={handleGenerate}
                                disabled={generating || !moduleName || !displayName}
                                className="w-full h-12 text-base"
                                size="lg"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-5 w-5" />
                                        生成并下载代码
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}