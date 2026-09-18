import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '@/api';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from '@/components/ui/sidebar';
import {
    LayoutDashboard,
    Users,
    Shield,
    FileText,
    LogOut,
    User as UserIcon,
    Code,
} from 'lucide-react';
import { Header } from './layout/Header';
import { TabBar } from './layout/TabBar';
import type { TabItem } from './layout/TabBar';

// ========== 菜单类型 ==========
interface MenuItem {
    id: number;
    parentId: number | null;
    name: string;
    path: string;
    icon: string | null;
    children: MenuItem[];
}

const iconMap: Record<string, any> = {
    LayoutDashboard,
    Users,
    Shield,
    FileText,
    User: UserIcon,
    Code,
};

const TABS_STORAGE_KEY = 'open-tabs';

// ========== 从 JWT 中解析用户信息 ==========
function parseUserFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return { username: '', roles: [] };
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const username =
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '';
        const roleRaw =
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        const roles = Array.isArray(roleRaw) ? roleRaw : roleRaw ? [roleRaw] : [];
        return { username, roles };
    } catch {
        return { username: '', roles: [] };
    }
}

// ========== 主布局 ==========
export default function Layout() {
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tabs, setTabs] = useState<TabItem[]>(() => {
        const saved = localStorage.getItem(TABS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const location = useLocation();
    const navigate = useNavigate();
    const userInfo = parseUserFromToken();

    // 获取菜单
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

    // 路由变化时自动添加标签
    useEffect(() => {
        const findMenuName = (items: MenuItem[], path: string): string | null => {
            for (const item of items) {
                if (item.path === path) return item.name;
                if (item.children && item.children.length) {
                    const found = findMenuName(item.children, path);
                    if (found) return found;
                }
            }
            return null;
        };

        const path = location.pathname;
        if (!path || path === '/login') return;

        const title =
            findMenuName(menus, path) || (path === '/profile' ? '个人中心' : path);

        setTabs((prev) => {
            if (prev.find((t) => t.key === path)) return prev;
            const newTabs = [...prev, { key: path, title }];
            localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newTabs));
            return newTabs;
        });
    }, [location.pathname, menus]);

    // 退出登录
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem(TABS_STORAGE_KEY);
        window.location.href = '/login';
    };

    // 关闭标签
    const handleCloseTab = (key: string) => {
        setTabs((prev) => {
            const idx = prev.findIndex((t) => t.key === key);
            const newTabs = prev.filter((t) => t.key !== key);
            localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newTabs));

            // 如果关闭的是当前标签，跳转到相邻标签
            if (key === location.pathname) {
                const next = newTabs[idx - 1] || newTabs[0];
                if (next) navigate(next.key);
                else navigate('/dashboard');
            }
            return newTabs;
        });
    };

    // 关闭其他
    const handleCloseOthers = (key: string) => {
        const newTabs = tabs.filter((t) => t.key === key);
        setTabs(newTabs);
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newTabs));
        if (key !== location.pathname) navigate(key);
    };

    // 关闭所有
    const handleCloseAll = () => {
        setTabs([]);
        localStorage.removeItem(TABS_STORAGE_KEY);
        navigate('/dashboard');
    };

    // 关闭左侧
    const handleCloseLeft = (key: string) => {
        const idx = tabs.findIndex((t) => t.key === key);
        if (idx <= 0) return;
        const newTabs = tabs.slice(idx);
        setTabs(newTabs);
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newTabs));
    };

    // 关闭右侧
    const handleCloseRight = (key: string) => {
        const idx = tabs.findIndex((t) => t.key === key);
        if (idx === -1) return;
        const newTabs = tabs.slice(0, idx + 1);
        setTabs(newTabs);
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newTabs));

        // 如果当前页面被关闭了，跳转到 key 对应页
        if (location.pathname !== key) {
            navigate(key);
        }
    };

    // 重新加载（相当于刷新当前页面）
    const handleReload = (key: string) => {
        if (key === location.pathname) {
            // 当前页面：重新挂载（通过 key 变化触发）
            navigate(0 as any); // React Router 的刷新技巧
        } else {
            navigate(key);
        }
    };

    // 内容全屏
    const handleFullscreen = (key: string) => {
        // 如果目标 Tab 不是当前 Tab，先跳转
        if (key !== location.pathname) {
            navigate(key);
        }

        // 延迟一点，等 React 渲染完成
        setTimeout(() => {
            const el = document.getElementById('tab-content-area');

            if (!el) {
                console.warn('未找到内容区元素');
                return;
            }

            // 如果已经在全屏，先退出
            if (document.fullscreenElement) {
                document.exitFullscreen();
                return;
            }

            // 请求内容区全屏
            el.requestFullscreen().catch((err) => {
                console.error('全屏失败:', err);
            });
        }, 150);
    };
    return (
        <SidebarProvider>
            {/* ===== 侧边栏 ===== */}
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 px-2 py-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <span className="text-sm font-bold">G</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">通用后台</span>
                            <span className="text-xs text-muted-foreground">Admin</span>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>导航菜单</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {loading ? (
                                    <SidebarMenuItem>
                                        <SidebarMenuButton disabled>
                                            <span className="text-sm text-muted-foreground">
                                                加载中...
                                            </span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ) : menus.length === 0 ? (
                                    <SidebarMenuItem>
                                        <SidebarMenuButton disabled>
                                            <span className="text-sm text-muted-foreground">
                                                暂无菜单
                                            </span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ) : (
                                    menus.map((item) => {
                                        const Icon = item.icon ? iconMap[item.icon] : null;
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <SidebarMenuItem key={item.id}>
                                                <SidebarMenuButton
                                                    isActive={isActive}
                                                    render={<Link to={item.path} />}
                                                >
                                                    {Icon && <Icon />}
                                                    <span>{item.name}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })
                                )}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                isActive={location.pathname === '/profile'}
                                render={<Link to="/profile" />}
                            >
                                <UserIcon />
                                <span>个人中心</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout}>
                                <LogOut />
                                <span>退出登录</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            {/* ===== 主内容区 ===== */}
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
                <Header
                    username={userInfo.username}
                    roles={userInfo.roles}
                    onLogout={handleLogout}
                />
                <TabBar
                    tabs={tabs}
                    activeKey={location.pathname}
                    onClose={handleCloseTab}
                    onCloseOthers={handleCloseOthers}
                    onCloseLeft={handleCloseLeft}
                    onCloseRight={handleCloseRight}
                    onCloseAll={handleCloseAll}
                    onReload={handleReload}
                    onFullscreen={handleFullscreen}
                />
                <div
                    id="tab-content-area"
                    data-tab-content
                    className="flex-1 overflow-auto p-6 bg-background"
                >
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}