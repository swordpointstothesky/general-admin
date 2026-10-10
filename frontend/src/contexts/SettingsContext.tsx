import { createContext, useContext, useEffect, useState } from 'react';
import type {ReactNode} from 'react';
export type ThemeMode = 'light' | 'dark' | 'system';
export type TabStyle = 'chrome' | 'google';
export type ThemeStyle = 'pure' | 'skin';

export interface Settings {
    // ===== 主题 =====
    themeMode: ThemeMode;
    primaryColor: string;

    // ===== 布局 =====
    gapLayout: boolean;              // 间隙布局
    menuGroup: boolean;              // 菜单分组
    menuDivider: boolean;            // 菜单分割线

    // ===== 顶栏 =====
    showHeader: boolean;
    fixedHeader: boolean;
    headerHeight: number;

    // ===== 面包屑 =====
    showBreadcrumb: boolean;
    showBreadcrumbIcon: boolean;

    // ===== 页签 =====
    showTabs: boolean;
    showTabsIcon: boolean;
    tabHeight: number;
    tabStyle: TabStyle;

    // ===== 侧边栏 =====
    showSidebar: boolean;
    sidebarAccordion: boolean;
    sidebarCollapse: boolean;
    sidebarShowMenuName: boolean;
    sidebarCollapsedWidth: number;
    sidebarWidth: number;
    sidebarCollapseWidth: number;

    // ===== 底部 =====
    showFooter: boolean;
    fixedFooter: boolean;
    footerHeight: number;

    // ===== 小部件 =====
    enableI18n: boolean;
    enableFullscreen: boolean;
    enableRefresh: boolean;
    enableTheme: boolean;
    enableSidebarCollapse: boolean;
    enableNotification: boolean;

    // ===== 动画 =====
    enableProgress: boolean;

    // ===== 其他 =====
    showLogo: boolean;
    enlargeLogo: boolean;
    hideLayoutBorder: boolean;
    dynamicTitle: boolean;
    enableWatermark: boolean;

    // ===== 主题风格 =====
    themeStyle: ThemeStyle;
    transparentHeader: boolean;
    transparentSidebar: boolean;
}

// 默认配置
export const defaultSettings: Settings = {
    themeMode: 'light',
    primaryColor: '#1d63b9',

    gapLayout: true,
    menuGroup: false,
    menuDivider: false,

    showHeader: true,
    fixedHeader: true,
    headerHeight: 56,

    showBreadcrumb: true,
    showBreadcrumbIcon: true,

    showTabs: true,
    showTabsIcon: true,
    tabHeight: 47,
    tabStyle: 'chrome',

    showSidebar: true,
    sidebarAccordion: true,
    sidebarCollapse: false,
    sidebarShowMenuName: true,
    sidebarCollapsedWidth: 90,
    sidebarWidth: 250,
    sidebarCollapseWidth: 64,

    showFooter: true,
    fixedFooter: false,
    footerHeight: 70,

    enableI18n: true,
    enableFullscreen: true,
    enableRefresh: true,
    enableTheme: true,
    enableSidebarCollapse: true,
    enableNotification: true,

    enableProgress: true,

    showLogo: true,
    enlargeLogo: true,
    hideLayoutBorder: false,
    dynamicTitle: true,
    enableWatermark: false,

    themeStyle: 'pure',
    transparentHeader: false,
    transparentSidebar: false,
};

const STORAGE_KEY = 'app-settings';

interface SettingsContextType {
    settings: Settings;
    updateSettings: (patch: Partial<Settings>) => void;
    resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

    // ===== 持久化 =====
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    // ===== 应用主题模式 =====
    useEffect(() => {
        const root = document.documentElement;
        const applyTheme = (isDark: boolean) => {
            if (isDark) root.classList.add('dark');
            else root.classList.remove('dark');
        };

        if (settings.themeMode === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mq.matches);
            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        } else {
            applyTheme(settings.themeMode === 'dark');
        }
    }, [settings.themeMode]);

    // ===== 应用主题色 =====
    useEffect(() => {
        document.documentElement.style.setProperty('--primary', settings.primaryColor);
    }, [settings.primaryColor]);

    const updateSettings = (patch: Partial<Settings>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
    return ctx;
}