import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, Download, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import api from '@/api';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImportError {
    row: number;
    message: string;
}

interface ImportResult {
    successCount: number;
    failedCount: number;
    errors: ImportError[];
}

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 导入接口路径，如 /api/students/import */
    importUrl: string;
    /** 模板下载接口路径 */
    templateUrl: string;
    /** 模块名，如 "学生" */
    moduleName: string;
    /** 导入成功后回调（如刷新列表） */
    onSuccess?: () => void;
}

export function ImportDialog({
    open,
    onOpenChange,
    importUrl,
    templateUrl,
    moduleName,
    onSuccess,
}: ImportDialogProps) {
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = async () => {
        try {
            const res = await api.get(templateUrl, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${moduleName}导入模板.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('模板下载失败');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'xlsx' && ext !== 'xls') {
            toast.error('只支持 Excel 文件');
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post(importUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const data: ImportResult = res.data;
            setResult(data);

            if (data.failedCount === 0) {
                toast.success(`成功导入 ${data.successCount} 条数据`);
                onSuccess?.();
            } else if (data.successCount > 0) {
                toast.warning(`导入完成：成功 ${data.successCount} 条，失败 ${data.failedCount} 条`);
                onSuccess?.();
            } else {
                toast.error(`导入失败：${data.failedCount} 条数据有误`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || '导入失败');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = (v: boolean) => {
        if (!v) {
            setResult(null);
        }
        onOpenChange(v);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>批量导入{moduleName}</DialogTitle>
                    <DialogDescription>
                        下载模板 → 填写数据 → 上传文件
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* 步骤 1：下载模板 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                            1
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium">下载导入模板</div>
                            <div className="text-xs text-muted-foreground">
                                按模板格式填写数据，不要修改表头
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            下载模板
                        </Button>
                    </div>

                    {/* 步骤 2：上传文件 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                            2
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium">上传 Excel 文件</div>
                            <div className="text-xs text-muted-foreground">
                                支持 .xlsx / .xls，最大 10MB
                            </div>
                        </div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        <Button
                            size="sm"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    导入中...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                                    选择文件
                                </>
                            )}
                        </Button>
                    </div>

                    {/* 导入结果 */}
                    {result && (
                        <div className="space-y-3">
                            {/* 统计 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <div>
                                        <div className="text-xs text-green-700">成功</div>
                                        <div className="text-lg font-bold text-green-700">
                                            {result.successCount}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <div>
                                        <div className="text-xs text-red-700">失败</div>
                                        <div className="text-lg font-bold text-red-700">
                                            {result.failedCount}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 错误详情 */}
                            {result.errors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border-b">
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                        <span className="text-sm font-medium text-destructive">
                                            错误详情
                                        </span>
                                    </div>
                                    <div className="max-h-60 overflow-auto">
                                        {result.errors.map((err, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-3 px-3 py-2 text-sm border-b last:border-b-0 hover:bg-muted/30"
                                            >
                                                <span className="text-muted-foreground shrink-0">
                                                    第 {err.row} 行
                                                </span>
                                                <span className="text-destructive flex-1">
                                                    {err.message}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)}>
                        关闭
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}