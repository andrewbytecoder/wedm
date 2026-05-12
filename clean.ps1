# clean.ps1
Write-Host "清理 Wails 项目..." -ForegroundColor Cyan

# 删除前端构建产物
if (Test-Path "frontend\dist") {
    Remove-Item -Recurse -Force "frontend\dist"
    Write-Host "✓ 已删除 frontend\dist" -ForegroundColor Green
}

# 删除 Vite 缓存
if (Test-Path "frontend\node_modules\.vite") {
    Remove-Item -Recurse -Force "frontend\node_modules\.vite"
    Write-Host "✓ 已删除 Vite 缓存" -ForegroundColor Green
}

# 删除后端构建产物
if (Test-Path "build\bin") {
    Remove-Item -Recurse -Force "build\bin"
    Write-Host "✓ 已删除 build\bin" -ForegroundColor Green
}

# 删除 wailsjs 生成文件（会在下次构建时重新生成）
if (Test-Path "frontend\wailsjs") {
    Remove-Item -Recurse -Force "frontend\wailsjs"
    Write-Host "✓ 已删除 frontend\wailsjs" -ForegroundColor Green
}

Write-Host "`n清理完成！现在可以运行 'wails dev' 或 'wails build'" -ForegroundColor Green
