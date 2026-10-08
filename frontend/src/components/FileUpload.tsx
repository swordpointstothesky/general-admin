import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { UploadCloud, X, Loader2, FileText } from 'lucide-react';
import { uploadFile, uploadImage, getFullUrl } from '@/lib/upload';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    value?: string | null;                 // 已上传的文件 URL
    onChange?: (url: string | null) => void;
    /** 只允许图片 */
    imageOnly?: boolean;
    /** 最大文件大小（MB） */
    maxSize?: number;
    /** 是否显示预览图（图片类型） */
    showPreview?: boolean;
    className?: string;
    disabled?: boolean;
}

export function FileUpload({
    value,
    onChange,
    imageOnly = false,
    maxSize = 5,
    showPreview = true,
    className,
    disabled = false,
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (disabled || uploading) return;
        inputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // 允许重复选择同一文件

        if (!file) return;

        // 校验大小
        if (file.size > maxSize * 1024 * 1024) {
            toast.error(`文件大小不能超过 ${maxSize}MB`);
            return;
        }

        // 校验类型
        if (imageOnly && !file.type.startsWith('image/')) {
            toast.error('只能上传图片');
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const result = imageOnly
                ? await uploadImage(file, setProgress)
                : await uploadFile(file, setProgress);
            onChange?.(result.url);
            toast.success('上传成功');
        } catch (err: any) {
            toast.error(err.response?.data?.message || '上传失败');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleClear = () => {
        onChange?.(null);
    };

    const fullUrl = getFullUrl(value);
    const isImage = fullUrl && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fullUrl);

    return (
        <div className={cn('space-y-2', className)}>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={imageOnly ? 'image/*' : undefined}
                onChange={handleFileChange}
                disabled={disabled}
            />

            {/* 无文件时：上传框 */}
            {!value && !uploading && (
                <div
                    onClick={handleClick}
                    className={cn(
                        'flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-8 cursor-pointer transition-colors',
                        'hover:border-primary hover:bg-primary/5',
                        disabled && 'cursor-not-allowed opacity-50'
                    )}
                >
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                        点击或拖拽{imageOnly ? '图片' : '文件'}到此处
                    </div>
                    <div className="text-xs text-muted-foreground">
                        最大 {maxSize}MB
                    </div>
                </div>
            )}

            {/* 上传中：进度 */}
            {uploading && (
                <div className="flex items-center gap-3 border rounded-lg px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div className="flex-1">
                        <div className="text-sm">上传中... {progress}%</div>
                        <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 已上传：预览 + 删除 */}
            {value && !uploading && (
                <div className="relative border rounded-lg p-3 flex items-center gap-3">
                    {/* 预览图 */}
                    {showPreview && isImage ? (
                        <img
                            src={fullUrl}
                            alt="预览"
                            className="h-16 w-16 object-cover rounded-md border shrink-0"
                        />
                    ) : (
                        <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                            {value.split('/').pop()}
                        </div>
                        <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                        >
                            查看原文件
                        </a>
                    </div>

                    {/* 删除按钮 */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        disabled={disabled}
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}