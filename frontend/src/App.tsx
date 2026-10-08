import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Logs from './pages/Logs';
import Profile from './pages/Profile';
import Generator from './pages/Generator';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Dict from './pages/Dict';
import Layout from './components/Layout';
import { PermissionProvider } from './contexts/PermissionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SettingsProvider } from './contexts/SettingsContext';
import { SettingsButton } from './components/settings/SettingsButton';

function PrivateRoute({ children }: { children: ReactNode }) {
    const token = localStorage.getItem('token');
    return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
    return (
        <SettingsProvider>
            <ThemeProvider>
                <TooltipProvider>
                    <PermissionProvider>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route
                                    element={
                                        <PrivateRoute>
                                            <Layout />
                                        </PrivateRoute>
                                    }
                                >
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/users" element={<Users />} />
                                    <Route path="/roles" element={<Roles />} />
                                    <Route path="/logs" element={<Logs />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="/generator" element={<Generator />} />
                                    <Route path="/students" element={<Students />} />
                                    <Route path="/teachers" element={<Teachers />} />
                                    <Route path="/dict" element={<Dict />} />
                                // 仪表盘子页面
                                    <Route path="/dashboard/monitor" element={<div className="p-6"><h1 className="text-xl font-bold">监控页</h1><p className="text-muted-foreground mt-2">开发中...</p></div>} />
                                    <Route path="/dashboard/workplace" element={<div className="p-6"><h1 className="text-xl font-bold">工作台</h1><p className="text-muted-foreground mt-2">开发中...</p></div>} />
                                </Route>
                                <Route path="*" element={<Navigate to="/login" replace />} />
                            </Routes>
                            {/* ✅ 全局悬浮按钮 */}
                            <SettingsButton />
                        </BrowserRouter>
                    </PermissionProvider>
                </TooltipProvider>
            </ThemeProvider>
        </SettingsProvider>

    );
}

export default App;