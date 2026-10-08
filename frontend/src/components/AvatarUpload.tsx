import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Loader2, User } from 'lucide-react';
import { uploadImage, getFullUrl } from '@/lib/upload';

interface AvatarUploadProps {
    value?: string | null;
    onChange?: (url: string | null) => void;
    size?: number;            // 头像尺寸（px），默认 96
    disabled?: boolean;
}

export function AvatarUpload({
    value,
    onChange,
    size = 96,
    disabled = false,
}: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (disabled || uploading) return;
        inputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('只能上传图片');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('图片不能超过 5MB');
            return;
        }

        setUploading(true);
        try {
            const result = await uploadImage(file);
            onChange?.(result.url);
            toast.success('头像上传成功');
        } catch (err: any) {
            toast.error(err.response?.data?.message || '上传失败');
        } finally {
            setUploading(false);
        }
    };

    const fullUrl = getFullUrl(value);

    return (
        <div
            onClick={handleClick}
            className="relative inline-block group cursor-pointer"
            style={{ width: size, height: size }}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
            />

            {/* 头像显示 */}
            <div
                className="w-full h-full rounded-full overflow-hidden bg-muted border-2 border-background flex items-center justify-center shadow-sm"
            >
                {fullUrl ? (
                    <img src={fullUrl} alt="头像" className="w-full h-full object-cover" />
                ) : (
                    <User className="h-1/2 w-1/2 text-muted-foreground" />
                )}
            </div>

            {/* 悬停遮罩 */}
            {!disabled && !uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                </div>
            )}

            {/* 上传中 */}
            {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
            )}
        </div>
    );
}