import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ========== 请求拦截器：自动添加 Token ==========
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ========== 响应拦截器：统一处理错误 ==========
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            // Token 过期或无效 → 跳转到登录页
            // 替换 alert 为 toast.error
            if (status === 401) {
                localStorage.removeItem('token');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                toast.error('登录已过期，请重新登录');
            } else if (status === 403) {
                toast.error('没有权限执行此操作');
            } else if (status === 500) {
                toast.error('服务器错误，请稍后重试');
            } else if (data?.message) {
                toast.error(data.message);
            }
        } else {
            toast.error('网络错误，请检查连接');
        }
        return Promise.reject(error);
    }
);

export default api;