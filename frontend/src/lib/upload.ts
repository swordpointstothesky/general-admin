import api from '@/api';

export interface UploadResult {
    url: string;
    fileName: string;
    size: number;
    contentType: string;
}

/**
 * 上传文件（通用）
 */
export async function uploadFile(
    file: File,
    onProgress?: (percent: number) => void
): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/api/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
            if (e.total && onProgress) {
                onProgress(Math.round((e.loaded * 100) / e.total));
            }
        },
    });
    return res.data;
}

/**
 * 上传图片
 */
export async function uploadImage(
    file: File,
    onProgress?: (percent: number) => void
): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/api/file/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
            if (e.total && onProgress) {
                onProgress(Math.round((e.loaded * 100) / e.total));
            }
        },
    });
    return res.data;
}

/**
 * 删除文件
 */
export async function deleteFile(url: string): Promise<void> {
    await api.delete('/api/file', { params: { url } });
}

/**
 * 拼接完整 URL（用于显示）
 * 后端返回的是 /uploads/xxx.jpg，需要加上 API 基地址
 */
export function getFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    const base = import.meta.env.VITE_API_BASE_URL || '';
    return `${base}${url}`;
}