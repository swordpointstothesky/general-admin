using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Services;

public class TeacherService : ITeacherService
{
    private readonly AppDbContext _context;

    public TeacherService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TeacherDto>> GetAllAsync()
    {
        return await _context.Teachers
            .Select(x => new TeacherDto
            {
                Id = x.Id,
                Name = x.Name,
                Gender = x.Gender,
                Age = x.Age,
                CreateTime = x.CreateTime,
            })
            .ToListAsync();
    }

    public async Task<TeacherDto?> GetByIdAsync(int id)
    {
        var entity = await _context.Teachers.FindAsync(id);
        if (entity == null) return null;

        return new TeacherDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Gender = entity.Gender,
            Age = entity.Age,
            CreateTime = entity.CreateTime,
        };
    }

    public async Task<TeacherDto> CreateAsync(CreateTeacherRequest request)
    {
        var entity = new Teacher
        {
            Name = request.Name,
            Gender = request.Gender,
            Age = request.Age,
            CreateTime = request.CreateTime,
        };

        _context.Teachers.Add(entity);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("创建失败");
    }

    public async Task<bool> UpdateAsync(int id, UpdateTeacherRequest request)
    {
        var entity = await _context.Teachers.FindAsync(id);
        if (entity == null) return false;

        if (!string.IsNullOrEmpty(request.Name))
            entity.Name = request.Name;
        if (!string.IsNullOrEmpty(request.Gender))
            entity.Gender = request.Gender;
        if (request.Age.HasValue)
            entity.Age = request.Age.Value;
        if (!string.IsNullOrEmpty(request.CreateTime))
            entity.CreateTime = request.CreateTime;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.Teachers.FindAsync(id);
        if (entity == null) return false;

        _context.Teachers.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }
}