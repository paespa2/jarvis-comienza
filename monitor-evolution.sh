#!/bin/bash

##############################################################################
# JARVIS EVOLUTION MONITOR
# Monitorea la auto-evolución de Jarvis en tiempo real
##############################################################################

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="${1:-http://localhost:3000}"
LOGFILE="jarvis-evolution.log"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       JARVIS AUTONOMOUS EVOLUTION MONITOR v1.0${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "URL: $BASE_URL"
echo "Logs: $LOGFILE"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Función para obtener estado
get_evolution_status() {
  curl -s "$BASE_URL/api/evolution/status"
}

# Función para formatear output
display_status() {
  local status="$1"
  local timestamp="$2"

  clear
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}       JARVIS EVOLUTION STATUS - $timestamp${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo ""

  # Extraer valores
  local version=$(echo "$status" | grep -o '"currentVersion":"[^"]*"' | cut -d'"' -f4)
  local strength=$(echo "$status" | grep -o '"strengthScore":"[^"]*"' | cut -d'"' -f4)
  local weaknesses=$(echo "$status" | grep -o '"totalWeaknesses":[0-9]*' | cut -d':' -f2)
  local nextsteps=$(echo "$status" | grep -o '"nextSteps":[0-9]*' | cut -d':' -f2)
  local optimizations=$(echo "$status" | grep -o '"appliedOptimizations":[0-9]*' | cut -d':' -f2)

  # Mostrar
  echo -e "${YELLOW}VERSION:${NC}                 $version"
  echo -e "${YELLOW}STRENGTH SCORE:${NC}          $strength"
  echo -e "${YELLOW}TOTAL WEAKNESSES:${NC}        $weaknesses"
  echo -e "${YELLOW}NEXT EVOLUTION STEPS:${NC}    $nextsteps"
  echo -e "${YELLOW}APPLIED OPTIMIZATIONS:${NC}   $optimizations"

  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo ""

  # Barra de progreso
  local strength_num=$(echo "$strength" | sed 's/%//')
  local strength_int=${strength_num%.*}
  local bar_length=$((strength_int / 5))
  local bar=""
  for ((i=0; i<bar_length; i++)); do
    bar="${bar}█"
  done
  for ((i=bar_length; i<20; i++)); do
    bar="${bar}░"
  done

  echo -e "${GREEN}Progress: [$bar] $strength_num%${NC}"
  echo ""

  # Timeline esperado
  echo -e "${YELLOW}EXPECTED EVOLUTION:${NC}"
  echo "  v1.0.0 (65%)  →  v1.0.1 (70%)  →  v1.1.0 (83%)  →  v2.0.0 (100%)"
  echo ""

  # Debilidades
  echo -e "${YELLOW}TOP WEAKNESSES TO FIX:${NC}"
  curl -s "$BASE_URL/api/evolution/weaknesses" | grep -o '"name":"[^"]*"' | head -3 | cut -d'"' -f4 | while read weakness; do
    echo "  • $weakness"
  done

  echo ""

  # Próximo objetivo
  echo -e "${YELLOW}NEXT EVOLUTION OBJECTIVE:${NC}"
  local objective=$(curl -s "$BASE_URL/api/evolution/next-objective" | grep -o '"objective":"[^"]*"' | cut -d'"' -f4)
  echo "  $objective"

  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo "Refreshing in 30 seconds... (Last update: $timestamp)"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

  # Log
  echo "[$timestamp] v=$version | strength=$strength | weaknesses=$weaknesses | optimizations=$optimizations" >> "$LOGFILE"
}

# Loop principal
iteration=0
while true; do
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  status=$(get_evolution_status)

  if [ ! -z "$status" ]; then
    display_status "$status" "$timestamp"
    ((iteration++))
  else
    echo -e "${RED}Error: Cannot connect to $BASE_URL${NC}"
    echo "Retrying in 10 seconds..."
    sleep 10
    continue
  fi

  # Esperar 30 segundos antes de siguiente actualización
  sleep 30
done
