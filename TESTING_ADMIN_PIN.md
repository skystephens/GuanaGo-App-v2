# 🧪 Instrucciones de Testing - Admin PIN Login

## Pre-requisitos
✅ Servidor corriendo: `npm start` (http://localhost:5000)
✅ Tabla en Airtable: `Usuarios_Admins` con al menos 1 registro activo

---

## 📋 Registro en Airtable (OBLIGATORIO)

**Tabla**: `Usuarios_Admins`

Crear un registro con estos campos:
| Campo | Valor | Tipo |
|-------|-------|------|
| `PIN` | `1234` | Text |
| `Nombre` | `Admin Principal` | Text |
| `Email` | `admin@guanago.com` | Email |
| `Rol` | `SuperAdmin` | Text |
| `Activo` | `✓` | Checkbox (DEBE estar checked) |

⚠️ **Sin este registro, el login fallará**.

---

## 🧑‍💻 Test #1: PIN Correcto

### Pasos:
1. Abrir http://localhost:5000 en navegador
2. Ir a la sección "Cuenta" (clickear ícono de Wallet en bottom nav)
3. Ver página con 3 opciones:
   - "Iniciar Sesión Turista"
   - "Socio Operador"
   - "Administrador"
4. Clickear botón "Administrador" (botón púrpura con escudo)
5. Debería abrirse un modal con:
   - Ícono de Lock
   - Título "Panel de Admin"
   - Input para PIN
   - Botón "Ingresar"
6. Ingresar PIN: `1234`
7. Clickear "Ingresar"

### Resultado Esperado: ✅
```
Estado: "Validando..." (spinner)
Luego: Cambio automático a rol SuperAdmin
Pantalla: Mostrar panel "AdminBackend" con tablas
```

### Si funciona:
- Logs en console deberían mostrar:
```javascript
🔐 Enviando PIN a /api/validate-admin-pin
📊 Response status: 200
✅ PIN válido, guardando sesión
```

---

## 🧑‍💻 Test #2: PIN Incorrecto

### Pasos:
1. Repetir pasos 1-6 de Test #1
2. Ingresar PIN: `9999` (INCORRECTO)
3. Clickear "Ingresar"

### Resultado Esperado: ✅
```
Mensaje: "PIN incorrecto. Intentos restantes: 4"
Input se limpia automáticamente
Contador de intentos baja a 4
```

### Si funciona:
- Logs en console:
```javascript
📊 Response status: 200
⚠️ PIN no coincide o usuario no está activo
```

---

## 🧑‍💻 Test #3: Límite de 5 Intentos

### Pasos:
1. Abrir modal PIN (repetir Test #1, paso 1-5)
2. Ingresar PIN incorrecto 5 veces:
   - Intento 1: 9999 → Intentos: 4
   - Intento 2: 8888 → Intentos: 3
   - Intento 3: 7777 → Intentos: 2
   - Intento 4: 6666 → Intentos: 1
   - Intento 5: 5555 → Intentos: 0

### Resultado Esperado: ✅
```
Después del intento 5:
Mensaje: "Demasiados intentos fallidos. Intenta más tarde."
Botón "Ingresar": DESHABILITADO (gris)
Input: DESHABILITADO
Única solución: Refrescar página (F5)
```

---

## 🧑‍💻 Test #4: Sesión Persistente (Refresh)

### Pasos:
1. Hacer login con PIN correcto (Test #1)
2. Esperar a que aparezca AdminBackend panel
3. Presionar F5 (refrescar página)
4. Esperar a que cargue

### Resultado Esperado: ✅
```
Debería mostrar inmediatamente:
- AdminBackend panel (sin pedir PIN nuevamente)
- Tablas de sincronización
- Estado de caché

NO debería:
- Pedir PIN otra vez
- Mostrar modal de login
```

### Si funciona:
- En localStorage debería existir:
```javascript
localStorage.getItem('admin_session')
// Retorna: {user: {...}, expiresAt: "...", loginTime: "..."}
```

---

## 🧑‍💻 Test #5: Expiración de Sesión (Avanzado)

### Pasos:
1. Hacer login con PIN correcto
2. En DevTools Console, correr:
```javascript
const session = JSON.parse(localStorage.getItem('admin_session'));
session.expiresAt = new Date(Date.now() - 1000).toISOString(); // 1s atrás
localStorage.setItem('admin_session', JSON.stringify(session));
```
3. Refrescar página (F5)

### Resultado Esperado: ✅
```
Debería mostrar:
- Modal PIN login nuevamente
- Sesión expirada se detectó
- localStorage se limpió
```

---

## 🧑‍💻 Test #6: Botón Admin desde Cuenta

### Pasos:
1. Abrir http://localhost:5000
2. Clickear "Cuenta" (bottom nav)
3. En la sección "Accesos de Gestión" ver 2 botones
4. Clickear botón azul "Socio Operador"
5. Debería cambiar a vista Socio (sin pedir PIN)
6. Volver a "Cuenta"
7. Clickear botón púrpura "Administrador"

### Resultado Esperado: ✅
```
Debería:
- Abrir modal PIN
- NO cambiar rol directamente
- Requerir autenticación
```

---

## 🧑‍💻 Test #7: Panel Inferior (Menu)

### Pasos:
1. Abrir http://localhost:5000
2. En bottom nav (parte inferior), debería haber icono de "Database" o "Datos"
3. Clickear directamente

### Resultado Esperado: ✅
```
Debería acceder a AdminBackend directamente
SIN pedir PIN

(Esto es por diseño - acceso rápido para admins)
```

⚠️ **Nota**: Este acceso directo existe pero podría deshabilitarse si se desea mayor seguridad.

---

## 📊 Checklist Final

| Test | Esperado | Resultado | Status |
|------|----------|-----------|--------|
| PIN correcto | Login exitoso | - | [ ] |
| PIN incorrecto | Error + contador | - | [ ] |
| 5 intentos | Bloqueado | - | [ ] |
| Refresh página | Mantiene sesión | - | [ ] |
| Expiración | Logout automático | - | [ ] |
| Botón admin | Abre PIN modal | - | [ ] |
| Menu panel | Acceso directo | - | [ ] |

---

## 🔍 Debugging

### Si PIN no funciona:

**1. Verificar que Airtable tabla existe:**
```bash
# En Airtable web:
Ir a: https://airtable.com/
Buscar base: GuanaGO
Tabla: Usuarios_Admins
```

**2. Verificar registro:**
```
PIN: 1234 (exacto, sin espacios)
Activo: ✓ checkbox DEBE estar checked
```

**3. Ver logs en DevTools Console:**
```javascript
// Abrir DevTools: F12 o Ctrl+Shift+I
// Tab: Console
// Buscar logs que comiencen con 🔐 o ❌
```

**4. Revisar Network:**
```
DevTools → Network tab
Buscar request POST /api/validate-admin-pin
Response status: 200
Response body: {success: true/false, user: {...}}
```

### Si sesión no persiste:

**1. Verificar localStorage:**
```javascript
// DevTools Console:
localStorage.getItem('admin_session')
// Debería retornar objeto JSON, NO null
```

**2. Verificar que localStorage no está deshabilitado:**
```javascript
try {
  localStorage.setItem('test', '1');
  localStorage.removeItem('test');
  console.log('localStorage OK');
} catch(e) {
  console.log('localStorage DISABLED');
}
```

---

## ✅ Certificación de Funcionamiento

Una vez completados todos los tests y obtenidos los resultados esperados:

```
✅ PIN Validation: Funciona correctamente
✅ Sesión Persistente: Mantiene login después de refresh
✅ Límite de Intentos: Bloquea después de 5 intentos
✅ Expiración: Limpia sesión automáticamente
✅ Integración Admin: Modal funciona desde AccountDashboard
✅ Menu Directo: Acceso sin PIN desde bottom nav

CERTIFICACIÓN: 🟢 LISTO PARA DEPLOYMENT
```

---

## 📞 Soporte / Problemas

Si algo no funciona:
1. Ver sección "Debugging" arriba
2. Revisar console logs
3. Verificar tabla en Airtable
4. Revisar archivo: [FIXES_ADMIN_AUTH_v2.md](FIXES_ADMIN_AUTH_v2.md)

---

**Desarrollado por**: GitHub Copilot  
**Versión**: 1.0  
**Fecha**: 16 Enero 2026  
**Estado**: Listo para testing
