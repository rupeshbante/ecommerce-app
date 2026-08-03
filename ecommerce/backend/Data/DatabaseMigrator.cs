using Microsoft.EntityFrameworkCore;

namespace ECommerceAPI.Data;

public static class DatabaseMigrator
{
    public static async Task ApplyManualMigrationsAsync(AppDbContext db)
    {
        // Add new columns to existing tables (safe — IF NOT EXISTS)
        var alterStatements = new[]
        {
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"GoogleId\" TEXT",
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"Phone\" TEXT",
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"ReferralCode\" TEXT",
            "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"CouponCode\" TEXT",
            "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"DiscountAmount\" NUMERIC(18,2) NOT NULL DEFAULT 0",
            "ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"VariantId\" INTEGER",
            "ALTER TABLE \"Products\" ADD COLUMN IF NOT EXISTS \"LowStockThreshold\" INTEGER NOT NULL DEFAULT 5",
            "ALTER TABLE \"Products\" ADD COLUMN IF NOT EXISTS \"SalePrice\" NUMERIC(18,2)",
            "ALTER TABLE \"Products\" ADD COLUMN IF NOT EXISTS \"SaleEndsAt\" TIMESTAMP",
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"PasswordResetToken\" TEXT",
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"PasswordResetExpiry\" TIMESTAMP",
            "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"TrackingNumber\" TEXT",
            "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"Carrier\" TEXT",
            "ALTER TABLE \"Orders\" ALTER COLUMN \"UserId\" DROP NOT NULL",
            "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"GuestEmail\" TEXT",
            "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"GuestName\" TEXT",
            "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"GuestPhone\" TEXT",
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"LoyaltyPoints\" INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"PointsRedeemed\" INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"PointsDiscountAmount\" NUMERIC(18,2) NOT NULL DEFAULT 0",
        };

        foreach (var sql in alterStatements)
        {
            try { await db.Database.ExecuteSqlRawAsync(sql); }
            catch { /* Column already exists — ignore */ }
        }

        // Create new tables (all idempotent with IF NOT EXISTS)
        var tables = new[]
        {
            @"CREATE TABLE IF NOT EXISTS ""Payments"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""OrderId"" INTEGER NOT NULL REFERENCES ""Orders""(""Id""),
                ""RazorpayOrderId"" TEXT NOT NULL DEFAULT '',
                ""RazorpayPaymentId"" TEXT NOT NULL DEFAULT '',
                ""RazorpaySignature"" TEXT NOT NULL DEFAULT '',
                ""Amount"" NUMERIC(18,2) NOT NULL DEFAULT 0,
                ""Currency"" TEXT NOT NULL DEFAULT 'INR',
                ""Status"" TEXT NOT NULL DEFAULT 'Pending',
                ""Method"" TEXT NOT NULL DEFAULT '',
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW(),
                ""PaidAt"" TIMESTAMP
            )",

            @"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Payments_OrderId"" ON ""Payments""(""OrderId"")",

            @"CREATE TABLE IF NOT EXISTS ""Reviews"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""ProductId"" INTEGER NOT NULL REFERENCES ""Products""(""Id""),
                ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""Rating"" INTEGER NOT NULL DEFAULT 5,
                ""Title"" TEXT NOT NULL DEFAULT '',
                ""Comment"" TEXT NOT NULL DEFAULT '',
                ""IsVerifiedPurchase"" BOOLEAN NOT NULL DEFAULT false,
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Reviews_ProductId_UserId"" ON ""Reviews""(""ProductId"", ""UserId"")",

            @"CREATE TABLE IF NOT EXISTS ""WishlistItems"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""ProductId"" INTEGER NOT NULL REFERENCES ""Products""(""Id""),
                ""AddedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_WishlistItems_UserId_ProductId"" ON ""WishlistItems""(""UserId"", ""ProductId"")",

            @"CREATE TABLE IF NOT EXISTS ""UserAddresses"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""Label"" TEXT NOT NULL DEFAULT 'Home',
                ""FullName"" TEXT NOT NULL DEFAULT '',
                ""Phone"" TEXT NOT NULL DEFAULT '',
                ""AddressLine1"" TEXT NOT NULL DEFAULT '',
                ""AddressLine2"" TEXT NOT NULL DEFAULT '',
                ""City"" TEXT NOT NULL DEFAULT '',
                ""State"" TEXT NOT NULL DEFAULT '',
                ""Pincode"" TEXT NOT NULL DEFAULT '',
                ""IsDefault"" BOOLEAN NOT NULL DEFAULT false,
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE TABLE IF NOT EXISTS ""ReturnRequests"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""OrderId"" INTEGER NOT NULL REFERENCES ""Orders""(""Id""),
                ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""Reason"" TEXT NOT NULL DEFAULT '',
                ""Description"" TEXT NOT NULL DEFAULT '',
                ""Status"" TEXT NOT NULL DEFAULT 'Pending',
                ""AdminNote"" TEXT NOT NULL DEFAULT '',
                ""RequestedAt"" TIMESTAMP NOT NULL DEFAULT NOW(),
                ""ProcessedAt"" TIMESTAMP
            )",

            @"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_ReturnRequests_OrderId"" ON ""ReturnRequests""(""OrderId"")",

