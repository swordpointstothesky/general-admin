import { useLocation } from 'react-router-dom';
import { Fragment, useState, useRef, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Search, Moon, Sun, Maximize, Globe, Bell } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { UserDropdown } from './UserDropdown';

const breadcrumbMap: Record<string, string[]> = {
    '/dashboard': ['首页', '仪表盘'],
    '/users': ['系统管理', '用户管理'],
    '/roles': ['系统管理', '角色管理'],
    '/logs': ['系统管理', '操作日志'],
    '/profile': ['个人中心'],
    '/generator': ['开发工具', '代码生成'],
    '/students': ['业务管理', '学生管理'],
};

interface HeaderProps {
    username: string;
    email?: string;
    roles: string[];
    onLogout: () => void;
}

export function Header({ username, email, roles, onLogout }: HeaderProps) {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const breadcrumbs = breadcrumbMap[location.pathname] || ['首页'];

    const [searchOpen, setSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    };

    return (
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 shrink-0">
            {/* 左侧：折叠按钮 + 面包屑 */}
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((item, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <Fragment key={item}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{item}</BreadcrumbPage>
                                        ) : (
                                            <span className="text-muted-foreground">{item}</span>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* 右侧：功能按钮 */}
            <div className="flex items-center gap-1">
                {/* 搜索 */}
                <div className="relative" ref={searchRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="搜索 (Ctrl+K)"
                        onClick={() => setSearchOpen((v) => !v)}
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                    {searchOpen && (
                        <div className="absolute right-0 top-10 w-80 bg-popover text-popover-foreground border rounded-md shadow-md p-4 z-50">
                            <p className="text-sm text-muted-foreground text-center py-6">
                                搜索功能开发中...
                            </p>
                        </div>
                    )}
                </div>

                {/* 主题切换 */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleTheme}
                    title={theme === 'dark' ? '切换浅色' : '切换深色'}
                >
                    {theme === 'dark' ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </Button>

                {/* 全屏 */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleFullscreen}
                    title="全屏"
                >
                    <Maximize className="h-4 w-4" />
                </Button>

                {/* 语言 */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="切换语言"
                >
                    <Globe className="h-4 w-4" />
                </Button>

                {/* 通知 */}
                <div className="relative" ref={notifRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 relative"
                        title="通知"
                        onClick={() => setNotifOpen((v) => !v)}
                    >
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                    </Button>
                    {notifOpen && (
                        <div className="absolute right-0 top-10 w-80 bg-popover text-popover-foreground border rounded-md shadow-md p-4 z-50">
                            <p className="text-sm text-muted-foreground text-center py-6">
                                暂无通知
                            </p>
                        </div>
                    )}
                </div>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* 用户下拉菜单 */}
                <UserDropdown
                    username={username}
                    email={email}
                    roles={roles}
                    onLogout={onLogout}
                />
            </div>
        </header>
    );
}