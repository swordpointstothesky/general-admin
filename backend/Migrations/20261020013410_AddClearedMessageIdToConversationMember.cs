using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeneralAdmin.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddClearedMessageIdToConversationMember : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "ClearedMessageId",
                table: "ConversationMembers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClearedMessageId",
                table: "ConversationMembers");
        }
    }
}
