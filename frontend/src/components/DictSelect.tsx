import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DictOption {
    label: string;
    value: string;
    isDefault?: boolean;
}

interface DictSelectProps {
    /** 当前值 */
    value?: string;
    /** 值变化回调 */
    onChange?: (value: string) => void;
    /** 字典选项 */
    options: DictOption[];
    /** 占位提示 */
    placeholder?: string;
    /** 是否允许"全部"选项（用于查询筛选） */
    allowAll?: boolean;
    /** 全部选项的文案 */
    allText?: string;
    /** 宽度类名 */
    className?: string;
    /** 是否禁用 */
    disabled?: boolean;
}

export function DictSelect({
    value = '',
    onChange,
    options,
    placeholder = '请选择',
    allowAll = false,
    allText = '全部',
    className,
    disabled = false,
}: DictSelectProps) {
    // 当前选中项
    const current = options.find((o) => String(o.value) === String(value));

    // 显示的文本
    const displayText = allowAll && !value
        ? allText
        : current?.label || placeholder;

    // 判断是否是"未选中"状态（灰色文字）
    const isPlaceholder = allowAll ? false : !current;

    return (
        <Select
            value={value || (allowAll ? 'all' : '')}
            onValueChange={(v) => {
                if (!onChange) return;
                onChange(v === 'all' ? '' : (v ?? ''));
            }}
            disabled={disabled}
        >
            <SelectTrigger className={cn('w-full', className)}>
                <span
                    className={cn(
                        'flex-1 text-left truncate',
                        isPlaceholder && 'text-muted-foreground'
                    )}
                >
                    {displayText}
                </span>
            </SelectTrigger>
            <SelectContent className="min-w-[260px]">
                {allowAll && <SelectItem value="all">{allText}</SelectItem>}
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}