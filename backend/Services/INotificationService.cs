using GeneralAdmin.Backend.DTOs;

namespace GeneralAdmin.Backend.Services;

public interface INotificationService
{
    Task<NotificationPageResponse> GetMyNotificationsAsync(int userId, int page, int pageSize, bool unreadOnly = false);
    Task<int> GetUnreadCountAsync(int userId);
    Task<bool> MarkAsReadAsync(long id, int userId);
    Task<int> MarkAllAsReadAsync(int userId);
    Task<bool> DeleteAsync(long id, int userId);
    Task<int> ClearAllAsync(int userId);
    Task CreateAsync(CreateNotificationRequest request);
    // 管理员发布通知
    Task<int> PublishAsync(PublishNotificationRequest request);

    // 管理员查所有通知（分页）
    Task<NotificationPageResponse> GetAllAsync(int page, int pageSize);

    // 全体用户 ID
    Task<List<int>> GetAllUserIdsAsync();
}