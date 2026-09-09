import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    LogOut,
    LayoutDashboard,
    Users,
    Shield,
    // ... 添加其他图标
} from 'lucide-react';
import api from '@/api';

// ========== 菜单项类型 ==========
interface MenuItem {
    id: number;
    parentId: number | null;
    name: string;
    path: string;
    icon: string | null;
    children: MenuItem[];
}

// ========== 图标映射 ==========
const iconMap: Record<string, any> = {
    LayoutDashboard,
    Users,
    Shield,
    // 添加更多图标映射...
};

// ========== 递归渲染菜单 ==========
function MenuItem({ item, collapsed }: { item: MenuItem; collapsed: boolean }) {
    const location = useLocation();
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon ? iconMap[item.icon] : null;
    const isActive = location.pathname === item.path;

    if (!hasChildren) {
        return (
            <Link to={item.path}>
                <div
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                        isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                        collapsed && "justify-center px-2"
                    )}
                >
                    {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                    {!collapsed && <span className="text-sm">{item.name}</span>}
                </div>
            </Link>
        );
    }

    // 有子菜单（递归）
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 text-gray-600">
                {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </div>
            <div className="ml-4 space-y-1">
                {item.children.map((child) => (
                    <MenuItem key={child.id} item={child} collapsed={collapsed} />
                ))}
            </div>
        </div>
    );
}

// ========== 主布局组件 ==========
export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    // 获取菜单数据
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const response = await api.get('/api/menus/my');
                setMenus(response.data);
            } catch (error) {
                console.error('获取菜单失败:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenus();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-400">加载中...</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* ===== 侧边栏 ===== */}
            <aside
                className={cn(
                    "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
                    collapsed ? "w-16" : "w-56"
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    {!collapsed && (
                        <span className="text-lg font-bold text-emerald-700">后台管理</span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                </div>

                {/* 菜单列表 */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {menus.map((item) => (
                        <MenuItem key={item.id} item={item} collapsed={collapsed} />
                    ))}
                </nav>

                {/* 底部：退出按钮 */}
                <div className="p-3 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm">退出登录</span>}
                    </button>
                </div>
            </aside>

            {/* ===== 主内容区 ===== */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}