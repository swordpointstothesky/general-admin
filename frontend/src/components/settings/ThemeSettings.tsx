import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';

const THEME_MODES = [
    { value: 'light' as const, label: '浅色', icon: Sun },
    { value: 'dark' as const, label: '深色', icon: Moon },
    { value: 'system' as const, label: '跟随系统', icon: Monitor },
];

// 预设主题色
const PRESET_COLORS = [
    '#1d63b9',  // 蓝
    '#10b981',  // 绿
    '#8b5cf6',  // 紫
    '#ef4444',  // 红
    '#f59e0b',  // 橙
    '#ec4899',  // 粉
    '#0ea5e9',  // 天蓝
    '#14b8a6',  // 青
    '#f43f5e',  // 玫红
    '#64748b',  // 灰蓝
];

export function ThemeSettings() {
    const { settings, updateSettings } = useSettings();

    return (
        <>
            {/* ===== 主题模式 ===== */}
            <div className="space-y-3">
                <div className="text-sm font-medium">主题模式</div>
                <div className="grid grid-cols-3 gap-2">
                    {THEME_MODES.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => updateSettings({ themeMode: value })}
                            className={cn(
                                'flex flex-col items-center justify-center gap-2 py-4 rounded-lg border-2 transition-all',
                                settings.themeMode === value
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border hover:border-primary/50 text-muted-foreground'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== 主题色 ===== */}
            <div className="space-y-3">
                <div className="text-sm font-medium">主题色</div>
                <div className="grid grid-cols-5 gap-3">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            onClick={() => updateSettings({ primaryColor: color })}
                            className={cn(
                                'h-10 rounded-lg transition-all relative',
                                settings.primaryColor === color
                                    ? 'ring-2 ring-offset-2 ring-primary scale-110'
                                    : 'hover:scale-105'
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                        >
                            {settings.primaryColor === color && (
                                <span className="absolute inset-0 flex items-center justify-center text-white text-lg">
                                    ✓
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* 自定义颜色 */}
                <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-muted-foreground">自定义：</span>
                    <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                        className="h-8 w-16 rounded cursor-pointer border"
                    />
                    <code className="text-xs text-muted-foreground">
                        {settings.primaryColor}
                    </code>
                </div>
            </div>
        </>
    );
}