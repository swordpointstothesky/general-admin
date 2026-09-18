import type { ReactNode } from 'react';
import { usePermission } from '@/contexts/PermissionContext';

interface PermissionGuardProps {
    children: ReactNode;
    permission: string;          // 单个权限
    fallback?: ReactNode;        // 无权限时显示的内容
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
    const { hasPermission } = usePermission();
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}