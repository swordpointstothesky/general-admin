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
import { LogOut, User as UserIcon } from 'lucide-react';
import { Header } from './layout/Header';
import { TabBar } from './layout/TabBar';
import type { TabItem } from './layout/TabBar';
import { SidebarMenuTree } from './layout/SidebarMenuTree';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';

// ========== 菜单类型 ==========
interface MenuItem {
    id: number;
    parentId: number | null;
    name: string;
    path: string;
    icon: string | null;
    children: MenuItem[];
}

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
    const { settings } = useSettings();

    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [tabs, setTabs] = useState<TabItem[]>(() => {
        const saved = localStorage.getItem(TABS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const location = useLocation();
    const navigate = useNavigate();
    const userInfo = parseUserFromToken();

    // ========== 获取菜单 ==========
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

    // ========== 获取头像 + 监听更新 ==========
    useEffect(() => {
        const fetchAvatar = () => {
            api.get('/api/profile').then((res) => {
                setAvatar(res.data.avatar || null);
            }).catch(() => { });
        };

        fetchAvatar();

        const handleAvatarUpdate = (e: Event) => {
            const customEvent = e as CustomEvent<string | null>;
            setAvatar(customEvent.detail);
        };

        window.addEventListener('avatar-updated', handleAvatarUpdate);
        return () => {
            window.removeEventListener('avatar-updated', handleAvatarUpdate);
        };
    }, []);

    // ========== 路由变化时自动添加标签 ==========
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

    // ========== 退出登录 ==========
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem(TABS_STORAGE_KEY);
        window.location.href = '/login';
    };

    // ========== Tab 操作 ==========
    const handleCloseTab = (key: string) => {
        setTabs((prev) => {
            const idx = prev.findIndex((t) => t.key === key);
            const newTabs = prev.filter((t) => t.key !== key);
            localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newTabs));

            if (key === location.pathname) {
                const next = newTabs[idx - 1] || newTabs[0];
                if (next) navigate(next.key);
                else navigate('/dashboard');
            }
            return newTabs;
        });
    };

    const handleCloseOthers = (key: string) => {
        const newTabs = tabs.filter((t) => t.key === key);
        setTabs(newTabs);
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newTabs));
        if (key !== location.pathname) navigate(key);
    };

    const handleCloseAll = () => {
        setTabs([]);
        localStorage.removeItem(TABS_STORAGE_KEY);
        navigate('/dashboard');
    };

    const handleCloseLeft = (key: string) => {
        const idx = tabs.findIndex((t) => t.key === key);
        if (idx <= 0) return;
        const newTabs = tabs.slice(idx);
        setTabs(newTabs);
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newTabs));
    };

    const handleCloseRight = (key: string) => {
        const idx = tabs.findIndex((t) => t.key === key);
        if (idx === -1) return;
        const newTabs = tabs.slice(0, idx + 1);
        setTabs(newTabs);
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newTabs));

        if (location.pathname !== key) {
            navigate(key);
        }
    };

    const handleReload = (key: string) => {
        if (key === location.pathname) {
            navigate(0 as any);
        } else {
            navigate(key);
        }
    };

    const handleFullscreen = (key: string) => {
        if (key !== location.pathname) {
            navigate(key);
        }

        setTimeout(() => {
            const el = document.getElementById('tab-content-area');
            if (!el) return;

            if (document.fullscreenElement) {
                document.exitFullscreen();
                return;
            }

            el.requestFullscreen().catch((err) => {
                console.error('全屏失败:', err);
            });
        }, 150);
    };

    return (
        <SidebarProvider
            style={{
                '--sidebar-width': `${settings.sidebarWidth}px`,
                '--sidebar-width-icon': `${settings.sidebarCollapseWidth}px`,
            } as React.CSSProperties}>
            <div
                className={cn(
                    'flex w-full h-screen',
                    settings.gapLayout ? 'gap-3' : 'gap-0'
                )}
                style={{ backgroundColor: 'var(--content-bg)' }}
            >
                {/* ===== 侧边栏 ===== */}
                {settings.showSidebar && (
                    <Sidebar>
                        <SidebarHeader>
                            {settings.showLogo && (
                                <div className="flex items-center gap-2 px-2 py-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                        <span className="text-sm font-bold">G</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">通用后台</span>
                                        <span className="text-xs text-muted-foreground">Admin</span>
                                    </div>
                                </div>
                            )}
                        </SidebarHeader>

                        <SidebarContent>
                            <SidebarGroup>
                                <SidebarGroupLabel>导航菜单</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    {loading ? (
                                        <SidebarMenu>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton disabled>
                                                    <span className="text-sm text-muted-foreground">加载中...</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        </SidebarMenu>
                                    ) : menus.length === 0 ? (
                                        <SidebarMenu>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton disabled>
                                                    <span className="text-sm text-muted-foreground">暂无菜单</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        </SidebarMenu>
                                    ) : (
                                        <SidebarMenuTree menus={menus} />
                                    )}
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
                )}

                {/* ===== 主内容区 ===== */}
                <SidebarInset className={cn(
                    'flex flex-col h-screen overflow-hidden',
                    settings.gapLayout ? 'mr-3' : 'mr-0'
                )}>
                    {settings.showHeader && (
                        <Header
                            username={userInfo.username}
                            roles={userInfo.roles}
                            onLogout={handleLogout}
                            avatar={avatar}
                        />
                    )}
                    {settings.showTabs && (
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
                    )}
                    <div
                        id="tab-content-area"
                        data-tab-content
                        className="flex-1 overflow-hidden py-3"
                        style={{ backgroundColor: 'var(--content-bg)' }}
                    >
                        <Outlet />
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}