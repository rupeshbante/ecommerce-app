using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ECommerceAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddFullProductCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Description", "ImageUrl", "Name", "Price", "Stock" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2676), "High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD. Perfect for professionals and creators.", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop&auto=format", "Laptop Pro 15\"", 85000m, 30 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "Description", "ImageUrl", "Name", "Price", "Stock" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2685), "Precision wireless mouse with ergonomic design, 3-month battery life, and silent click technology.", "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&h=400&fit=crop&auto=format", "Wireless Ergonomic Mouse", 1299m, 150 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Category", "CreatedAt", "Description", "ImageUrl", "Name", "Price", "Stock" },
                values: new object[] { "Electronics", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2687), "RGB backlit mechanical keyboard with tactile brown switches, anti-ghosting, and detachable USB-C cable.", "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&h=400&fit=crop&auto=format", "Mechanical Gaming Keyboard", 3999m, 75 });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "Category", "CreatedAt", "Description", "ImageUrl", "IsActive", "Name", "Price", "Stock" },
                values: new object[,]
                {
                    { 4, "Electronics", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2689), "Industry-leading noise cancellation with 30-hour battery life. Crystal clear audio for music and calls.", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop&auto=format", true, "Noise Cancelling Headphones", 25999m, 40 },
                    { 5, "Electronics", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2691), "Latest flagship smartphone with 6.7\" OLED display, 108MP camera, 5G connectivity, and 5000mAh battery.", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop&auto=format", true, "Smartphone Pro Max", 79999m, 25 },
                    { 6, "Electronics", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2693), "Ultra-sharp 4K IPS display with 99% sRGB color accuracy, USB-C 65W power delivery, and ergonomic stand.", "https://images.unsplash.com/photo-1527443224154-c4a573d5b5b1?w=600&h=400&fit=crop&auto=format", true, "27\" 4K UHD Monitor", 28000m, 20 },
                    { 7, "Electronics", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2695), "Slim and powerful tablet with fast chip, 10.9\" Liquid Retina display, and all-day battery life.", "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=400&fit=crop&auto=format", true, "Digital Tablet 10.9\"", 62999m, 35 },
                    { 8, "Electronics", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2696), "Advanced health monitoring with ECG, blood oxygen tracking, crash detection, and always-on GPS.", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop&auto=format", true, "Smart Watch Series 9", 29999m, 60 },
                    { 9, "Electronics", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2698), "24.1MP DSLR with 18-55mm kit lens, 4K video, built-in Wi-Fi, and 45-point autofocus system.", "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop&auto=format", true, "DSLR Camera Kit", 55000m, 15 },
                    { 10, "Clothing", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2700), "100% premium cotton t-shirt with a perfect relaxed fit. Breathable, durable, and effortlessly stylish.", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=400&fit=crop&auto=format", true, "Classic White T-Shirt", 599m, 500 },
                    { 11, "Clothing", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2702), "Stretch denim slim-fit jeans with modern tapered leg cut. Comfortable all-day wear in classic indigo wash.", "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=400&fit=crop&auto=format", true, "Slim Fit Denim Jeans", 1799m, 200 },
                    { 12, "Clothing", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2704), "Full-grain leather moto jacket with zip-off sleeves, quilted lining, and premium YKK hardware.", "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=400&fit=crop&auto=format", true, "Genuine Leather Jacket", 8999m, 30 },
                    { 13, "Clothing", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2705), "Lightweight running shoes with responsive foam cushioning, breathable knit upper, and durable rubber outsole.", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop&auto=format", true, "Running Sneakers Pro", 4999m, 100 },
                    { 14, "Clothing", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2707), "Structured 6-panel cap with embroidered logo, curved brim, and adjustable snapback closure. One size fits all.", "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=400&fit=crop&auto=format", true, "Adjustable Baseball Cap", 699m, 300 },
                    { 15, "Books", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2709), "A handbook of agile software craftsmanship by Robert C. Martin. Essential reading for every serious developer.", "https://images.unsplash.com/photo-1481627834876-b7833e8f84c4?w=600&h=400&fit=crop&auto=format", true, "Clean Code", 799m, 200 },
                    { 16, "Books", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2711), "James Clear's guide to building good habits and breaking bad ones using tiny, incremental changes.", "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop&auto=format", true, "Atomic Habits", 499m, 300 },
                    { 17, "Books", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2712), "Eric Ries teaches how continuous innovation creates radically successful businesses. Must-read for entrepreneurs.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&auto=format", true, "The Lean Startup", 599m, 250 },
                    { 18, "Home", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2714), "Set of 4 handcrafted ceramic mugs in earthy matte tones. Microwave and dishwasher safe. 350ml capacity.", "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=400&fit=crop&auto=format", true, "Ceramic Coffee Mug Set", 899m, 150 },
                    { 19, "Home", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2716), "Touch-controlled LED lamp with 5 brightness levels, 4000K color temperature, and USB-A charging port.", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=400&fit=crop&auto=format", true, "LED Architect Desk Lamp", 1499m, 80 },
                    { 20, "Home", new DateTime(2026, 6, 1, 9, 32, 18, 931, DateTimeKind.Utc).AddTicks(2718), "Luxury soy wax candles in 4 relaxing fragrances: Lavender, Vanilla, Sandalwood, and Ocean Breeze. 40hr burn time.", "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=600&h=400&fit=crop&auto=format", true, "Scented Candle Gift Set", 999m, 120 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "Description", "ImageUrl", "Name", "Price", "Stock" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 11, 28, 418, DateTimeKind.Utc).AddTicks(3637), "High performance laptop", "https://placehold.co/300x300?text=Laptop", "Laptop", 75000m, 50 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "Description", "ImageUrl", "Name", "Price", "Stock" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 11, 28, 418, DateTimeKind.Utc).AddTicks(3652), "Ergonomic wireless mouse", "https://placehold.co/300x300?text=Mouse", "Wireless Mouse", 1200m, 200 });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Category", "CreatedAt", "Description", "ImageUrl", "Name", "Price", "Stock" },
                values: new object[] { "Clothing", new DateTime(2026, 6, 1, 9, 11, 28, 418, DateTimeKind.Utc).AddTicks(3655), "Cotton casual t-shirt", "https://placehold.co/300x300?text=T-Shirt", "T-Shirt", 499m, 500 });
        }
    }
}
