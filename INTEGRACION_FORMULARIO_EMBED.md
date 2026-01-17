# 🔗 Integración Formulario Embed - Panel de Socios

## 📌 URLs y Códigos

### Formulario de Alojamientos_Solicitudes

**URL Público:**
```
https://airtable.com/appiReH55Qhrbv4Lk/pagLkVPNTpes8TUto/form
```

**Código Embed (iframe):**
```html
<iframe 
  class="airtable-embed" 
  src="https://airtable.com/embed/appiReH55Qhrbv4Lk/pagLkVPNTpes8TUto/form" 
  frameborder="0" 
  onmousewheel="" 
  width="100%" 
  height="533" 
  style="background: transparent; border: 1px solid #ccc;">
</iframe>
```

---

## 🎯 Dónde Integrar (en la App)

### Ubicación: Panel de Socios → Alojamientos

**Ruta esperada:**
```
Pages/partner/PartnerAccommodations.tsx  (NUEVO COMPONENTE)
o
Pages/socio/SocioAlojamientos.tsx
```

**Estructura:**
```
Partner Portal
├─ Dashboard
├─ Mi Perfil
├─ ✨ Alojamientos ← AQUÍ VA EL EMBED
│  ├─ [Formulario embed] ← Enviar nuevos alojamientos
│  └─ [Lista de solicitudes] ← Ver estado (Pendiente/Aprobado/Rechazado)
└─ Transacciones
```

---

## 💻 Código React para Integrar

### Opción 1: Componente Simple con Embed

**Archivo: `pages/partner/PartnerAccommodations.tsx`**

```typescript
import React, { useState, useEffect } from 'react';

export default function PartnerAccommodations() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Verificar que el socio esté autenticado
    const role = localStorage.getItem('userRole');
    if (!role || (role !== 'socio' && role !== 'partner')) {
      // Redirigir a login si no es socio
      window.location.href = '/partner/login';
    }
    setUserRole(role);
  }, []);

  if (!userRole) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Alojamientos
          </h1>
          <p className="text-gray-600">
            Envía nuevos alojamientos, edita existentes y revisa el estado de tus solicitudes.
          </p>
        </div>

        {/* Dos columnas: Formulario + Estado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA 1: Formulario (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📝 Enviar Nuevo Alojamiento
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Completa el formulario para solicitar la publicación de un nuevo alojamiento. 
                Revisaremos tus datos y te notificaremos cuando sea aprobado.
              </p>
              
              {/* EMBED DEL FORMULARIO */}
              <div className="bg-gray-50 rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
                <iframe 
                  className="airtable-embed w-full" 
                  src="https://airtable.com/embed/appiReH55Qhrbv4Lk/pagLkVPNTpes8TUto/form" 
                  frameBorder={0}
                  width="100%" 
                  height="600" 
                  style={{ 
                    background: 'transparent', 
                    border: 'none',
                    borderRadius: '6px'
                  }}>
                </iframe>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: Info de Proceso (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 h-fit sticky top-4">
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                ✅ Flujo de Aprobación
              </h3>
              
              <div className="space-y-4">
                {/* Paso 1 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Envías solicitud</p>
                    <p className="text-sm text-gray-600">Completa todos los campos</p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Admin revisa</p>
                    <p className="text-sm text-gray-600">Validamos RNT y datos</p>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">✓ Aprobado</p>
                    <p className="text-sm text-gray-600">Aparece en la app</p>
                  </div>
                </div>
              </div>

              {/* Info adicional */}
              <div className="mt-6 pt-6 border-t border-blue-200">
                <p className="text-xs text-gray-600 font-semibold mb-2">💡 TIPS</p>
                <ul className="text-xs text-gray-600 space-y-2">
                  <li>✓ Usa RNT válido</li>
                  <li>✓ Foto clara y atractiva</li>
                  <li>✓ Precios coherentes</li>
                  <li>✓ Descripción detallada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Ver solicitudes (FUTURA) */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📋 Estado de Mis Solicitudes
          </h2>
          <p className="text-gray-600 mb-6">
            En futuras actualizaciones, verás aquí el estado de tus solicitudes (Pendiente/Aprobado/Rechazado).
          </p>
          <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-500">
            🔄 Vista de solicitudes próximamente
          </div>
        </div>

      </div>
    </div>
  );
}
```

---

### Opción 2: Componente con Tab (Formulario + Solicitudes)

