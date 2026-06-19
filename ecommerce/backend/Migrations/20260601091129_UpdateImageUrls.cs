using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerceAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateImageUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "ImageUrl" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 11, 28, 418, DateTimeKind.Utc).AddTicks(3637), "https://placehold.co/300x300?text=Laptop" });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "ImageUrl" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 11, 28, 418, DateTimeKind.Utc).AddTicks(3652), "https://placehold.co/300x300?text=Mouse" });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "ImageUrl" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 11, 28, 418, DateTimeKind.Utc).AddTicks(3655), "https://placehold.co/300x300?text=T-Shirt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "ImageUrl" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 7, 52, 537, DateTimeKind.Utc).AddTicks(4934), "https://via.placeholder.com/300" });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "ImageUrl" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 7, 52, 537, DateTimeKind.Utc).AddTicks(4945), "https://via.placeholder.com/300" });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "ImageUrl" },
                values: new object[] { new DateTime(2026, 6, 1, 9, 7, 52, 537, DateTimeKind.Utc).AddTicks(4947), "https://via.placeholder.com/300" });
        }
    }
}
