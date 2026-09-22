import { useCallback, useEffect, useState } from 'react';

export function useFullscreen<T extends HTMLElement = HTMLDivElement>() {
    const [ref, setRef] = useState<T | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // 监听全屏状态变化
    useEffect(() => {
        const handler = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const enter = useCallback(() => {
        if (!ref) return;
        ref.requestFullscreen().catch((err) => {
            console.error('全屏失败:', err);
        });
    }, [ref]);

    const exit = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }, []);

    const toggle = useCallback(() => {
        if (isFullscreen) exit();
        else enter();
    }, [isFullscreen, enter, exit]);

    return { ref: setRef, isFullscreen, enter, exit, toggle };
}