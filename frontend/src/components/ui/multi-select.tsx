import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'> {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = '请选择',
  className,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.filter((option) => value.includes(option.value));

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }

    onChange([...value, optionValue]);
  };

  return (
    <div ref={ref} className="relative w-full">
      <Button
        type="button"
        variant="outline"
        className={cn(
          'h-auto min-h-10 w-full justify-between rounded-md border border-input bg-background px-3 py-2 text-left shadow-sm transition-colors hover:bg-accent/50',
          className,
        )}
        onClick={() => setOpen((prev) => !prev)}
        {...props}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selected.length > 0 ? (
            selected.map((option) => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-xs"
              >
                {option.label}
                <span
                  className="cursor-pointer rounded-sm p-0.5 hover:bg-muted-foreground/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggle(option.value);
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-border bg-popover p-1 shadow-md">
          {options.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">暂无可选项</div>
          ) : (
            options.map((option) => {
              const checked = value.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggle(option.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent',
                    checked && 'bg-accent',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-[4px] border border-input bg-background',
                      checked && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
