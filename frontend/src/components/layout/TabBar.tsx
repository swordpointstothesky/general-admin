import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    Maximize2,
    RotateCw,
    XCircle,
    MinusSquare,
    ArrowLeftToLine,
    ArrowRightToLine,
    Minus,
    ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem {
    key: string;
    title: string;
}

interface TabBarProps {
    tabs: TabItem[];
    activeKey: string;
    onClose: (key: string) => void;
    onCloseOthers: (key: string) => void;
    onCloseLeft: (key: string) => void;
    onCloseRight: (key: string) => void;
    onCloseAll: () => void;
    onReload: (key: string) => void;
    onFullscreen: (key: string) => void;
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    tabKey: string;
}

export function TabBar({
    tabs,
    activeKey,
    onClose,
    onCloseOthers,
    onCloseLeft,
    onCloseRight,
    onCloseAll,
    onReload,
    onFullscreen,
}: TabBarProps) {
    const navigate = useNavigate();
    const [menu, setMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        tabKey: '',
    });
    const menuRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭菜单
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenu((m) => ({ ...m, visible: false }));
            }
        };
        if (menu.visible) {
            document.addEventListener('mousedown', handler);
        }
        return () => document.removeEventListener('mousedown', handler);
    }, [menu.visible]);

    // 按 ESC 关闭菜单
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenu((m) => ({ ...m, visible: false }));
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    if (tabs.length === 0) return null;

    const handleContextMenu = (e: React.MouseEvent, tabKey: string) => {
        e.preventDefault();
        setMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            tabKey,
        });
    };

    const closeMenu = () => setMenu((m) => ({ ...m, visible: false }));

    // 判断当前 tab 在列表中的位置（用于禁用"关闭左侧/右侧"）
    const tabIndex = tabs.findIndex((t) => t.key === menu.tabKey);
    const hasLeft = tabIndex > 0;
    const hasRight = tabIndex < tabs.length - 1;

    // 菜单项组件
    const MenuItem = ({
        icon,
        label,
        onClick,
        disabled,
    }: {
        icon: ReactNode;
        label: string;
        onClick: () => void;
        disabled?: boolean;
    }) => (
        <button
            onClick={() => {
                if (disabled) return;
                onClick();
                closeMenu();
            }}
            disabled={disabled}
            className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-sm transition-colors',
                disabled
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            )}
        >
            <span className="w-4 h-4 flex-shrink-0">{icon}</span>
            <span>{label}</span>
        </button>
    );

    return (
        <>
            <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-background overflow-x-auto shrink-0">
                {tabs.map((tab) => {
                    const isActive = activeKey === tab.key;
                    return (
                        <div
                            key={tab.key}
                            onClick={() => navigate(tab.key)}
                            onContextMenu={(e) => handleContextMenu(e, tab.key)}
                            className={cn(
                                'group flex items-center gap-1.5 px-3 py-1 text-sm rounded-md cursor-pointer whitespace-nowrap transition-colors select-none',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <span>{tab.title}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose(tab.key);
                                }}
                                className={cn(
                                    'rounded-full p-0.5 opacity-60 hover:opacity-100 transition',
                                    isActive
                                        ? 'hover:bg-primary-foreground/20'
                                        : 'hover:bg-muted-foreground/20'
                                )}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* ===== 右键菜单 ===== */}
            {menu.visible && (
                <div
                    ref={menuRef}
                    className="fixed z-50 w-44 bg-popover text-popover-foreground border rounded-md shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
                    style={{
                        left: Math.min(menu.x, window.innerWidth - 180),
                        top: Math.min(menu.y, window.innerHeight - 340),
                    }}
                >
                    <MenuItem
                        icon={<Maximize2 className="h-4 w-4" />}
                        label="内容全屏"
                        onClick={() => onFullscreen(menu.tabKey)}
                    />
                    <MenuItem
                        icon={<RotateCw className="h-4 w-4" />}
                        label="重新加载"
                        onClick={() => onReload(menu.tabKey)}
                    />
                    <div className="my-1 h-px bg-border" />
                    <MenuItem
                        icon={<XCircle className="h-4 w-4" />}
                        label="关闭当前"
                        onClick={() => onClose(menu.tabKey)}
                    />
                    <MenuItem
                        icon={<MinusSquare className="h-4 w-4" />}
                        label="关闭其他"
                        onClick={() => onCloseOthers(menu.tabKey)}
                    />
                    <MenuItem
                        icon={<ArrowLeftToLine className="h-4 w-4" />}
                        label="关闭左侧"
                        onClick={() => onCloseLeft(menu.tabKey)}
                        disabled={!hasLeft}
                    />
                    <MenuItem
                        icon={<ArrowRightToLine className="h-4 w-4" />}
                        label="关闭右侧"
                        onClick={() => onCloseRight(menu.tabKey)}
                        disabled={!hasRight}
                    />
                    <MenuItem
                        icon={<Minus className="h-4 w-4" />}
                        label="关闭全部"
                        onClick={onCloseAll}
                    />
                    <div className="my-1 h-px bg-border" />
                    <MenuItem
                        icon={<ExternalLink className="h-4 w-4" />}
                        label="新窗口打开"
                        onClick={() => {
                            window.open(menu.tabKey, '_blank');
                        }}
                    />
                </div>
            )}
        </>
    );
}