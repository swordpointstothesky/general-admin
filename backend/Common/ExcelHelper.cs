using ClosedXML.Excel;

namespace GeneralAdmin.Backend.Common;

public class ExcelRow
{
    /// <summary>Excel 中的行号（从 2 开始，因为第 1 行是表头）</summary>
    public int RowIndex { get; set; }

    /// <summary>列名 → 值</summary>
    public Dictionary<string, string> Values { get; set; } = new();
}

public static class ExcelHelper
{
    /// <summary>
    /// 读取 Excel 第一个 sheet，第 1 行为表头
    /// </summary>
    public static List<ExcelRow> ReadExcel(Stream stream)
    {
        var result = new List<ExcelRow>();

        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheet(1);
        var usedRange = sheet.RangeUsed();

        if (usedRange == null)
            return result;

        // 读取表头（第 1 行）
        var headerRow = sheet.Row(1);
        var headers = new Dictionary<int, string>();
        for (int col = 1; col <= usedRange.ColumnCount(); col++)
        {
            var header = headerRow.Cell(col).GetString().Trim();
            if (!string.IsNullOrEmpty(header))
                headers[col] = header;
        }

        // 读取数据行
        for (int row = 2; row <= usedRange.LastRowUsed()!.RowNumber(); row++)
        {
            var excelRow = new ExcelRow { RowIndex = row };

            foreach (var (col, header) in headers)
            {
                var value = sheet.Cell(row, col).GetString().Trim();
                excelRow.Values[header] = value;
            }

            // 跳过全空行
            if (excelRow.Values.Values.All(string.IsNullOrWhiteSpace))
                continue;

            result.Add(excelRow);
        }

        return result;
    }

    /// <summary>
    /// 生成 Excel 模板
    /// </summary>
    public static byte[] GenerateTemplate(string[] headers, string sheetName = "Sheet1")
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(sheetName);

        // 写表头
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = sheet.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // 设置列宽
        sheet.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}