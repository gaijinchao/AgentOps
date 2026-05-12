$ErrorActionPreference = "Stop"

function Resolve-DockerExe {
    $candidates = @(
        "docker.exe",
        "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\resources\bin\docker.exe"
    )
    foreach ($c in $candidates) {
        if ($c -eq "docker.exe") {
            $cmd = Get-Command docker.exe -ErrorAction SilentlyContinue
            if ($cmd) { return $cmd.Source }
        }
        elseif (Test-Path $c) { return $c }
    }
    throw "docker.exe not found. Install Docker Desktop and ensure it is running."
}

function Ensure-DockerDaemon([string]$DockerExe) {
    try {
        & $DockerExe info 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { return }
    }
    catch {}

    $desktop = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $desktop) {
        Write-Host "Starting Docker Desktop..."
        Start-Process $desktop
    }

    $deadline = (Get-Date).AddSeconds(180)
    do {
        Start-Sleep -Seconds 3
        try {
            & $DockerExe info 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) { Write-Host "Docker daemon is ready."; return }
        }
        catch {}
    } while ((Get-Date) -lt $deadline)

    throw "Docker daemon did not become ready in time. Open Docker Desktop manually and retry."
}

function New-MinimalDockerConfigDir {
    $tmpCfg = Join-Path $env:TEMP "agentops-docker-config"
    New-Item -ItemType Directory -Force -Path $tmpCfg | Out-Null
    $cfgPath = Join-Path $tmpCfg "config.json"
    [System.IO.File]::WriteAllText($cfgPath, '{"auths":{}}', [System.Text.UTF8Encoding]::new($false))
    return $tmpCfg
}

$docker = Resolve-DockerExe
Ensure-DockerDaemon $docker

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$env:DOCKER_CONFIG = New-MinimalDockerConfigDir
Write-Host "Using temporary DOCKER_CONFIG=$($env:DOCKER_CONFIG) (avoids docker-credential-desktop PATH issues)"

& $docker compose up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$base = "http://localhost:8000"
$deadline = (Get-Date).AddSeconds(120)
do {
    try {
        $r = Invoke-WebRequest -Uri "$base/health" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { break }
    }
    catch { Start-Sleep -Seconds 2 }
    if ((Get-Date) -gt $deadline) { throw "API did not become healthy at $base/health" }
} while ($true)

Write-Host "API is up: $base/health -> $($r.Content)"

& "$repoRoot\examples\demo-rich.ps1" -BaseUrl $base
