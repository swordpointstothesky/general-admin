using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services
{
    public interface IUserService
    {
        Task<List<UserDto>> GetUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<UserDto> CreateUserAsync(CreateUserRequest request);
        Task<bool> UpdateUserAsync(int id, UpdateUserRequest request);
        Task<bool> DeleteUserAsync(int id);
    }
}
