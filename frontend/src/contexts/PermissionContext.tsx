import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface PermissionContextType {
    permissions: string[];
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (perms: string[]) => boolean;
    hasAllPermissions: (perms: string[]) => boolean;
    loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// 从 JWT Token 中解析权限
const getPermissionsFromToken = (): string[] => {
    const token = localStorage.getItem('token');
    if (!token) return [];

    try {
        const decoded: any = jwtDecode(token);
        // 支持两种格式：字符串数组或单个字符串
        const perms = decoded.Permission;
        if (Array.isArray(perms)) return perms;
        if (typeof perms === 'string') return [perms];
        return [];
    } catch {
        return [];
    }
};

export function PermissionProvider({ children }: { children: ReactNode }) {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPermissions = () => {
            const perms = getPermissionsFromToken();
            setPermissions(perms);
            setLoading(false);
        };

        loadPermissions();

        // 监听自定义事件，用于登录后重新加载权限
        const handlePermissionsUpdate = () => loadPermissions();
        window.addEventListener('permissions-update', handlePermissionsUpdate);

        return () => {
            window.removeEventListener('permissions-update', handlePermissionsUpdate);
        };
    }, []);

    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (perms: string[]): boolean => {
        return perms.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (perms: string[]): boolean => {
        return perms.every(p => permissions.includes(p));
    };

    return (
        <PermissionContext.Provider
            value={{ permissions, hasPermission, hasAnyPermission, hasAllPermissions, loading }}
        >
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermission() {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermission must be used within a PermissionProvider');
    }
    return context;
}