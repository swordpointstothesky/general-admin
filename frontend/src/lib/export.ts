import * as XLSX from 'xlsx';

export interface ExportColumn {
    key: string;
    title: string;
    /** 自定义导出值（如格式化日期、把枚举转成中文） */
    format?: (value: any, record: any) => any;
}

/**
 * 导出数据为 Excel 文件
 * @param data 数据数组
 * @param columns 列配置
 * @param filename 文件名（不含扩展名）
 * @param sheetName 工作表名
 */
export function exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn[],
    filename = 'export',
    sheetName = 'Sheet1'
) {
    if (!data || data.length === 0) {
        alert('没有可导出的数据');
        return;
    }

    // 构造表头 + 数据行
    const header = columns.map((c) => c.title);

    const rows = data.map((record) => {
        return columns.map((col) => {
            const value = col.key
                .split('.')
                .reduce((obj: any, k) => obj?.[k], record);
            return col.format ? col.format(value, record) : value ?? '';
        });
    });

    // 构造工作表
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);

    // 设置列宽（根据表头长度粗略估算）
    worksheet['!cols'] = columns.map((c) => ({
        wch: Math.max(c.title.length * 2 + 4, 12),
    }));

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 触发下载
    const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, '-');
    XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
}

/**
 * 导出带自定义字段名的数据（更简单）
 */
export function exportSimpleExcel<T extends Record<string, any>>(
    data: T[],
    fieldMap: Record<string, string>,
    filename = 'export',
    sheetName = 'Sheet1'
) {
    const columns: ExportColumn[] = Object.entries(fieldMap).map(
        ([key, title]) => ({ key, title })
    );
    exportToExcel(data, columns, filename, sheetName);
}