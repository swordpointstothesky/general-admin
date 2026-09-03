# 构建阶段
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# 复制项目文件并还原依赖
COPY backend/*.csproj ./backend/
RUN dotnet restore ./backend/GeneralAdmin.Backend.csproj

# 复制所有代码并发布
COPY backend/. ./backend/
RUN dotnet publish ./backend/GeneralAdmin.Backend.csproj -c Release -o out

# 运行阶段
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

# Railway 平台要求应用监听 8080 端口
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "GeneralAdmin.Backend.dll"]