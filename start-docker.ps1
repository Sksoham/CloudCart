$ErrorActionPreference = 'Stop'

# Docker Desktop per-user installations may not be on this shell's PATH yet.
$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
$dockerExe = if ($dockerCommand) { $dockerCommand.Source } else { $null }
if (-not $dockerExe) {
    $dockerExe = @(
        "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe"
        "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe"
    ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $dockerExe) {
    throw 'Install Docker Desktop, start its Linux engine, and run this script again.'
}

$engineType = & $dockerExe info --format '{{.OSType}}'
if ($LASTEXITCODE -ne 0) {
    throw 'Start Docker Desktop and wait for the engine to be ready, then try again.'
}
if ($engineType -ne 'linux') {
    throw 'Switch Docker Desktop to Linux containers, then try again.'
}

$originalPath = $env:PATH
$env:PATH = "$(Split-Path -Parent $dockerExe);$env:PATH"
Push-Location $PSScriptRoot
try {
    $composeArgs = @('compose', '--project-directory', $PSScriptRoot, '-f', (Join-Path $PSScriptRoot 'docker-compose.yml'))
    if (Test-Path -LiteralPath '.env.docker') {
        $composeArgs += @('--env-file', '.env.docker')
    }

    & $dockerExe @composeArgs up --build --detach --wait --wait-timeout 180
    if ($LASTEXITCODE -ne 0) { throw 'CloudCart startup failed. Review the Docker output above.' }

    # Adds the demo admin and products only if they are absent; preserves existing data.
    & $dockerExe @composeArgs exec -T backend npm run seed
    if ($LASTEXITCODE -ne 0) { throw 'Containers started, but loading demo data failed.' }

    & $dockerExe @composeArgs ps
    Write-Host 'CloudCart is ready at http://localhost:3000'
} finally {
    Pop-Location
    $env:PATH = $originalPath
}
