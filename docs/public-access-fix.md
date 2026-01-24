# Fix de Acceso Público

**Fecha:** 2026-01-24  
**Sprint:** Normalización de acceso público

## Estado Actual

✅ **Acceso público funcionando correctamente**

## Diagnóstico Realizado

### 1. Middleware (`middleware.ts`)

```typescript
export function middleware(req: NextRequest) {
  // Solo intercepta rutas /admin/*
  if (!req.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();
  
  // Verifica rol para admin
  const role = req.cookies.get("traesol-role")?.value || "";
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
```

**Conclusión:** El middleware está correctamente configurado:
- Solo intercepta `/admin/:path*`
- Rutas públicas pasan sin interceptación (`NextResponse.next()`)
- Admin sin sesión redirige a `/login` (no 401)

### 2. Verificación de Rutas

| Ruta | Status | Esperado |
|------|--------|----------|
| `/` | 200 | ✅ |
| `/privacidad` | 200 | ✅ |
| `/operativos` | 200 | ✅ |
| `/contacto` | 200 | ✅ |
| `/novedades` | 200 | ✅ |
| `/admin` | 307 → `/login` | ✅ |

### 3. Build

```bash
npm run build  # ✅ Pasa correctamente
npm run dev    # ✅ Funciona en puerto 3008
```

## Posible Causa Original del 401

Si el usuario observó un 401 previamente, pudo deberse a:

1. **API Routes:** Algunas APIs pueden devolver 401 si se acceden directamente
2. **Fetch en cliente:** Si el frontend hace fetch a APIs protegidas al cargar
3. **Cache del navegador:** Una respuesta 401 cacheada anteriormente
4. **Error temporal:** El servidor pudo haber tenido un problema transitorio

## Verificación de Comandos

```bash
# Verificar acceso público
curl -I http://localhost:3008           # Espera: 200
curl -I http://localhost:3008/privacidad # Espera: 200
curl -I http://localhost:3008/operativos # Espera: 200

# Verificar protección admin
curl -I http://localhost:3008/admin      # Espera: 307 redirect a /login
```

## Conclusión

No se requirió ningún cambio. El sistema ya estaba correctamente configurado:
- Rutas públicas accesibles sin autenticación
- Rutas admin protegidas con redirect a login
- No hay 401 en rutas públicas
