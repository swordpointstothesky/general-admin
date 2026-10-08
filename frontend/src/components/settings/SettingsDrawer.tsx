import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSettings } from './ThemeSettings';
import { LayoutSettings } from './LayoutSettings';
import { StyleSettings } from './StyleSettings';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

interface SettingsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
    const { resetSettings } = useSettings();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[450px] p-0 flex flex-col">
                <SheetHeader className="px-6 pt-6 pb-4 border-b">
                    <SheetTitle>系统设置</SheetTitle>
                    <SheetDescription>自定义你的系统外观与布局</SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="theme" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="mx-6 mt-4 grid grid-cols-3">
                        <TabsTrigger value="theme">主题设置</TabsTrigger>
                        <TabsTrigger value="layout">框架布局</TabsTrigger>
                        <TabsTrigger value="style">主题风格</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <TabsContent value="theme" className="mt-0 space-y-6">
                            <ThemeSettings />
                        </TabsContent>
                        <TabsContent value="layout" className="mt-0 space-y-6">
                            <LayoutSettings />
                        </TabsContent>
                        <TabsContent value="style" className="mt-0 space-y-6">
                            <StyleSettings />
                        </TabsContent>
                    </div>

                    {/* 底部按钮 */}
                    <div className="border-t px-6 py-3 flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={resetSettings}
                        >
                            <RotateCcw className="mr-1.5 h-4 w-4" />
                            重置配置
                        </Button>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}