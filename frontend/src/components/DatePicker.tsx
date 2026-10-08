import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function DatePicker({
    value,
    onChange,
    placeholder = '选择日期',
    disabled = false,
    className,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);

    const date = value ? new Date(value) : undefined;
    const isValid = date && !isNaN(date.getTime());

    const displayText = isValid ? format(date!, 'yyyy-MM-dd') : placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            'w-full h-10 justify-start text-left font-normal px-3',
                            !isValid && 'text-muted-foreground',
                            className
                        )}
                    />
                }
            >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
                <span className="truncate">{displayText}</span>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    locale={zhCN}          
                    selected={isValid ? date : undefined}
                    onSelect={(d) => {
                        if (d) {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            onChange?.(`${y}-${m}-${day}`);
                        } else {
                            onChange?.('');
                        }
                        setOpen(false);
                    }}
                />
                {isValid && (
                    <div className="border-t px-3 py-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                                onChange?.('');
                                setOpen(false);
                            }}
                        >
                            清除
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}