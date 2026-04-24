# ============================================================================
# JARVIS v2.0 SETUP SCRIPT - Windows PowerShell
# ============================================================================
# Uso:
#   1. Abre PowerShell en la carpeta jarvis-comienza
#   2. Ejecuta: .\scripts\setup.ps1
#
# Si obtienes error de permisos, ejecuta primero:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# ============================================================================

$ErrorActionPreference = "Stop"

# Colores
function Print-Header {
    param($msg)
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║ $msg" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Blue
}

function Print-Step    { param($msg) Write-Host "▶ $msg" -ForegroundColor Yellow }
function Print-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Print-Error   { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }

function Check-Command {
    param($cmd)
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($found) {
        Print-Success "$cmd detectado"
        return $true
    } else {
        Print-Error "$cmd NO encontrado"
        return $false
    }
}

# ============================================================================
# INICIO
# ============================================================================

Print-Header "JARVIS v2.0 - Instalación en Windows"

# ----------------------------------------------------------------------------
# 1. VERIFICAR DEPENDENCIAS
# ----------------------------------------------------------------------------

Print-Step "Verificando dependencias..."

$nodeOk   = Check-Command "node"
$npmOk    = Check-Command "npm"
$ollamaOk = Check-Command "ollama"

if (-not $nodeOk) {
    Print-Error "Node.js no instalado. Descarga de https://nodejs.org"
    exit 1
}

if (-not $ollamaOk) {
    Print-Error "Ollama no instalado - REQUERIDO"
    Write-Host "Descarga desde: https://ollama.com/download" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ----------------------------------------------------------------------------
# 2. CREAR ESTRUCTURA DE CARPETAS
# ----------------------------------------------------------------------------

Print-Step "Creando estructura de carpetas..."

New-Item -ItemType Directory -Path ".vault\notes" -Force | Out-Null
New-Item -ItemType Directory -Path "src\skills"   -Force | Out-Null

Print-Success "Carpetas listas"
Write-Host ""

# ----------------------------------------------------------------------------
# 3. CREAR .ENV
# ----------------------------------------------------------------------------

Print-Step "Configurando .env..."

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Print-Success ".env creado desde .env.example"
    } else {
        @"
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:1b
PORT=3000
HOST=0.0.0.0
DATABASE_PATH=./jarvis.db
VAULT_PATH=./.vault
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Print-Success ".env creado con valores por defecto"
    }
} else {
    Print-Success ".env ya existe"
}

Write-Host ""

# ----------------------------------------------------------------------------
# 4. VERIFICAR/DESCARGAR MODELO GEMMA
# ----------------------------------------------------------------------------

Print-Step "Verificando modelo Gemma 3 1B..."

$models = ollama list 2>$null
if ($models -match "gemma3:1b") {
    Print-Success "Gemma 3 1B ya descargado"
} else {
    Print-Step "Descargando Gemma 3 1B (2-5 minutos)..."
    Write-Host "Asegúrate que Ollama está corriendo (ollama serve en otra terminal)" -ForegroundColor Yellow
    ollama pull gemma3:1b
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Gemma 3 1B descargado"
    } else {
        Print-Error "Error descargando. Verifica que 'ollama serve' esté corriendo."
        exit 1
    }
}

Write-Host ""

# ----------------------------------------------------------------------------
# 5. NPM INSTALL
# ----------------------------------------------------------------------------

Print-Step "Instalando dependencias de Node.js..."
npm install
if ($LASTEXITCODE -ne 0) {
    Print-Error "Error en npm install"
    exit 1
}
Print-Success "Dependencias instaladas"
Write-Host ""

# ----------------------------------------------------------------------------
# 6. BUILD
# ----------------------------------------------------------------------------

Print-Step "Compilando TypeScript..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Print-Error "Error en la compilación"
    exit 1
}
Print-Success "Compilación completa"
Write-Host ""

# ----------------------------------------------------------------------------
# 7. RESUMEN
# ----------------------------------------------------------------------------

Print-Header "✅ JARVIS v2.0 LISTO"

Write-Host "CONFIGURACIÓN:" -ForegroundColor Yellow
Write-Host "  • Modelo IA : Gemma 3 1B (local)"
Write-Host "  • Servidor  : http://localhost:3000"
Write-Host "  • Vault     : .vault\notes (Obsidian markdown)"
Write-Host ""

Write-Host "PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Asegúrate que Ollama esté corriendo (en otra ventana):" -ForegroundColor Cyan
Write-Host "   ollama serve"
Write-Host ""
Write-Host "2. Inicia JARVIS:" -ForegroundColor Cyan
Write-Host "   npm start"
Write-Host ""
Write-Host "3. Abre en el navegador:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000"
Write-Host ""
Print-Success "LISTO! Sin restricciones, 100% local."
