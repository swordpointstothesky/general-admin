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
import Layout from './components/Layout';
import { PermissionProvider } from './contexts/PermissionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';

function PrivateRoute({ children }: { children: ReactNode }) {
    const token = localStorage.getItem('token');
    return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
    return (
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
                            </Route>
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </BrowserRouter>
                </PermissionProvider>
            </TooltipProvider>
        </ThemeProvider>
    );
}

export default App;