import { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsDrawer } from './SettingsDrawer';
import { cn } from '@/lib/utils';

export function SettingsButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* 悬浮按钮 */}
            <button
                onClick={() => setOpen(true)}
                className={cn(
                    'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full',
                    'bg-primary text-primary-foreground shadow-lg',
                    'flex items-center justify-center',
                    'hover:scale-110 active:scale-95 transition-transform',
                    'group'
                )}
                title="系统设置"
            >
                <Settings
                    className={cn(
                        'h-5 w-5 transition-transform duration-300',
                        open ? 'rotate-90' : 'group-hover:rotate-90'
                    )}
                />
            </button>

            {/* 抽屉 */}
            <SettingsDrawer open={open} onOpenChange={setOpen} />
        </>
    );
}