using Microsoft.EntityFrameworkCore;
using ECommerceAPI.Models;

namespace ECommerceAPI.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<ReturnRequest> ReturnRequests => Set<ReturnRequest>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Referral> Referrals => Set<Referral>();
    public DbSet<StockNotification> StockNotifications => Set<StockNotification>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<LoyaltyPointTransaction> LoyaltyPointTransactions => Set<LoyaltyPointTransaction>();
    public DbSet<ProductQuestion> ProductQuestions => Set<ProductQuestion>();
    public DbSet<ProductAnswer> ProductAnswers => Set<ProductAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Product>().Property(p => p.Price).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<OrderItem>().Property(o => o.UnitPrice).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Order>().Property(o => o.DiscountAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Coupon>().Property(c => c.DiscountValue).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Coupon>().Property(c => c.MinOrderAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Coupon>().HasIndex(c => c.Code).IsUnique();
        modelBuilder.Entity<Payment>().Property(p => p.Amount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<ProductVariant>().Property(v => v.PriceModifier).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Referral>().Property(r => r.RewardAmount).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<Referral>().HasIndex(r => r.Code).IsUnique();

        modelBuilder.Entity<Category>()
            .HasOne(c => c.Parent).WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.User).WithMany(u => u.Orders).HasForeignKey(o => o.UserId)
            .IsRequired(false);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Order).WithMany(o => o.OrderItems).HasForeignKey(oi => oi.OrderId);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Product).WithMany(p => p.OrderItems).HasForeignKey(oi => oi.ProductId);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Order).WithOne(o => o.Payment).HasForeignKey<Payment>(p => p.OrderId);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Product).WithMany(p => p.Reviews).HasForeignKey(r => r.ProductId);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.User).WithMany(u => u.Reviews).HasForeignKey(r => r.UserId);

        modelBuilder.Entity<Review>()
            .HasIndex(r => new { r.ProductId, r.UserId }).IsUnique();

        modelBuilder.Entity<WishlistItem>()
            .HasOne(w => w.User).WithMany(u => u.WishlistItems).HasForeignKey(w => w.UserId);

        modelBuilder.Entity<WishlistItem>()
            .HasOne(w => w.Product).WithMany(p => p.WishlistItems).HasForeignKey(w => w.ProductId);

        modelBuilder.Entity<WishlistItem>()
            .HasIndex(w => new { w.UserId, w.ProductId }).IsUnique();

        modelBuilder.Entity<UserAddress>()
            .HasOne(a => a.User).WithMany(u => u.Addresses).HasForeignKey(a => a.UserId);

        modelBuilder.Entity<ReturnRequest>()
            .HasOne(r => r.Order).WithOne(o => o.ReturnRequest).HasForeignKey<ReturnRequest>(r => r.OrderId);

        modelBuilder.Entity<OrderStatusHistory>()
            .HasOne(h => h.Order).WithMany(o => o.StatusHistory).HasForeignKey(h => h.OrderId);

        modelBuilder.Entity<ReturnRequest>()
            .HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProductImage>()
            .HasOne(pi => pi.Product).WithMany(p => p.Images).HasForeignKey(pi => pi.ProductId);

        modelBuilder.Entity<ProductVariant>()
            .HasOne(pv => pv.Product).WithMany(p => p.Variants).HasForeignKey(pv => pv.ProductId);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User).WithMany(u => u.Notifications).HasForeignKey(n => n.UserId);

        modelBuilder.Entity<Referral>()
            .HasOne(r => r.Referrer).WithMany().HasForeignKey(r => r.ReferrerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Referral>()
            .HasOne(r => r.ReferredUser).WithMany().HasForeignKey(r => r.ReferredUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CartItem>()
            .HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId);

        modelBuilder.Entity<CartItem>()
            .HasOne(c => c.Product).WithMany().HasForeignKey(c => c.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CartItem>()
            .HasOne(c => c.Variant).WithMany().HasForeignKey(c => c.VariantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CartItem>()
            .HasIndex(c => new { c.UserId, c.ProductId, c.VariantId }).IsUnique();

        modelBuilder.Entity<Order>().Property(o => o.PointsDiscountAmount).HasColumnType("decimal(18,2)");

        modelBuilder.Entity<LoyaltyPointTransaction>()
            .HasOne(l => l.User).WithMany().HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProductQuestion>()
            .HasOne(q => q.Product).WithMany().HasForeignKey(q => q.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProductQuestion>()
            .HasOne(q => q.User).WithMany().HasForeignKey(q => q.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProductAnswer>()
            .HasOne(a => a.Question).WithMany(q => q.Answers).HasForeignKey(a => a.ProductQuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProductAnswer>()
            .HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}