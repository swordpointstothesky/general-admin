using GeneralAdmin.Backend.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace GeneralAdmin.Backend.Filters;

public class ValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            // 收集所有错误
            var errors = context.ModelState
                .Where(kv => kv.Value?.Errors.Count > 0)
                .SelectMany(kv => kv.Value!.Errors.Select(e => e.ErrorMessage))
                .ToList();

            var message = errors.FirstOrDefault() ?? "参数校验失败";

            context.Result = new BadRequestObjectResult(new
            {
                code = 400,
                message,
                errors,
            });
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}