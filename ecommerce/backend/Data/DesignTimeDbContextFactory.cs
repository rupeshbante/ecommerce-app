using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ECommerceAPI.Data;

/// <summary>
/// Used only by `dotnet ef migrations add` / `dotnet ef database update` at design time.
/// Production always runs Postgres (see Program.cs), so migrations are always generated
/// against Npgsql here regardless of the developer's local provider (SQL Server LocalDB).
/// The connection string is never actually opened for `migrations add` — it just needs to
/// look like a valid Npgsql connection string.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=design_time_only;Username=postgres;Password=postgres");
        return new AppDbContext(optionsBuilder.Options);
    }
}
