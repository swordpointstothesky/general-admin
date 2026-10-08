import { useSettings } from '@/contexts/SettingsContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function StyleSettings() {
    const { settings, updateSettings } = useSettings();

    return (
        <>
            {/* ===== 主题风格 ===== */}
            <div className="space-y-3">
                <div className="text-sm font-medium">主题风格</div>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'pure' as const, label: '纯色主题' },
                        { value: 'skin' as const, label: '主题皮肤' },
                    ].map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => updateSettings({ themeStyle: value })}
                            className={cn(
                                'py-3 rounded-lg border-2 text-sm transition-all',
                                settings.themeStyle === value
                                    ? 'border-primary bg-primary/5 text-primary font-medium'
                                    : 'border-border text-muted-foreground hover:border-primary/50'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== 透明度 ===== */}
            <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">透明度</div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">顶部透明</Label>
                    <Switch
                        checked={settings.transparentHeader}
                        onCheckedChange={(v) => updateSettings({ transparentHeader: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">侧边栏透明</Label>
                    <Switch
                        checked={settings.transparentSidebar}
                        onCheckedChange={(v) => updateSettings({ transparentSidebar: v })}
                    />
                </div>
            </div>
        </>
    );
}