```typescript
import React, { useState } from 'react';

export default function PartnerAccommodations() {
  const [activeTab, setActiveTab] = useState<'form' | 'status'>('form');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Encabezado */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🏨 Gestión de Alojamientos
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === 'form'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Nuevo Alojamiento
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === 'status'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Mis Solicitudes
          </button>
        </div>

        {/* Tab Content: Formulario */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Envía un nuevo alojamiento
            </h2>
            <p className="text-gray-600 mb-6">
              Completa el formulario y envía. El admin revisará y te notificará.
            </p>
            
            <div style={{ minHeight: '600px', borderRadius: '6px', overflow: 'hidden' }}>
              <iframe 
                className="airtable-embed w-full h-full" 
                src="https://airtable.com/embed/appiReH55Qhrbv4Lk/pagLkVPNTpes8TUto/form" 
                frameBorder={0}
                width="100%" 
                height="600">
              </iframe>
            </div>
          </div>
        )}

        {/* Tab Content: Status (Futuro) */}
        {activeTab === 'status' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Estado de mis solicitudes
            </h2>
            <div className="text-center py-12 text-gray-500">
              🔄 En desarrollo - próximamente verás aquí el estado de tus solicitudes
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
```

---

## 📍 Dónde Agregar la Ruta

### En `App.tsx` o `routes/index.tsx`

```typescript
import PartnerAccommodations from './pages/partner/PartnerAccommodations';

// Agregua a tu router:
<Route path="/partner/alojamientos" element={<PartnerAccommodations />} />
// o
<Route path="/socio/alojamientos" element={<PartnerAccommodations />} />
```

### En el Menú del Partner

```typescript
// pages/partner/PartnerDashboard.tsx o Navigation.tsx

<nav>
  <Link to="/partner/dashboard">Dashboard</Link>
  <Link to="/partner/profile">Perfil</Link>
  <Link to="/partner/alojamientos">🏨 Alojamientos</Link>  {/* ← NUEVO */}
  <Link to="/partner/transactions">Transacciones</Link>
</nav>
```

---

## 🔒 Seguridad y Autenticación

Asegúrate de proteger la ruta:

```typescript
// pages/partner/ProtectedRoute.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function ProtectedPartnerRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const socioId = localStorage.getItem('socioId');
    
    // Solo socio/partner pueden acceder
    if (!userRole || (userRole !== 'socio' && userRole !== 'partner') || !socioId) {
      navigate('/partner/login');
    }
  }, [navigate]);

  return <>{children}</>;
}

// Uso:
<Route 
  path="/partner/alojamientos" 
  element={
    <ProtectedPartnerRoute>
      <PartnerAccommodations />
    </ProtectedPartnerRoute>
  } 
/>
```

---

## 📊 Flujo Completo

```
USUARIO SOCIO
├─ Abre: /partner/alojamientos
├─ Ve el formulario embed
├─ Llena:
│  ├─ Nombre alojamiento
│  ├─ Tipo (Hotel/Posada/Casa)
│  ├─ Precios 1/2/3/4+
│  ├─ RNT, contacto, amenities
│  └─ [SUBMIT]
└─ Registro queda en Alojamientos_Solicitudes (Estado=Pendiente)

↓ (Automático - Airtable Automation)

ADMIN
├─ Ve solicitud en Airtable
├─ Revisa datos
├─ Si aprueba → Estado=Aprobado
└─ Automation: crea en ServiciosTuristicos_SAI + Publicado=true

↓ (Automático - Cache sync)

USUARIO TURISTA
├─ Ve nuevo alojamiento en Home → Alojamientos
├─ Selecciona huéspedes, noches, bebés
├─ Precio calcula correctamente
└─ Agrega al carrito
```

---

## 🎯 Próximos Pasos

1. ✅ Crea el archivo `pages/partner/PartnerAccommodations.tsx`
2. ✅ Copia el código (Opción 1 o 2)
3. ✅ Agrega la ruta en `App.tsx`
4. ✅ Agrega el link en el menú del partner
5. ⏳ Futuro: Dashboard para ver estado de solicitudes (conectar a Airtable para lectura)

---

## 📝 URLs de Referencia

| Recurso | URL |
|---------|-----|
| Formulario Público | https://airtable.com/appiReH55Qhrbv4Lk/pagLkVPNTpes8TUto/form |
| Tu Base Airtable | https://airtable.com/appiReH55Qhrbv4Lk |
| Tabla Alojamientos_Solicitudes | (dentro de la base) |
| Tabla ServiciosTuristicos_SAI | (dentro de la base) |

---

**Status:** 🟢 Listo para copiar-pegar en la app  
**Última actualización:** 17 Enero 2026  
**Versión:** 1.0
