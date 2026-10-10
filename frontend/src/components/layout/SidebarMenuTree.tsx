import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
    LayoutDashboard,
    Settings,
    Code,
    FileText,
    Briefcase,
    Activity,
    Users,
    Shield,
    GraduationCap,
    UserCog,
    ChevronRight,
    BookOpen,
    Bell,
    MessageCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 图标映射
const iconMap: Record<string, any> = {
    LayoutDashboard,
    Settings,
    Code,
    FileText,
    Briefcase,
    Activity,
    Users,
    Shield,
    GraduationCap,
    UserCog,
    BookOpen,
    Bell,
    MessageCircle 
};

interface MenuItem {
    id: number;
    parentId: number | null;
    name: string;
    path: string;
    icon: string | null;
    children: MenuItem[];
}

interface SidebarMenuTreeProps {
    menus: MenuItem[];
    onNavigate?: () => void;
}

export function SidebarMenuTree({ menus, onNavigate }: SidebarMenuTreeProps) {
    const location = useLocation();

    // 判断某个菜单是否处于"激活"状态（自身或子菜单匹配当前路径）
    const isMenuActive = (item: MenuItem): boolean => {
        if (item.path === location.pathname) return true;
        if (item.children?.some((child) => isMenuActive(child))) return true;
        return false;
    };

    const renderMenuItem = (item: MenuItem) => {
        const Icon = item.icon ? iconMap[item.icon] : null;
        const hasChildren = item.children && item.children.length > 0;
        const isActive = isMenuActive(item);

        // 有子菜单
        if (hasChildren) {
            return (
                <CollapsibleMenuItem
                    key={item.id}
                    item={item}
                    Icon={Icon}
                    isActive={isActive}
                    location={location.pathname}
                    onNavigate={onNavigate}
                />
            );
        }

        // 无子菜单（叶子节点）
        return (
            <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                    render={<Link to={item.path} onClick={onNavigate} />}
                    isActive={location.pathname === item.path}
                    className="transition-all duration-200"
                >
                    {Icon && <Icon />}
                    <span>{item.name}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    };

    return (
        <SidebarMenu>
            {menus.map((item) => renderMenuItem(item))}
        </SidebarMenu>
    );
}

// ========== 带子菜单的可折叠项 ==========
function CollapsibleMenuItem({
    item,
    Icon,
    isActive,
    location,
    onNavigate,
}: {
    item: MenuItem;
    Icon: any;
    isActive: boolean;
    location: string;
    onNavigate?: () => void;
}) {
    const [open, setOpen] = useState(isActive);

    useEffect(() => {
        setOpen(isActive);
    }, [isActive]);

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => setOpen((v) => !v)}
                isActive={isActive}
                className="transition-all duration-200 cursor-pointer"
            >
                {Icon && <Icon />}
                <span>{item.name}</span>
                <ChevronRight
                    className={cn(
                        'ml-auto h-4 w-4 transition-transform duration-200',
                        open && 'rotate-90'
                    )}
                />
            </SidebarMenuButton>

            {open && (
                <SidebarMenuSub>
                    {item.children.map((child) => {
                        const ChildIcon = child.icon ? iconMap[child.icon] : null;
                        const childActive = location === child.path;

                        return (
                            <SidebarMenuSubItem key={child.id}>
                                <SidebarMenuSubButton
                                    render={<Link to={child.path} onClick={onNavigate} />}
                                    isActive={childActive}
                                >
                                    {ChildIcon && <ChildIcon />}
                                    <span>{child.name}</span>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        );
                    })}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    );
}