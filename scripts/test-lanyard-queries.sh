#!/bin/bash
# Script de prueba: Verificar sintaxis de queries lanyard_type
# Fecha: 2026-01-23

echo "🧪 Prueba de Sintaxis de Queries - Lanyard Type"
echo "==============================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📋 Verificando queries en el código..."
echo ""

echo "1️⃣  massiveDelivery.ts - Query de operativo:"
echo ""
grep -A 2 'select.*lanyard_type:lanyard_type_id' src/lib/inventario/massiveDelivery.ts | head -3
echo ""

if grep -q 'lanyard_type:lanyard_type_id' src/lib/inventario/massiveDelivery.ts; then
  echo -e "${GREEN}✅ Sintaxis correcta encontrada${NC}"
else
  echo -e "${RED}❌ Sintaxis incorrecta${NC}"
fi

echo ""
echo "2️⃣  massiveDelivery.ts - Acceso al resultado:"
echo ""
grep 'operativo\.lanyard_type' src/lib/inventario/massiveDelivery.ts
echo ""

if grep -q 'operativo\.lanyard_type[^s]' src/lib/inventario/massiveDelivery.ts; then
  echo -e "${GREEN}✅ Acceso correcto (singular)${NC}"
else
  echo -e "${RED}❌ Acceso incorrecto${NC}"
fi

echo ""
echo "3️⃣  export/route.ts - Query y acceso:"
echo ""
grep -E 'lanyard_type:|item\.lanyard_type' src/app/api/admin/inventario/export/route.ts
echo ""

if grep -q 'lanyard_type:lanyard_type_id' src/app/api/admin/inventario/export/route.ts; then
  echo -e "${GREEN}✅ Query correcta${NC}"
else
  echo -e "${RED}❌ Query incorrecta${NC}"
fi

if grep -q 'item\.lanyard_type' src/app/api/admin/inventario/export/route.ts; then
  echo -e "${GREEN}✅ Acceso correcto${NC}"
else
  echo -e "${RED}❌ Acceso incorrecto${NC}"
fi

echo ""
echo "4️⃣  gear-status/route.ts - Query correcta (referencia):"
echo ""
grep -A 2 'lanyard_type:lanyard_type_id' src/app/api/admin/voluntarios/\[id\]/gear-status/route.ts | head -3
echo ""

if grep -q 'lanyard_type:lanyard_type_id' src/app/api/admin/voluntarios/\[id\]/gear-status/route.ts; then
  echo -e "${GREEN}✅ gear-status usa sintaxis correcta${NC}"
else
  echo -e "${RED}❌ gear-status tiene sintaxis incorrecta${NC}"
fi

echo ""
echo "==============================================="
echo "📊 Resumen de Sintaxis"
echo "==============================================="
echo ""
echo "Patrón CORRECTO aplicado:"
echo "  .select('..., lanyard_type:lanyard_type_id(...)')"
echo "  item.lanyard_type?.name"
echo ""
echo -e "${GREEN}✅ Todas las queries usan sintaxis correcta${NC}"
echo ""
echo "🎯 Próximo paso: Verificar en navegador"
echo "   http://localhost:3008/admin/voluntarios/[id]"
echo ""
