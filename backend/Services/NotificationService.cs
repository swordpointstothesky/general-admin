using GeneralAdmin.Backend.Data;
using GeneralAdmin.Backend.DTOs;
using GeneralAdmin.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace GeneralAdmin.Backend.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<NotificationPageResponse> GetMyNotificationsAsync(
        int userId, int page, int pageSize, bool unreadOnly = false)
    {
        var query = _context.Notifications.Where(n => n.UserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var totalCount = await query.CountAsync();
        var unreadCount = await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);

        var items = await query
            .OrderByDescending(n => n.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Content = n.Content,
                Type = n.Type,
                Link = n.Link,
                IsRead = n.IsRead,
                ReadTime = n.ReadTime,
                CreateTime = n.CreateTime,
            })
            .ToListAsync();

        return new NotificationPageResponse
        {
            Items = items,
            TotalCount = totalCount,
            UnreadCount = unreadCount,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<bool> MarkAsReadAsync(long id, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null) return false;

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return true;
    }

    public async Task<int> MarkAllAsReadAsync(int userId)
    {
        var list = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in list)
        {
            n.IsRead = true;
            n.ReadTime = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return list.Count;
    }

    public async Task<bool> DeleteAsync(long id, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null) return false;

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> ClearAllAsync(int userId)
    {
        var list = await _context.Notifications
            .Where(n => n.UserId == userId)
            .ToListAsync();

        _context.Notifications.RemoveRange(list);
        await _context.SaveChangesAsync();
        return list.Count;
    }

    public async Task CreateAsync(CreateNotificationRequest request)
    {
        var notification = new Notification
        {
            UserId = request.UserId,
            Title = request.Title,
            Content = request.Content,
            Type = request.Type,
            Link = request.Link,
            IsRead = false,
            CreateTime = DateTime.UtcNow,
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task<int> PublishAsync(PublishNotificationRequest request)
    {
        List<int> userIds;

        if (request.SendToAll)
        {
            userIds = await _context.Users
                .Where(u => u.IsActive)
                .Select(u => u.Id)
                .ToListAsync();
        }
        else
        {
            if (request.UserIds == null || request.UserIds.Count == 0)
                throw new InvalidOperationException("请选择接收人");

            userIds = request.UserIds.Distinct().ToList();
        }

        var now = DateTime.UtcNow;
        var list = userIds.Select(uid => new Notification
        {
            UserId = uid,
            Title = request.Title,
            Content = request.Content,
            Type = request.Type,
            Link = request.Link,
            IsRead = false,
            CreateTime = now,
        }).ToList();

        _context.Notifications.AddRange(list);
        await _context.SaveChangesAsync();

        return list.Count;
    }

    public async Task<NotificationPageResponse> GetAllAsync(int page, int pageSize)
    {
        var query = _context.Notifications
            .Include(n => n.User)
            .AsQueryable();

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(n => n.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Content = n.Content,
                Type = n.Type,
                Link = n.Link,
                IsRead = n.IsRead,
                ReadTime = n.ReadTime,
                CreateTime = n.CreateTime,
            })
            .ToListAsync();

        return new NotificationPageResponse
        {
            Items = items,
            TotalCount = totalCount,
            UnreadCount = await query.CountAsync(n => !n.IsRead),
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<List<int>> GetAllUserIdsAsync()
    {
        return await _context.Users
            .Where(u => u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();
    }
}