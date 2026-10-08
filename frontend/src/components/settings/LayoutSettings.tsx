import { useSettings } from '@/contexts/SettingsContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function LayoutSettings() {
    const { settings, updateSettings } = useSettings();

    return (
        <>
            {/* ===== 间隙布局 ===== */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm">间隙布局</Label>
                    <Switch
                        checked={settings.gapLayout}
                        onCheckedChange={(v) => updateSettings({ gapLayout: v })}
                    />
                </div>
            </div>

            {/* ===== 顶栏 ===== */}
            <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">顶栏</div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">显示顶栏</Label>
                    <Switch
                        checked={settings.showHeader}
                        onCheckedChange={(v) => updateSettings({ showHeader: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">固定顶栏</Label>
                    <Switch
                        checked={settings.fixedHeader}
                        onCheckedChange={(v) => updateSettings({ fixedHeader: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">顶栏高度</Label>
                    <Input
                        type="number"
                        value={settings.headerHeight}
                        onChange={(e) => updateSettings({ headerHeight: Number(e.target.value) })}
                        className="w-24 h-8"
                    />
                </div>
            </div>

            {/* ===== 面包屑 ===== */}
            <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">面包屑</div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">显示面包屑</Label>
                    <Switch
                        checked={settings.showBreadcrumb}
                        onCheckedChange={(v) => updateSettings({ showBreadcrumb: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">显示面包屑图标</Label>
                    <Switch
                        checked={settings.showBreadcrumbIcon}
                        onCheckedChange={(v) => updateSettings({ showBreadcrumbIcon: v })}
                    />
                </div>
            </div>

            {/* ===== 页签 ===== */}
            <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">页签</div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">显示页签</Label>
                    <Switch
                        checked={settings.showTabs}
                        onCheckedChange={(v) => updateSettings({ showTabs: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">页签高度</Label>
                    <Input
                        type="number"
                        value={settings.tabHeight}
                        onChange={(e) => updateSettings({ tabHeight: Number(e.target.value) })}
                        className="w-24 h-8"
                    />
                </div>
            </div>

            {/* ===== 侧边栏 ===== */}
            <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">侧边栏</div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">显示侧边栏</Label>
                    <Switch
                        checked={settings.showSidebar}
                        onCheckedChange={(v) => updateSettings({ showSidebar: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">侧边栏宽度</Label>
                    <Input
                        type="number"
                        value={settings.sidebarWidth}
                        onChange={(e) => updateSettings({ sidebarWidth: Number(e.target.value) })}
                        className="w-24 h-8"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">折叠宽度</Label>
                    <Input
                        type="number"
                        value={settings.sidebarCollapseWidth}
                        onChange={(e) => updateSettings({ sidebarCollapseWidth: Number(e.target.value) })}
                        className="w-24 h-8"
                    />
                </div>
            </div>

            {/* ===== 其他 ===== */}
            <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">其他</div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">显示 Logo</Label>
                    <Switch
                        checked={settings.showLogo}
                        onCheckedChange={(v) => updateSettings({ showLogo: v })}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">隐藏布局边框</Label>
                    <Switch
                        checked={settings.hideLayoutBorder}
                        onCheckedChange={(v) => updateSettings({ hideLayoutBorder: v })}
                    />
                </div>
            </div>
        </>
    );
}