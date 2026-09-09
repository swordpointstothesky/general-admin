namespace GeneralAdmin.Backend.DTOs;

public class MenuDto
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
    public List<MenuDto> Children { get; set; } = new();
}