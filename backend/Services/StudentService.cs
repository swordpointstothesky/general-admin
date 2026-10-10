using GeneralAdmin.Backend.Common;
using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Services;

public class StudentService : IStudentService
{
    private readonly AppDbContext _context;

    public StudentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StudentDto>> GetAllAsync()
    {
        return await _context.Students
            .Select(x => new StudentDto
            {
                Id = x.Id,
                Name = x.Name,
                Gender = x.Gender,
                Age = x.Age,
                Grade = x.Grade,
                ClassName = x.ClassName,
                CreateTime = DateTime.UtcNow,
                EnrollDate = x.EnrollDate,      // ✅ 新增
                Photo=x.Photo
            })
            .ToListAsync();
    }

    public async Task<StudentDto?> GetByIdAsync(int id)
    {
        var entity = await _context.Students.FindAsync(id);
        if (entity == null) return null;

        return new StudentDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Gender = entity.Gender,
            Age = entity.Age,
            Grade = entity.Grade,
            ClassName = entity.ClassName,
            CreateTime = entity.CreateTime,
            EnrollDate = entity.EnrollDate,      // ✅ 新增
            Photo = entity.Photo
        };
    }

    public async Task<StudentDto> CreateAsync(CreateStudentRequest request)
    {
        var entity = new Student
        {
            Name = request.Name,
            Gender = request.Gender,
            Age = request.Age,
            Grade = request.Grade,
            ClassName = request.ClassName,
            CreateTime = DateTime.UtcNow,
            EnrollDate = request.EnrollDate,  // ✅ 新增
            Photo = request.Photo
        };

        _context.Students.Add(entity);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("创建失败");
    }

    public async Task<bool> UpdateAsync(int id, UpdateStudentRequest request)
    {
        var entity = await _context.Students.FindAsync(id);
        if (entity == null) return false;

        if (!string.IsNullOrEmpty(request.Name))
            entity.Name = request.Name;
        if (!string.IsNullOrEmpty(request.Gender))
            entity.Gender = request.Gender;
        if (request.Age.HasValue)
            entity.Age = request.Age.Value;
        if (!string.IsNullOrEmpty(request.Grade))
            entity.Grade = request.Grade;
        if (!string.IsNullOrEmpty(request.ClassName))
            entity.ClassName = request.ClassName;
        if (request.EnrollDate.HasValue)
            entity.EnrollDate = request.EnrollDate.Value;
        if (request.Photo != null)
            entity.Photo = string.IsNullOrEmpty(request.Photo) ? null : request.Photo;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.Students.FindAsync(id);
        if (entity == null) return false;

        _context.Students.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ImportResult> ImportAsync(Stream excelStream)
    {
        var result = new ImportResult();

        // 1. 解析 Excel
        var rows = ExcelHelper.ReadExcel(excelStream);

        if (rows.Count == 0)
        {
            result.Errors.Add(new ImportError { Row = 0, Message = "Excel 中没有数据" });
            return result;
        }

        // 2. 获取字典映射（用于校验性别、年级）
        var genderValues = await _context.DictItems
            .Where(i => i.DictType.Name == "gender")
            .Select(i => i.Value)
            .ToListAsync();

        var gradeValues = await _context.DictItems
            .Where(i => i.DictType.Name == "student_grade")
            .Select(i => i.Value)
            .ToListAsync();

        var toInsert = new List<Student>();

        // 3. 逐行校验
        foreach (var row in rows)
        {
            var errors = new List<string>();

            // 姓名
            var name = row.Values.GetValueOrDefault("姓名")?.Trim();
            if (string.IsNullOrEmpty(name))
                errors.Add("姓名不能为空");
            else if (name.Length > 50)
                errors.Add("姓名不能超过 50 个字符");

            // 性别（Excel 里填中文，转成 value）
            var genderText = row.Values.GetValueOrDefault("性别")?.Trim();
            string? genderValue = null;
            if (string.IsNullOrEmpty(genderText))
            {
                errors.Add("性别不能为空");
            }
            else
            {
                var genderItem = await _context.DictItems
                    .Where(i => i.DictType.Name == "gender" &&
                                (i.Label == genderText || i.Value == genderText))
                    .Select(i => i.Value)
                    .FirstOrDefaultAsync();

                if (genderItem == null)
                    errors.Add($"性别「{genderText}」无效，请填写：男/女");
                else
                    genderValue = genderItem;
            }

            // 年龄
            var ageText = row.Values.GetValueOrDefault("年龄")?.Trim();
            int age = 0;
            if (string.IsNullOrEmpty(ageText))
                errors.Add("年龄不能为空");
            else if (!int.TryParse(ageText, out age))
                errors.Add("年龄必须是数字");
            else if (age < 1 || age > 200)
                errors.Add("年龄必须在 1-200 之间");

            // 年级（可选，用字典）
            var gradeText = row.Values.GetValueOrDefault("年级")?.Trim();
            string? gradeValue = null;
            if (!string.IsNullOrEmpty(gradeText))
            {
                var gradeItem = await _context.DictItems
                    .Where(i => i.DictType.Name == "student_grade" &&
                                (i.Label == gradeText || i.Value == gradeText))
                    .Select(i => i.Value)
                    .FirstOrDefaultAsync();

                if (gradeItem == null)
                    errors.Add($"年级「{gradeText}」无效");
                else
                    gradeValue = gradeItem;
            }

            // 班级
            var className = row.Values.GetValueOrDefault("班级")?.Trim();
            if (string.IsNullOrEmpty(className))
                errors.Add("班级不能为空");

            // 入学日期（可选）
            DateOnly? enrollDate = null;
            var enrollText = row.Values.GetValueOrDefault("入学日期")?.Trim();
            if (!string.IsNullOrEmpty(enrollText))
            {
                if (DateOnly.TryParse(enrollText, out var d))
                    enrollDate = d;
                else
                    errors.Add("入学日期格式错误，正确格式：2026-09-30");
            }

            // 有错误 → 记录
            if (errors.Count > 0)
            {
                result.FailedCount++;
                result.Errors.Add(new ImportError
                {
                    Row = row.RowIndex,
                    Message = string.Join("；", errors),
                });
                continue;
            }

            // 无错误 → 加入待插入列表
            toInsert.Add(new Student
            {
                Name = name!,
                Gender = genderValue!,
                Age = age,
                Grade = gradeValue ?? string.Empty,
                ClassName = className!,
                EnrollDate = enrollDate,
                CreateTime = DateTime.UtcNow,
            });
        }

        // 4. 批量插入
        if (toInsert.Count > 0)
        {
            _context.Students.AddRange(toInsert);
            await _context.SaveChangesAsync();
            result.SuccessCount = toInsert.Count;
        }

        return result;
    }

    public byte[] GenerateImportTemplate()
    {
        var headers = new[] { "姓名", "性别", "年龄", "年级", "班级", "入学日期" };
        return ExcelHelper.GenerateTemplate(headers, "学生导入模板");
    }
}