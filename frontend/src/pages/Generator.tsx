import { useEffect, useState } from 'react';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Download } from 'lucide-react';

interface Column {
    columnName: string;
    dataType: string;
    isPrimaryKey: boolean;
    displayName: string;
    showInList: boolean;
    showInForm: boolean;
    csharpType: string;
    tsType: string;
}

export default function Generator() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState('');
    const [columns, setColumns] = useState<Column[]>([]);
    const [moduleName, setModuleName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [generating, setGenerating] = useState(false);

    // 加载表列表
    useEffect(() => {
        api.get('/api/generator/tables').then(res => setTables(res.data));
    }, []);

    // 选择表后加载字段
    const handleSelectTable = async (table: string) => {
        setSelectedTable(table);
        const res = await api.get(`/api/generator/tables/${table}/columns`);
        setColumns(res.data.columns);
        // 默认模块名（首字母大写，去掉 s）
        const name = table.replace(/s$/, '');
        setModuleName(name.charAt(0).toUpperCase() + name.slice(1));
        setDisplayName(name);
    };

    // 生成代码
    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await api.post('/api/generator/generate', {
                tableName: selectedTable,
                moduleName,
                displayName,
                columns,
            }, { responseType: 'blob' });

            // 触发下载
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${moduleName}_generated.zip`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('生成失败');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold">代码生成器</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    根据数据库表自动生成前后端 CRUD 代码
                </p>
            </div>

            {/* 表选择 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">1. 选择数据表</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select value={selectedTable} onValueChange={(value) => value && handleSelectTable(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="选择要生成的数据表" />
                        </SelectTrigger>
                        <SelectContent>
                            {tables.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedTable && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>模块名（英文）</Label>
                                <Input value={moduleName} onChange={e => setModuleName(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label>中文显示名</Label>
                                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 字段配置 */}
            {columns.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">2. 配置字段</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="text-left p-3">字段名</th>
                                        <th className="text-left p-3">类型</th>
                                        <th className="text-left p-3">显示名</th>
                                        <th className="text-center p-3">列表</th>
                                        <th className="text-center p-3">表单</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {columns.map((col, idx) => (
                                        <tr key={col.columnName} className="border-t">
                                            <td className="p-3 font-mono text-xs">{col.columnName}</td>
                                            <td className="p-3 text-muted-foreground">{col.dataType}</td>
                                            <td className="p-3">
                                                <Input
                                                    value={col.displayName}
                                                    onChange={e => {
                                                        const newCols = [...columns];
                                                        newCols[idx].displayName = e.target.value;
                                                        setColumns(newCols);
                                                    }}
                                                    className="h-8"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <Checkbox
                                                    checked={col.showInList}
                                                    onCheckedChange={v => {
                                                        const newCols = [...columns];
                                                        newCols[idx].showInList = !!v;
                                                        setColumns(newCols);
                                                    }}
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <Checkbox
                                                    checked={col.showInForm}
                                                    onCheckedChange={v => {
                                                        const newCols = [...columns];
                                                        newCols[idx].showInForm = !!v;
                                                        setColumns(newCols);
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 生成按钮 */}
            {columns.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <Button onClick={handleGenerate} disabled={generating} className="w-full">
                            {generating ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
                            ) : (
                                <><Download className="mr-2 h-4 w-4" />生成并下载代码</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}