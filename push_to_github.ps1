# Script para inicializar repo local y pushear a GitHub
# Uso: Abri PowerShell como usuario y ejecuta:
#   powershell -ExecutionPolicy Bypass -File .\push_to_github.ps1

$repoUrl = 'https://github.com/Gabmazz13/Mugishop.git'
$branch = 'main'

function Check-Command($name){
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    return $cmd -ne $null
}

if (-not (Check-Command git)){
    Write-Host "ERROR: 'git' no está instalado o no está en PATH. Instalar Git desde https://git-scm.com/downloads" -ForegroundColor Red
    exit 1
}

Set-Location -Path (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

if (-not (Test-Path .git)){
    git init
}

git add .
try{
    git commit -m "Initial commit: template + webapp + scripts"
}catch{
    Write-Host "No se creó commit (posible: sin cambios para commitear)." -ForegroundColor Yellow
}

# Configurar remoto
$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0){
    git remote add origin $repoUrl
}else{
    Write-Host "Remoto 'origin' ya existe: $existing" -ForegroundColor Yellow
}

# Asegurar branch main
try{ git branch -M $branch }catch{}

Write-Host "Intentando pushear a $repoUrl (branch $branch)..."

$push = git push -u origin $branch 2>&1
if ($LASTEXITCODE -ne 0){
    Write-Host "Push falló. Mensaje de git:" -ForegroundColor Red
    Write-Host $push
    Write-Host "Si el push pide credenciales, asegurate de tener acceso a https://github.com/Gabmazz13/Mugishop y usa un token si corresponde." -ForegroundColor Yellow
    exit 1
}

Write-Host "Push completado." -ForegroundColor Green
