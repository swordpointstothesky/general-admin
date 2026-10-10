using System.ComponentModel.DataAnnotations;

namespace GeneralAdmin.Backend.DTOs;

// ========== 字典类型 ==========
public class DictTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? MenuId { get; set; }
    public string? MenuName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreateTime { get; set; }
    public int ItemCount { get; set; }
}

public class CreateDictTypeRequest
{
    [Required(ErrorMessage = "字典编码不能为空")]
    [MaxLength(50)]
    [RegularExpression(@"^[a-z][a-z0-9_]*$",
        ErrorMessage = "编码只能包含小写字母、数字、下划线，且以字母开头")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "显示名不能为空")]
    [MaxLength(50)]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    public int? MenuId { get; set; }
}

public class UpdateDictTypeRequest
{
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
    public int? MenuId { get; set; }
    /// <summary>
    /// 是否移动到"通用字典"分组
    /// </summary>
    public bool MoveToCommon { get; set; }
}

// ========== 字典项 ==========
public class DictItemDto
{
    public int Id { get; set; }
    public int DictTypeId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Color { get; set; }  // ✅ 新增
    public int SortOrder { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
}

public class CreateDictItemRequest
{
    [Required]
    public int DictTypeId { get; set; }

    [Required(ErrorMessage = "显示文本不能为空")]
    [MaxLength(50)]
    public string Label { get; set; } = string.Empty;

    [Required(ErrorMessage = "值不能为空")]
    [MaxLength(50)]
    public string Value { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Color { get; set; }

    public int SortOrder { get; set; }
    public bool IsDefault { get; set; }
}

public class UpdateDictItemRequest
{
    public string? Label { get; set; }
    public string? Value { get; set; }
    public string? Color { get; set; }  // ✅ 新增
    public int? SortOrder { get; set; }
    public bool? IsDefault { get; set; }
    public bool? IsActive { get; set; }
}

// ========== 树形节点 ==========
public class DictTreeNodeDto
{
    public string Id { get; set; } = string.Empty;       // "menu-1" / "dict-2" / "group-common"
    public string Type { get; set; } = string.Empty;     // "menu" / "dict" / "group"
    public string Name { get; set; } = string.Empty;
    public int? DictId { get; set; }                     // type=dict 时有值
    public int? MenuId { get; set; }                     // type=menu 时有值
    public List<DictTreeNodeDto> Children { get; set; } = new();
}