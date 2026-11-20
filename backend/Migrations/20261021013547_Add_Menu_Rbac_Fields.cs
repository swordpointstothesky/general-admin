using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeneralAdmin.Backend.Migrations
{
    /// <inheritdoc />
    public partial class Add_Menu_Rbac_Fields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Component",
                table: "Menus",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Permission",
                table: "Menus",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Menus",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "Visible",
                table: "Menus",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Component",
                table: "Menus");

            migrationBuilder.DropColumn(
                name: "Permission",
                table: "Menus");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Menus");

            migrationBuilder.DropColumn(
                name: "Visible",
                table: "Menus");
        }
    }
}
