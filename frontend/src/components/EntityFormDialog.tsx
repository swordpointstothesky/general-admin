//import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { FileUpload } from '@/components/FileUpload';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    //SelectValue,
} from '@/components/ui/select';
export interface FormField {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'password' | 'textarea' | 'select' | 'date' | 'image' | 'switch';
    options?: { label: string; value: any }[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

interface EntityFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    fields: FormField[];
    formData: Record<string, any>;
    onFormChange: (data: Record<string, any>) => void;
    onSubmit: () => void | Promise<void>;
    submitting?: boolean;
    submitText?: string;
}

export function EntityFormDialog({
    open,
    onOpenChange,
    title,
    description,
    fields,
    formData,
    onFormChange,
    onSubmit,
    submitting = false,
    submitText = '保存',
}: EntityFormDialogProps) {
    const handleChange = (key: string, value: any) => {
        onFormChange({ ...formData, [key]: value });
    };

    const validate = (): string | null => {
        for (const field of fields) {
            if (!field.required) continue;
            const value = formData[field.key];

            // 空字符串、null、undefined 都算未填
            if (value === null || value === undefined || value === '') {
                return `请填写「${field.label}」`;
            }

            // 数字 0 也算有效，但 NaN 不算
            if (field.type === 'number' && isNaN(Number(value))) {
                return `「${field.label}」必须是数字`;
            }
        }
        return null;
    };

        return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* 
              关键改动：
              1. 使用 max-h-[90vh] 限制最高占屏幕 90%
              2. 使用 p-0 去掉默认 padding，由内部元素各自控制
              3. 使用 flex flex-col 让内容区分层级
            */}
            <DialogContent className="max-w-lg w-[95vw] sm:max-w-[500px] p-0 flex flex-col max-h-[90vh]">
                
                {/* 头部：固定不滚动 */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                {/* 表单内容区：唯一可滚动的区域 */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {fields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                            <Label htmlFor={`form-${field.key}`} className="text-sm">
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>

                            {field.type === 'select' ? (
                                <Select
                                    value={formData[field.key] ?? ''}
                                    onValueChange={(value) => handleChange(field.key, value ?? '')}
                                    disabled={field.disabled}
                                >
                                    <SelectTrigger className="w-full">
                                        <span
                                            className={cn(
                                                'flex-1 text-left truncate',
                                                !formData[field.key] && 'text-muted-foreground'
                                            )}
                                        >
                                            {field.options?.find(
                                                (o) => String(o.value) === String(formData[field.key])
                                            )?.label || '请选择'}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {field.options?.map((opt) => (
                                            <SelectItem key={opt.value} value={String(opt.value)}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : field.type === 'textarea' ? (
                                <textarea
                                    id={`form-${field.key}`}
                                    value={formData[field.key] ?? ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    disabled={field.disabled}
                                    placeholder={field.placeholder}
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
                                />
                            ) : field.type === 'date' ? (
                                <DatePicker
                                    value={formData[field.key] ?? ''}
                                    onChange={(v) => handleChange(field.key, v)}
                                    disabled={field.disabled}
                                    placeholder={`请选择${field.label}`}
                                />
                            ) : field.type === 'image' ? (
                                <FileUpload
                                    value={formData[field.key] ?? ''}
                                    onChange={(url) => handleChange(field.key, url)}
                                    imageOnly
                                    maxSize={5}
                                />
                            ) : field.type === 'switch' ? (
                                <div className="flex items-center h-10">
                                    <Switch
                                        id={`form-${field.key}`}
                                        checked={!!formData[field.key]}
                                        onCheckedChange={(v) => handleChange(field.key, v)}
                                        disabled={field.disabled}
                                    />
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        {formData[field.key] ? '是' : '否'}
                                    </span>
                                </div>
                            ) : (
                                <Input
                                    id={`form-${field.key}`}
                                    type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
                                    value={formData[field.key] ?? ''}
                                    onChange={(e) =>
                                        handleChange(
                                            field.key,
                                            field.type === 'number' ? Number(e.target.value) : e.target.value
                                        )
                                    }
                                    disabled={field.disabled}
                                    placeholder={field.placeholder}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* 底部：固定不滚动 */}
                <DialogFooter className="px-6 pb-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        onClick={async () => {
                            const error = validate();
                            if (error) {
                                toast.error(error);
                                return;
                            }
                            await onSubmit();
                        }}
                        disabled={submitting}
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}