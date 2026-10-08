import { useEffect, useState } from 'react';
import api from '@/api';

export interface DictOption {
    label: string;
    value: string;
    color?: string;
    isDefault?: boolean;
}

// 内存缓存，避免同页面重复请求
const cache: Record<string, DictOption[]> = {};

export function useDict(typeName: string) {
    const [options, setOptions] = useState<DictOption[]>(cache[typeName] || []);
    const [loading, setLoading] = useState(!cache[typeName]);

    useEffect(() => {
        if (cache[typeName]) {
            setOptions(cache[typeName]);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        api.get(`/api/dict/items/by-name/${typeName}`)
            .then((res) => {
                if (cancelled) return;
                const list: DictOption[] = res.data.map((i: any) => ({
                    label: i.label,
                    value: i.value,
                    color: i.color,
                    isDefault: i.isDefault,
                }));
                cache[typeName] = list;
                setOptions(list);
            })
            .catch(() => {
                if (!cancelled) setOptions([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [typeName]);

    return { options, loading };
}

// 清空缓存（字典修改后调用）
export function clearDictCache(typeName?: string) {
    if (typeName) delete cache[typeName];
    else Object.keys(cache).forEach((k) => delete cache[k]);
}