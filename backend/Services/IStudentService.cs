using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface IStudentService
{
    Task<List<StudentDto>> GetAllAsync();
    Task<StudentDto?> GetByIdAsync(int id);
    Task<StudentDto> CreateAsync(CreateStudentRequest request);
    Task<bool> UpdateAsync(int id, UpdateStudentRequest request);
    Task<bool> DeleteAsync(int id);
}