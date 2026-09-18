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
                CreateTime = x.CreateTime,
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
            CreateTime = request.CreateTime,
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
        if (!string.IsNullOrEmpty(request.CreateTime))
            entity.CreateTime = request.CreateTime;

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
}