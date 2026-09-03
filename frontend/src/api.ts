import axios from 'axios';

// 从环境变量获取后端地址
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;