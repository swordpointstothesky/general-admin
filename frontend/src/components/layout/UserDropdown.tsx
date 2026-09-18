import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, KeyRound, LogOut, ChevronDown } from 'lucide-react';

export function UserDropdown({ username, email, roles, onLogout }: any) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const initial = username ? username.charAt(0).toUpperCase() : '?';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition"
            >
                <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-yellow-400 text-yellow-900 text-xs font-medium">
                        {initial}
                    </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{username}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {open && (
                <div className="absolute right-0 top-11 w-64 bg-popover text-popover-foreground border rounded-md shadow-md z-50">
                    <div className="flex items-center gap-3 p-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-yellow-400 text-yellow-900 text-sm font-medium">
                                {initial}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{username}</span>
                                {roles[0] && (
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                        {roles[0]}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                {email || '未设置邮箱'}
                            </p>
                        </div>
                    </div>
                    <div className="border-t" />
                    <Link
                        to="/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                        <User className="h-4 w-4" />
                        个人中心
                    </Link>
                    <Link
                        to="/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                        <KeyRound className="h-4 w-4" />
                        修改密码
                    </Link>
                    <div className="border-t" />
                    <div className="p-2">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition"
                        >
                            <LogOut className="h-4 w-4" />
                            退出登录
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}