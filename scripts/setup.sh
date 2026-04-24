#!/bin/bash

#############################################################################
# JARVIS v2.0 SETUP SCRIPT
#
# Instala y configura JARVIS en tu máquina:
# - Verifica dependencias (Node.js, npm, Ollama)
# - Descarga modelo Gemma 3 1B
# - Crea estructura Obsidian vault
# - npm install y build
# - Listo para ejecutar
#
# Uso: bash scripts/setup.sh
#############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FUNCIONES
# ============================================================================

print_header() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

print_step() {
  echo -e "${YELLOW}▶${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

check_command() {
  if ! command -v "$1" &> /dev/null; then
    print_error "$1 no encontrado"
    return 1
  fi
  print_success "$1 ✅"
  return 0
}

# ============================================================================
# INICIO
# ============================================================================

print_header "JARVIS v2.0 - Sistema de Instalación"

# ============================================================================
# 1. VERIFICAR DEPENDENCIAS
# ============================================================================

print_step "Verificando dependencias..."
echo ""

if ! check_command "node"; then
  print_error "Node.js no instalado. Descarga de https://nodejs.org"
  exit 1
fi

if ! check_command "npm"; then
  print_error "npm no instalado"
  exit 1
fi

if ! check_command "ollama"; then
  print_error "Ollama no instalado (es REQUERIDO para JARVIS local)"
  echo ""
  echo "Instala desde: https://ollama.com/download"
  echo "  - macOS: brew install ollama"
  echo "  - Linux: curl -fsSL https://ollama.ai/install.sh | sh"
  echo "  - Windows: Descarga el instalador"
  echo ""
  read -p "¿Continuar sin Ollama? (No recomendado) [s/n]: " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    exit 1
  fi
else
  print_success "Ollama ✅"
fi

echo ""

# ============================================================================
# 2. CREAR ESTRUCTURA DE CARPETAS
# ============================================================================

print_step "Creando estructura de carpetas..."

mkdir -p .vault/notes
mkdir -p scripts
mkdir -p src/skills

print_success "Carpetas creadas ✅"
echo ""

# ============================================================================
# 3. VERIFICAR/CREAR .ENV
# ============================================================================

print_step "Configurando variables de entorno..."

if [ ! -f ".env" ]; then
  echo "Creando archivo .env..."
  cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
# AI Provider Configuration
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:1b

# Puerto del servidor
PORT=3000
HOST=0.0.0.0

# Database (local SQLite)
DATABASE_PATH=./jarvis.db

# Observaciones: Gemma 3 1B es pequeño (~4GB VRAM), rápido y perfecto para JARVIS
# Si tienes más VRAM, considera: gemma3:7b o phi (más capaz)
EOF
  print_success ".env creado ✅"
else
  print_success ".env ya existe ✅"
fi

echo ""

# ============================================================================
# 4. DESCARGAR MODELO GEMMA (si Ollama está disponible)
# ============================================================================

if command -v "ollama" &> /dev/null; then
  print_step "Verificando modelo Gemma 3 1B en Ollama..."

  if ollama list | grep -q "gemma3:1b"; then
    print_success "Gemma 3 1B ya descargado ✅"
  else
    print_step "Descargando Gemma 3 1B (⏱ 2-5 minutos)..."
    echo "Esto es una sola vez. Espera..."
    echo ""

    # Crear servicio Ollama temporal si es necesario
    if ! pgrep -f "ollama serve" > /dev/null; then
      print_step "Iniciando Ollama en segundo plano..."
      ollama serve &
      OLLAMA_PID=$!
      sleep 3
    fi

    ollama pull gemma3:1b || {
      print_error "Error descargando Gemma. Verifica la conexión a internet."
      exit 1
    }

    print_success "Gemma 3 1B descargado ✅"
    echo ""
  fi
else
  print_error "Ollama no disponible - salta descarga de modelo"
fi

echo ""

# ============================================================================
# 5. NPM INSTALL
# ============================================================================

print_step "Instalando dependencias de Node.js..."
npm install || {
  print_error "Error en npm install"
  exit 1
}
print_success "Dependencias instaladas ✅"
echo ""

# ============================================================================
# 6. BUILD
# ============================================================================

print_step "Compilando TypeScript..."
npm run build || {
  print_error "Error en compilación"
  exit 1
}
print_success "Compilación completada ✅"
echo ""

# ============================================================================
# 7. RESUMEN Y SIGUIENTES PASOS
# ============================================================================

print_header "✅ JARVIS v2.0 INSTALADO CORRECTAMENTE"

echo ""
echo -e "${YELLOW}CONFIGURACIÓN ACTUAL:${NC}"
echo "  • Modelo IA: Gemma 3 1B (local, 4GB VRAM)"
echo "  • Servidor: localhost:3000"
echo "  • Vault: .vault/notes (Obsidian markdown)"
echo "  • Database: SQLite en ./jarvis.db"
echo ""

echo -e "${YELLOW}PRÓXIMOS PASOS:${NC}"
echo ""
echo "1️⃣  Asegúrate que Ollama está corriendo:"
echo "   $ ollama serve"
echo ""
echo "2️⃣  En otra terminal, inicia JARVIS:"
echo "   $ npm start"
echo ""
echo "3️⃣  Abre en tu navegador:"
echo "   http://localhost:3000"
echo ""

echo -e "${YELLOW}INFORMACIÓN IMPORTANTE:${NC}"
echo "  • Gemma 3 1B necesita ~4GB VRAM libre (GPU) o CPU"
echo "  • Primera respuesta será lenta (5-10s), las siguientes rápidas (~1-2s)"
echo "  • Tu conocimiento se guarda automáticamente en ./vault"
echo "  • Sin restricciones externas, sin APIs pagas"
echo ""

echo -e "${GREEN}¡LISTO! JARVIS está preparado.${NC}"
