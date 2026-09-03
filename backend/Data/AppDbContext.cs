using Microsoft.EntityFrameworkCore;
using GeneralAdmin.Backend.Models;

namespace GeneralAdmin.Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
}