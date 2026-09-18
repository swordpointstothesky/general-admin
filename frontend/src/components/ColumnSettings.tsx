import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    
} from '@dnd-kit/core';
import type {
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GripVertical, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnSettingItem {
    key: string;
    title: string;
    visible: boolean;
    fixed?: boolean;  // 固定列，不可隐藏/拖拽
}

interface ColumnSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    columns: ColumnSettingItem[];
    onSave: (columns: ColumnSettingItem[]) => void;
}

// ========== 单行可拖拽项 ==========
function SortableItem({
    item,
    onToggle,
}: {
    item: ColumnSettingItem;
    onToggle: (key: string, checked: boolean) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.key, disabled: item.fixed });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border bg-background',
                isDragging && 'shadow-lg z-50',
                item.fixed && 'opacity-60'
            )}
        >
            {/* 拖拽手柄 */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                disabled={item.fixed}
                className={cn(
                    'text-muted-foreground',
                    item.fixed
                        ? 'cursor-not-allowed opacity-30'
                        : 'cursor-grab active:cursor-grabbing hover:text-foreground'
                )}
            >
                <GripVertical className="h-4 w-4" />
            </button>

            {/* 复选框 */}
            <Checkbox
                checked={item.visible}
                disabled={item.fixed}
                onCheckedChange={(v) => onToggle(item.key, !!v)}
                id={`col-${item.key}`}
            />

            {/* 列名 */}
            <Label
                htmlFor={`col-${item.key}`}
                className={cn(
                    'flex-1 text-sm cursor-pointer',
                    item.fixed && 'cursor-not-allowed'
                )}
            >
                {item.title}
                {item.fixed && (
                    <span className="ml-2 text-xs text-muted-foreground">(固定)</span>
                )}
            </Label>
        </div>
    );
}

// ========== 主弹窗 ==========
export function ColumnSettings({
    open,
    onOpenChange,
    columns,
    onSave,
}: ColumnSettingsProps) {
    const [items, setItems] = useState<ColumnSettingItem[]>(columns);

    // 每次打开时同步外部状态
    useEffect(() => {
        if (open) {
            setItems(columns);
        }
    }, [open, columns]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // 拖拽结束
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setItems((prev) => {
            const oldIndex = prev.findIndex((i) => i.key === active.id);
            const newIndex = prev.findIndex((i) => i.key === over.id);
            return arrayMove(prev, oldIndex, newIndex);
        });
    };

    // 切换显示
    const handleToggle = (key: string, checked: boolean) => {
        setItems((prev) =>
            prev.map((item) => (item.key === key ? { ...item, visible: checked } : item))
        );
    };

    // 重置
    const handleReset = () => {
        setItems(columns.map((c) => ({ ...c, visible: true })));
    };

    // 保存
    const handleSave = () => {
        onSave(items);
        onOpenChange(false);
    };

    const visibleCount = items.filter((i) => i.visible).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>列设置</DialogTitle>
                    <DialogDescription>
                        勾选显示列，拖拽调整列顺序
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 max-h-[400px] overflow-y-auto py-2 pr-1">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map((i) => i.key)}
                            strategy={verticalListSortingStrategy}
                        >
                            {items.map((item) => (
                                <SortableItem
                                    key={item.key}
                                    item={item}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            重置
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            已选 {visibleCount} / {items.length}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button onClick={handleSave} disabled={visibleCount === 0}>
                            确定
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}