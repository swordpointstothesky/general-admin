# 🚀 新增业务模块标准操作流程 (基于代码生成器)

本指南描述了如何利用项目内置的「代码生成器」快速搭建并上线一个新的业务模块（如：订单管理、商品管理等）。

---

## 📌 第一步：数据库建表

在 PostgreSQL (Supabase) 中执行 SQL 创建数据表。

**建表规范：**
1. **主键**：必须命名为 `Id`，类型建议使用 `SERIAL` 或 `BIGSERIAL`。
2. **时间字段**：建议包含 `CreateTime` (`TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)。
3. **数据类型**：
   - 字符串：`VARCHAR(50)` 或 `TEXT`
   - 数字：`INTEGER` 或 `NUMERIC(10, 2)`
   - 布尔值：`BOOLEAN`
   - 日期：`DATE` 或 `TIMESTAMP`
   - 图片/附件：`VARCHAR(500)` (用于存 URL)

**示例 SQL：**
```sql
CREATE TABLE "Orders" (
    "Id" SERIAL PRIMARY KEY,
    "OrderNo" VARCHAR(50) NOT NULL,
    "Amount" NUMERIC(10, 2) NOT NULL,
    "Status" VARCHAR(50) NOT NULL,
    "IsPaid" BOOLEAN DEFAULT FALSE,
    "CoverImage" VARCHAR(500),
    "CreateTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛠️ 第二步：使用代码生成器

1. 登录系统，进入 **开发工具 -> 代码生成器**。
2. 选择刚才建好的数据表（如 `Orders`）。
3. 填写 **模块名**（英文单数大写开头，如 `Order`）和 **中文名**（如 `订单`）。
4. **字段配置（极其重要）**：
   - 设置对应的**输入类型**（`text`, `number`, `select`, `switch`, `date`, `image`）。
   - 如果该字段是枚举，在**字典**列选择对应的字典编码。
   - 取消勾选不需要在表单中显示的字段（如 `Id`、`CreateTime`）。
   - 按需配置在列表中显示的字段。
5. 点击 **生成并下载**，解压得到的 ZIP 包。

---

## 📦 第三步：后端代码集成

将解压得到的 5 个 `.cs` 文件复制到后端对应目录：

1. `Order.cs` ➔ `backend/Models/`
2. `OrderDto.cs` ➔ `backend/DTOs/`
3. `IOrderService.cs` & `OrderService.cs` ➔ `backend/Services/`
4. `OrdersController.cs` ➔ `backend/Controllers/`

**关键操作：**
- 打开 `backend/Data/AppDbContext.cs`，添加实体：
  ```csharp
  public DbSet<Order> Orders { get; set; }
  ```
- 打开终端执行迁移（会自动识别 Service，无需手动注入）：
  ```bash
  cd backend
  dotnet ef migrations add AddOrderTable
  dotnet ef database update
  ```

---

## 🎨 第四步：前端代码集成

1. 将解压得到的 `Orders.tsx` 复制到 `frontend/src/pages/`。
2. 打开 `frontend/src/App.tsx`，在受保护的路由中添加：
   ```tsx
   import Orders from './pages/Orders';
   
   // ...
   <Route path="/orders" element={<Orders />} />
   ```

---

## 🔐 第五步：配置菜单与权限（自动化同步）

打开后端定义文件，添加一行代码。系统启动时会**自动将这些配置同步到数据库**。

1. **配置权限**：打开 `backend/Common/PermissionDefinitions.cs`，添加：
   ```csharp
   new("order:view", "查看订单", "订单管理"),
   new("order:create", "创建订单", "订单管理"),
   new("order:edit", "编辑订单", "订单管理"),
   new("order:delete", "删除订单", "订单管理"),
   new("order:export", "导出订单", "订单管理"),
   ```

2. **配置菜单**：打开 `backend/Common/MenuDefinitions.cs`，添加（使用 Lucide 图标名）：
   ```csharp
   new("订单管理", "/orders", "ShoppingCart", 3, "/business"),
   ```

---

## 🚀 第六步：重启与授权

1. **重启后端**（`dotnet run`）。观察控制台日志，应输出：
   `✅ 权限同步完成：新增 5 个` 和 `✅ 菜单同步完成：新增 1 个`。
2. **重启前端**（`pnpm dev`）。
3. 用 `admin` 登录系统 ➔ 进入**角色管理** ➔ 点击**分配权限/菜单**图标。
4. 给当前角色勾选刚生成的“订单管理”权限和菜单。
5. **刷新页面**，侧边栏出现新菜单，CRUD、导入导出、筛选等功能即可直接使用。

---

## 💡 避坑与排错指南

- **下拉框没数据**：检查是否在“数据字典”中配置了对应的字典项并绑定了字典编码。
- **图片上传后不显示**：检查 `vite.config.ts` 中是否代理了 `/uploads` 路径。
- **后端报错“无法解析服务”**：检查你的 Service 类名是否以 `Service` 结尾（依赖 Scrutor 自动扫描）。
- **菜单没出现**：去数据库 `Menus` 表看看是否有数据，或者检查当前角色是否被分配了该菜单。