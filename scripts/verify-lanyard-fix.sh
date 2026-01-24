#!/bin/bash
# Script de verificación: Fix Lanyard Type
# Fecha: 2026-01-23

echo "🔍 Verificación: Fix Lanyard Type Schema Error"
echo "=============================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
  fi
}

echo "1️⃣  Verificando que NO existen referencias incorrectas a 'lanyard_types' (plural)..."

# Buscar en massiveDelivery.ts
if grep -q "\.lanyard_types" src/lib/inventario/massiveDelivery.ts 2>/dev/null; then
  echo -e "${RED}❌ FAIL${NC}: massiveDelivery.ts tiene referencias a .lanyard_types (debe ser .lanyard_type)"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS${NC}: massiveDelivery.ts NO tiene referencias incorrectas"
  ((PASSED++))
fi

# Buscar en export/route.ts
if grep -q "\.lanyard_types" src/app/api/admin/inventario/export/route.ts 2>/dev/null; then
  echo -e "${RED}❌ FAIL${NC}: export/route.ts tiene referencias a .lanyard_types"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS${NC}: export/route.ts NO tiene referencias incorrectas"
  ((PASSED++))
fi

echo ""
echo "2️⃣  Verificando sintaxis CORRECTA de joins..."

# Verificar join correcto en massiveDelivery
grep -q "lanyard_type:lanyard_type_id" src/lib/inventario/massiveDelivery.ts
check "massiveDelivery.ts usa sintaxis correcta lanyard_type:lanyard_type_id"

# Verificar join correcto en export
grep -q "lanyard_type:lanyard_type_id" src/app/api/admin/inventario/export/route.ts
check "export/route.ts usa sintaxis correcta"

# Verificar join correcto en gear-status
grep -q "lanyard_type:lanyard_type_id" src/app/api/admin/voluntarios/\[id\]/gear-status/route.ts
check "gear-status/route.ts usa sintaxis correcta"

echo ""
echo "3️⃣  Verificando acceso correcto al resultado (singular)..."

# Verificar que massiveDelivery usa .lanyard_type (singular)
grep -q "operativo\.lanyard_type" src/lib/inventario/massiveDelivery.ts
check "massiveDelivery.ts accede a operativo.lanyard_type (singular)"

grep -q "i\.lanyard_type" src/lib/inventario/massiveDelivery.ts
check "massiveDelivery.ts accede a i.lanyard_type (singular)"

# Verificar export
grep -q "item\.lanyard_type" src/app/api/admin/inventario/export/route.ts
check "export/route.ts accede a item.lanyard_type (singular)"

echo ""
echo "4️⃣  Verificando que gear-status tiene método PUT..."
grep -q "export async function PUT" src/app/api/admin/voluntarios/\[id\]/gear-status/route.ts
check "gear-status/route.ts tiene método PUT"

echo ""
echo "5️⃣  Verificando documentación creada..."
test -f docs/fix-lanyard-type.md
check "docs/fix-lanyard-type.md existe"

test -f docs/sql/20260123_fix_lanyard_type_verificacion.sql
check "SQL de verificación existe"

echo ""
echo "6️⃣  Verificando database.types.ts..."

# Verificar que volunteer_gear_status tiene lanyard_type_id
grep -A 20 "volunteer_gear_status:" src/lib/database.types.ts | grep -q "lanyard_type_id"
check "volunteer_gear_status tiene campo lanyard_type_id"

# Verificar que lanyard_types existe como tabla
grep -q "lanyard_types:" src/lib/database.types.ts
check "lanyard_types existe en database.types.ts"

echo ""
echo "7️⃣  Verificando errores de compilación..."
npx tsc --noEmit 2>&1 | grep -E "src/lib/inventario/massiveDelivery.ts.*lanyard|src/app/api/admin/inventario/export/route.ts.*lanyard" > /dev/null
if [ $? -eq 0 ]; then
  echo -e "${RED}❌ FAIL${NC}: Hay errores relacionados con lanyard en compilación"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS${NC}: No hay errores de lanyard en compilación"
  ((PASSED++))
fi

echo ""
echo "=============================================="
echo -e "Resultados: ${GREEN}${PASSED} PASSED${NC} | ${RED}${FAILED} FAILED${NC}"
echo "=============================================="
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ¡Todas las verificaciones pasaron!${NC}"
  echo ""
  echo "Próximos pasos:"
  echo "1. Levantar servidor: npm run dev"
  echo "2. Ir a Admin → Voluntarios → [cualquier voluntario]"
  echo "3. Verificar sección 'Equipamiento del voluntario'"
  echo "4. NO debe aparecer error 'schema cache'"
  echo "5. Guardar cambios debe funcionar correctamente"
  exit 0
else
  echo -e "${RED}⚠️  Algunas verificaciones fallaron${NC}"
  echo "Revisar los mensajes arriba para más detalles"
  exit 1
fi
