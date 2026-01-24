#!/bin/bash
# Script de verificación de fix: Operativos Disponibles
# Fecha: 2026-01-23

echo "🔍 Verificación de Fix: Operativos Disponibles en Admin"
echo "======================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
PASSED=0
FAILED=0

# Función para verificar
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
  fi
}

echo "1️⃣  Verificando archivos modificados existen..."
test -f src/app/admin/mensajeria/page.tsx
check "mensajeria/page.tsx existe"

test -f src/app/admin/invitaciones/page.tsx
check "invitaciones/page.tsx existe"

test -f src/app/admin/voluntarios/[id]/page.tsx
check "voluntarios/[id]/page.tsx existe"

echo ""
echo "2️⃣  Verificando filtro .eq('estado', 'publicado') en mensajeria..."
grep -q ".eq(\"estado\", \"publicado\")" src/app/admin/mensajeria/page.tsx
check "mensajeria tiene filtro de estado"

echo ""
echo "3️⃣  Verificando filtro .eq('estado', 'publicado') en invitaciones..."
grep -q ".eq(\"estado\", \"publicado\")" src/app/admin/invitaciones/page.tsx
check "invitaciones tiene filtro de estado"

echo ""
echo "4️⃣  Verificando filtro .eq('estado', 'publicado') en perfil voluntario..."
grep -q ".eq(\"estado\", \"publicado\")" src/app/admin/voluntarios/\[id\]/page.tsx
check "perfil voluntario tiene filtro de estado"

echo ""
echo "5️⃣  Verificando que gestión de operativos NO filtra (correcto)..."
if grep -q ".eq(\"estado\", \"publicado\")" src/app/admin/operativos/page.tsx; then
  echo -e "${RED}❌ FAIL${NC}: gestión de operativos NO debe filtrar por estado"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS${NC}: gestión de operativos muestra todos los estados"
  ((PASSED++))
fi

echo ""
echo "6️⃣  Verificando documentación creada..."
test -f docs/admin-operativos-disponibles.md
check "admin-operativos-disponibles.md existe"

test -f docs/qa/admin-operativos-disponibles-qa.md
check "QA document existe"

echo ""
echo "7️⃣  Verificando que no hay errores TypeScript en archivos modificados..."
npx tsc --noEmit 2>&1 | grep -E "src/app/admin/(mensajeria|invitaciones)/page.tsx" > /dev/null
if [ $? -eq 0 ]; then
  echo -e "${RED}❌ FAIL${NC}: Hay errores TypeScript en archivos modificados"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS${NC}: No hay errores TypeScript en archivos modificados"
  ((PASSED++))
fi

echo ""
echo "8️⃣  Verificando helpers existen en operativosShared..."
grep -q "isOperativoAbierto" src/lib/operativosShared.ts
check "isOperativoAbierto() existe"

grep -q "isOperativoParaPublico" src/lib/operativosShared.ts
check "isOperativoParaPublico() existe"

echo ""
echo "9️⃣  Verificando que público usa filtro correcto..."
grep -q "PUBLIC_OPERATIVO_STATES" src/lib/operativosPublic.ts
check "operativosPublic usa PUBLIC_OPERATIVO_STATES"

echo ""
echo "🔟  Verificando PROJECT_INDEX.md actualizado..."
grep -q "Operativos publicados ahora aparecen en Admin" docs/PROJECT_INDEX.md
check "PROJECT_INDEX.md documenta el fix"

echo ""
echo "======================================================="
echo -e "Resultados: ${GREEN}${PASSED} PASSED${NC} | ${RED}${FAILED} FAILED${NC}"
echo "======================================================="
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ¡Todas las verificaciones pasaron!${NC}"
  echo ""
  echo "Próximos pasos:"
  echo "1. Probar en navegador: crear operativo borrador → NO debe aparecer en dropdowns"
  echo "2. Publicar operativo → DEBE aparecer inmediatamente"
  echo "3. Ejecutar QA completo: docs/qa/admin-operativos-disponibles-qa.md"
  exit 0
else
  echo -e "${RED}⚠️  Algunas verificaciones fallaron${NC}"
  echo "Revisar los mensajes arriba para más detalles"
  exit 1
fi
