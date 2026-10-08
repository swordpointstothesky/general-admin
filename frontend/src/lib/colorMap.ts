/**
 * Tailwind 不支持动态类名（如 `bg-${color}-100`），
 * 所以需要预定义所有可能的颜色组合。
 */
export const badgeColorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    // 兼容简写
    default: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function getBadgeColor(color?: string): string {
    if (!color) return badgeColorMap.default;
    return badgeColorMap[color] || badgeColorMap.default;
}

/**
 * 可供选择的颜色列表（用于字典管理页面）
 */
export const colorOptions = [
    { value: '', label: '默认（灰色）' },
    { value: 'blue', label: '蓝色' },
    { value: 'green', label: '绿色' },
    { value: 'red', label: '红色' },
    { value: 'orange', label: '橙色' },
    { value: 'yellow', label: '黄色' },
    { value: 'purple', label: '紫色' },
    { value: 'pink', label: '粉色' },
    { value: 'gray', label: '灰色' },
];