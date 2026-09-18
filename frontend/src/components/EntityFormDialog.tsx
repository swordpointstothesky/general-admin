//import type { ReactNode } from 'react';
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
import { Loader2 } from 'lucide-react';

export interface FormField {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'password' | 'textarea' | 'select';
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {fields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                            <Label htmlFor={`form-${field.key}`} className="text-sm">
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>

                            {field.type === 'select' ? (
                                <select
                                    id={`form-${field.key}`}
                                    value={formData[field.key] ?? ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    disabled={field.disabled}
                                    className="w-full h-10 px-3 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                >
                                    <option value="">请选择</option>
                                    {field.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : field.type === 'textarea' ? (
                                <textarea
                                    id={`form-${field.key}`}
                                    value={formData[field.key] ?? ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    disabled={field.disabled}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-none"
                                />
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

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={onSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}