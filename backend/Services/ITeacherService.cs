using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface ITeacherService
{
    Task<List<TeacherDto>> GetAllAsync();
    Task<TeacherDto?> GetByIdAsync(int id);
    Task<TeacherDto> CreateAsync(CreateTeacherRequest request);
    Task<bool> UpdateAsync(int id, UpdateTeacherRequest request);
    Task<bool> DeleteAsync(int id);
}