using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using ECommerceAPI.Data;
using ECommerceAPI.Services;
using ECommerceAPI.Middleware;
using ECommerceAPI.Models;
using ECommerceAPI.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ECommerce API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var pgHost = Environment.GetEnvironmentVariable("PGHOST");
var pgPort = Environment.GetEnvironmentVariable("PGPORT") ?? "5432";
var pgDatabase = Environment.GetEnvironmentVariable("PGDATABASE");
var pgUser = Environment.GetEnvironmentVariable("PGUSER");
var pgPassword = Environment.GetEnvironmentVariable("PGPASSWORD");

var connectionString = pgHost != null
    ? $"Host={pgHost};Port={pgPort};Database={pgDatabase};Username={pgUser};Password={pgPassword};SSL Mode=Require;Trust Server Certificate=true"
    : builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (pgHost != null)
        options.UseNpgsql(connectionString);
    else
        options.UseSqlServer(connectionString);
});

var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        // Allow SignalR to use JWT from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Register all services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICouponService, CouponService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IReturnService, ReturnService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IReferralService, ReferralService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IStockNotificationService, StockNotificationService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<IProductQAService, ProductQAService>();
builder.Services.AddHttpClient<IChatService, ChatService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

using (var appScope = app.Services.CreateScope())
{
    var appDb = appScope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (pgHost != null)
    {
        // Production (Postgres): real, tracked EF migrations from here on. This database
        // predates migrations — its schema was built up over time via EnsureCreated() plus
        // hand-written raw SQL — so if the migrations history table doesn't exist yet but the
        // schema clearly already does, seed history with the baseline migration marked as
        // already-applied instead of letting MigrateAsync() try to re-create tables that are
        // already there. This branch only ever fires once, on the first boot after this
        // shipped; every boot after that, __EFMigrationsHistory already exists and it's skipped.
        var conn = appDb.Database.GetDbConnection();
        await conn.OpenAsync();
        bool historyExists, usersTableExists;
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '__EFMigrationsHistory')";
            historyExists = (bool)(await cmd.ExecuteScalarAsync())!;
        }
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Users')";
            usersTableExists = (bool)(await cmd.ExecuteScalarAsync())!;
        }
        await conn.CloseAsync();

        if (!historyExists && usersTableExists)
        {
            var baselineMigrationId = appDb.Database.GetMigrations().First();
            await appDb.Database.ExecuteSqlRawAsync(
                "CREATE TABLE \"__EFMigrationsHistory\" (\"MigrationId\" character varying(150) NOT NULL, \"ProductVersion\" character varying(32) NOT NULL, CONSTRAINT \"PK___EFMigrationsHistory\" PRIMARY KEY (\"MigrationId\"))");
            await appDb.Database.ExecuteSqlRawAsync(
                "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ({0}, '8.0.0')", baselineMigrationId);
        }

        await appDb.Database.MigrateAsync();
    }
    else
    {
        // Local dev (SQL Server LocalDB): no migration history to manage here, just build the
        // schema fresh from the current model. If you pull a schema change and your local DB
        // is stale, drop it (sqllocaldb / SSMS) and let this recreate it.
        await appDb.Database.EnsureCreatedAsync();
    }

    if (!appDb.Users.Any(u => u.Role == "Admin"))
    {
        appDb.Users.Add(new User
        {
            FullName = "Admin User",
            Email = "admin@shopease.in",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = "Admin",
            CreatedAt = DateTime.UtcNow
        });
        appDb.SaveChanges();
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseMiddleware<ExceptionMiddleware>();
app.UseStaticFiles();
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// SPA fallback — serve index.html for all non-API routes (Angular routing)
app.MapFallbackToFile("index.html");

app.Run();
