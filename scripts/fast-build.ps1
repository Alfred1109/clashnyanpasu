# 高性能构建脚本 - 充分利用 i7-13700KF 24线程 + 64GB内存
param(
    [string]$BuildType = "release",
    [switch]$SkipFrontend = $false,
    [switch]$UseCache
)

Write-Host "🚀 Starting Fast Build Process..." -ForegroundColor Green
Write-Host "Hardware: i7-13700KF (24 threads) + 64GB RAM" -ForegroundColor Cyan

# 设置环境变量优化编译
$env:CARGO_BUILD_JOBS = "20"           # 使用20个并行任务
$env:CARGO_NET_OFFLINE = "false"       # 确保能下载依赖
$env:RUSTC_WRAPPER = ""                # 清除可能的wrapper
$env:CARGO_TARGET_DIR = "target"       # 使用标准target目录以利用缓存

# Node.js 构建优化
$env:NODE_OPTIONS = "--max-old-space-size=8192"  # 分配8GB内存给Node.js
$env:UV_THREADPOOL_SIZE = "20"         # 增加libuv线程池大小

# 根据构建类型设置不同的优化策略
switch ($BuildType) {
    "debug" {
        Write-Host "🔧 Using debug build profile..." -ForegroundColor Yellow
        $cargoProfile = "dev"
        $viteBuildArgs = "--mode development"
    }
    "fast" {
        Write-Host "⚡ Using fast build profile..." -ForegroundColor Yellow
        $cargoProfile = "fast-build"
        $viteBuildArgs = "--mode production --minify esbuild"
    }
    "release" {
        Write-Host "🎯 Using release build profile..." -ForegroundColor Yellow
        $cargoProfile = "release"
        $viteBuildArgs = "--mode production"
    }
}

# 检查并行构建能力
$cpuCores = (Get-WmiObject -Class Win32_ComputerSystem).NumberOfLogicalProcessors
Write-Host "💻 Detected $cpuCores logical cores, using optimized parallel settings" -ForegroundColor Cyan

# 前端构建阶段
if (-not $SkipFrontend) {
    Write-Host "`n📦 Building Frontend (Parallel)..." -ForegroundColor Green
    
    $frontendJobs = @()
    
    # 并行构建所有前端包
    $frontendJobs += Start-Job -ScriptBlock {
        Set-Location "d:\nyanpansu\frontend\interface"
        pnpm build
    }
    
    $frontendJobs += Start-Job -ScriptBlock {
        Set-Location "d:\nyanpansu\frontend\ui"
        pnpm build
    }
    
    $frontendJobs += Start-Job -ScriptBlock {
        Set-Location "d:\nyanpansu\frontend\nyanpasu"
        $env:NODE_OPTIONS = "--max-old-space-size=8192"
        pnpm build
    }
    
    # 等待所有前端构建完成
    Write-Host "⏳ Waiting for parallel frontend builds..." -ForegroundColor Yellow
    $frontendJobs | ForEach-Object {
        $result = Receive-Job -Job $_ -Wait
        Write-Host $result
    }
    
    # 清理作业
    $frontendJobs | Remove-Job
    
    Write-Host "✅ Frontend build completed!" -ForegroundColor Green
}

# 后端构建阶段
Write-Host "`n🦀 Building Rust Backend..." -ForegroundColor Green

# 预编译依赖以利用缓存
if ($UseCache) {
    Write-Host "📋 Pre-compiling dependencies..." -ForegroundColor Yellow
    cargo build --profile $cargoProfile --workspace --lib
}

# 主要构建
$tauriArgs = @(
    "build"
    "--profile", $cargoProfile
)

if ($BuildType -eq "debug") {
    $tauriArgs += "-d"
}

Write-Host "🔨 Starting Tauri build with profile: $cargoProfile" -ForegroundColor Yellow
Write-Host "Command: tauri $($tauriArgs -join ' ')" -ForegroundColor Gray

# 执行构建并测量时间
$buildStart = Get-Date
& tauri $tauriArgs

if ($LASTEXITCODE -eq 0) {
    $buildEnd = Get-Date
    $buildTime = $buildEnd - $buildStart
    
    Write-Host "`n🎉 Build completed successfully!" -ForegroundColor Green
    Write-Host "⏱️  Total build time: $($buildTime.Minutes)m $($buildTime.Seconds)s" -ForegroundColor Cyan
    Write-Host "💡 Hardware utilization: Optimized for 24-thread CPU" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 清理临时文件以节省磁盘空间
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path "target\tmp" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "🚀 Fast build process completed!" -ForegroundColor Green
