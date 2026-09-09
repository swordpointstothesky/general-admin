import React from 'react';
import ReactDOM from 'react-dom/client';  // 注意：从 client 导入
import App from './App';
import './index.css';
import { Toaster } from 'sonner';  // 如果你用了 sonner

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
        <Toaster />  {/* 如果有 Toaster */}
    </React.StrictMode>
);