            @"CREATE TABLE IF NOT EXISTS ""ProductImages"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""ProductId"" INTEGER NOT NULL REFERENCES ""Products""(""Id""),
                ""Url"" TEXT NOT NULL DEFAULT '',
                ""IsPrimary"" BOOLEAN NOT NULL DEFAULT false,
                ""SortOrder"" INTEGER NOT NULL DEFAULT 0,
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE TABLE IF NOT EXISTS ""ProductVariants"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""ProductId"" INTEGER NOT NULL REFERENCES ""Products""(""Id""),
                ""Name"" TEXT NOT NULL DEFAULT '',
                ""Value"" TEXT NOT NULL DEFAULT '',
                ""PriceModifier"" NUMERIC(18,2) NOT NULL DEFAULT 0,
                ""Stock"" INTEGER NOT NULL DEFAULT 0,
                ""Sku"" TEXT NOT NULL DEFAULT '',
                ""IsActive"" BOOLEAN NOT NULL DEFAULT true
            )",

            @"CREATE TABLE IF NOT EXISTS ""AuditLogs"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""UserId"" INTEGER,
                ""UserEmail"" TEXT NOT NULL DEFAULT '',
                ""Action"" TEXT NOT NULL DEFAULT '',
                ""Entity"" TEXT NOT NULL DEFAULT '',
                ""EntityId"" TEXT,
                ""OldValues"" TEXT,
                ""NewValues"" TEXT,
                ""IpAddress"" TEXT NOT NULL DEFAULT '',
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE TABLE IF NOT EXISTS ""Notifications"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""Title"" TEXT NOT NULL DEFAULT '',
                ""Message"" TEXT NOT NULL DEFAULT '',
                ""Type"" TEXT NOT NULL DEFAULT 'info',
                ""Link"" TEXT,
                ""IsRead"" BOOLEAN NOT NULL DEFAULT false,
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE TABLE IF NOT EXISTS ""Referrals"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""ReferrerId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""ReferredUserId"" INTEGER REFERENCES ""Users""(""Id""),
                ""Code"" TEXT NOT NULL DEFAULT '',
                ""IsUsed"" BOOLEAN NOT NULL DEFAULT false,
                ""RewardAmount"" NUMERIC(18,2) NOT NULL DEFAULT 100,
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW(),
                ""UsedAt"" TIMESTAMP
            )",

            @"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Referrals_Code"" ON ""Referrals""(""Code"")",

            @"CREATE TABLE IF NOT EXISTS ""StockNotifications"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""ProductId"" INTEGER NOT NULL REFERENCES ""Products""(""Id""),
                ""Email"" TEXT NOT NULL DEFAULT '',
                ""UserName"" TEXT NOT NULL DEFAULT '',
                ""IsNotified"" BOOLEAN NOT NULL DEFAULT false,
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE TABLE IF NOT EXISTS ""OrderStatusHistories"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""OrderId"" INTEGER NOT NULL REFERENCES ""Orders""(""Id"") ON DELETE CASCADE,
                ""Status"" TEXT NOT NULL DEFAULT '',
                ""ChangedAt"" TIMESTAMP NOT NULL DEFAULT NOW(),
                ""Note"" TEXT
            )",

            @"CREATE INDEX IF NOT EXISTS ""IX_OrderStatusHistories_OrderId"" ON ""OrderStatusHistories""(""OrderId"")",

            @"CREATE TABLE IF NOT EXISTS ""CartItems"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""ProductId"" INTEGER NOT NULL REFERENCES ""Products""(""Id"") ON DELETE CASCADE,
                ""VariantId"" INTEGER REFERENCES ""ProductVariants""(""Id""),
                ""Quantity"" INTEGER NOT NULL DEFAULT 1,
                ""AddedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_CartItems_UserId_ProductId_VariantId"" ON ""CartItems""(""UserId"", ""ProductId"", COALESCE(""VariantId"", -1))",

            @"CREATE TABLE IF NOT EXISTS ""LoyaltyPointTransactions"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""Points"" INTEGER NOT NULL DEFAULT 0,
                ""Reason"" TEXT NOT NULL DEFAULT '',
                ""OrderId"" INTEGER,
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE INDEX IF NOT EXISTS ""IX_LoyaltyPointTransactions_UserId"" ON ""LoyaltyPointTransactions""(""UserId"")",

            @"CREATE TABLE IF NOT EXISTS ""ProductQuestions"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""ProductId"" INTEGER NOT NULL REFERENCES ""Products""(""Id"") ON DELETE CASCADE,
                ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""Question"" TEXT NOT NULL DEFAULT '',
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE INDEX IF NOT EXISTS ""IX_ProductQuestions_ProductId"" ON ""ProductQuestions""(""ProductId"")",

            @"CREATE TABLE IF NOT EXISTS ""ProductAnswers"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""ProductQuestionId"" INTEGER NOT NULL REFERENCES ""ProductQuestions""(""Id"") ON DELETE CASCADE,
                ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id""),
                ""Answer"" TEXT NOT NULL DEFAULT '',
                ""CreatedAt"" TIMESTAMP NOT NULL DEFAULT NOW()
            )",

            @"CREATE INDEX IF NOT EXISTS ""IX_ProductAnswers_ProductQuestionId"" ON ""ProductAnswers""(""ProductQuestionId"")",
        };

        foreach (var sql in tables)
        {
            try { await db.Database.ExecuteSqlRawAsync(sql); }
            catch (Exception ex)
            {
                // Log but don't crash — table might already exist
                Console.WriteLine($"Migration note: {ex.Message}");
            }
        }
    }
}
