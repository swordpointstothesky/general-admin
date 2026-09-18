import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MenuItem {
    id: number;
    parentId: number | null;
    name: string;
    path: string;
    icon: string | null;
    children: MenuItem[];
}

interface MenuTreeProps {
    menus: MenuItem[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
}

export function MenuTree({ menus, selectedIds, onChange }: MenuTreeProps) {
    const toggleMenu = (id: number) => {
        const newIds = selectedIds.includes(id)
            ? selectedIds.filter((i) => i !== id)
            : [...selectedIds, id];
        onChange(newIds);
    };

    const renderMenu = (menu: MenuItem, level: number = 0) => {
        return (
            <div key={menu.id} className="space-y-1">
                <div
                    className="flex items-center space-x-2"
                    style={{ paddingLeft: `${level * 20}px` }}
                >
                    <Checkbox
                        id={`menu-${menu.id}`}
                        checked={selectedIds.includes(menu.id)}
                        onCheckedChange={() => toggleMenu(menu.id)}
                    />
                    <Label
                        htmlFor={`menu-${menu.id}`}
                        className="text-sm font-normal cursor-pointer"
                    >
                        {menu.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                            {menu.path}
                        </span>
                    </Label>
                </div>
                {menu.children && menu.children.length > 0 && (
                    <div className="space-y-1">
                        {menu.children.map((child) => renderMenu(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return <div className="space-y-2">{menus.map((menu) => renderMenu(menu))}</div>;
}