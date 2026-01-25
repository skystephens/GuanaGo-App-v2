# 🚀 GUÍA RÁPIDA - GUIASAI B2B

## Inicio Rápido (5 minutos)

```bash
# 1. Navegar a la carpeta
cd guiasai-b2b

# 2. Instalar dependencias
npm install

# 3. Iniciar desarrollo
npm run dev

# 4. Abrir en navegador
http://localhost:5173

# 5. Para producción
npm run build
npm run build:wordpress
```

---

## 📁 Estructura Clave

```
guiasai-b2b/
├── src/
│   ├── components/          ← Componentes React
│   ├── pages/               ← Páginas principales
│   ├── services/            ← Llamadas API
│   ├── types/               ← Tipos TypeScript
│   ├── hooks/               ← Hooks personalizados
│   ├── styles/              ← Temas y estilos
│   └── App.tsx              ← Componente root
├── public/                  ← Imágenes y assets
├── README.md                ← Documentación completa
├── TAREAS_DESARROLLO.md     ← Plan de desarrollo
└── package.json
```

---

## 🎨 Colores GuiaSAI

```css
--guiasai-primary: #FF6600      /* Naranja */
--guiasai-secondary: #2FA9B8    /* Turquesa */
--guiasai-text-dark: #333333    /* Texto oscuro */
```

Usa estos en estilos:
```tsx
style={{ color: 'var(--guiasai-primary)' }}
```

---

## 🛠️ Componentes Base

### Botón
```tsx
<button className="btn btn-primary">Clickeame</button>
<button className="btn btn-secondary">Secundario</button>
<button className="btn btn-outline">Outline</button>
```

### Card
```tsx
<div className="card">
  <div className="card-header">
    <h3>Título</h3>
  </div>
  <div className="card-body">
    Contenido aquí
  </div>
</div>
```

### Alert
```tsx
<div className="alert alert-success">✓ Éxito!</div>
<div className="alert alert-warning">⚠ Advertencia</div>
<div className="alert alert-error">✗ Error</div>
```

---

## 📝 Crear Nuevo Componente

### 1. Crear archivo
`src/components/MiComponente.tsx`

```tsx
import React from 'react'

interface Props {
  titulo: string
  onAction: () => void
}

export const MiComponente: React.FC<Props> = ({ titulo, onAction }) => {
  return (
    <div style={styles.container}>
      <h3>{titulo}</h3>
      <button onClick={onAction}>Acción</button>
    </div>
  )
}

const styles = {
  container: {
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--guiasai-bg-white)',
    borderRadius: '8px',
  },
}
```

### 2. Exportar en App.tsx
```tsx
import { MiComponente } from './components/MiComponente'

export function App() {
  return <MiComponente titulo="Hola" onAction={() => {}} />
}
```

---

## 🔌 Crear Nuevo Servicio

### 1. Crear archivo
`src/services/miServicio.ts`

```typescript
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const miServicio = {
  // Obtener datos
  async obtenerDatos() {
    const response = await axios.get(`${API_URL}/datos`)
    return response.data
  },

  // Crear
  async crear(data: any) {
    const response = await axios.post(`${API_URL}/datos`, data)
    return response.data
  },

  // Actualizar
  async actualizar(id: string, data: any) {
    const response = await axios.put(`${API_URL}/datos/${id}`, data)
    return response.data
  },

  // Eliminar
  async eliminar(id: string) {
    await axios.delete(`${API_URL}/datos/${id}`)
  },
}
```

### 2. Usar en componente
```tsx
import { miServicio } from '@/services/miServicio'
import { useEffect, useState } from 'react'

export const MiComponente = () => {
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    miServicio.obtenerDatos().then(data => {
      setDatos(data)
      setCargando(false)
    })
  }, [])

  if (cargando) return <div>Cargando...</div>

  return (
    <div>
      {datos.map(item => (
        <div key={item.id}>{item.nombre}</div>
      ))}
    </div>
  )
}
```

---

## 🎯 Crear Hook Personalizado

### 1. Crear archivo
`src/hooks/useQuotation.ts`

```typescript
import { useState, useCallback } from 'react'
import { Quotation, AccommodationItem } from '@/types/quotation'

export function useQuotation() {
  const [quotation, setQuotation] = useState<Quotation | null>(null)

  const addAccommodation = useCallback((item: AccommodationItem) => {
    setQuotation(prev => {
      if (!prev) return null
      return {
        ...prev,
        accommodations: [...prev.accommodations, item],
        total: prev.total + item.total,
      }
    })
  }, [])

  const removeAccommodation = useCallback((itemId: string) => {
    setQuotation(prev => {
      if (!prev) return null
      const removed = prev.accommodations.find(a => a.id === itemId)
      return {
        ...prev,
        accommodations: prev.accommodations.filter(a => a.id !== itemId),
        total: prev.total - (removed?.total || 0),
      }
    })
  }, [])

  return {
    quotation,
    addAccommodation,
    removeAccommodation,
  }
}
```

### 2. Usar en componente
```tsx
import { useQuotation } from '@/hooks/useQuotation'

export const QuotationForm = () => {
  const { quotation, addAccommodation } = useQuotation()

  const handleAdd = () => {
    addAccommodation({
      id: '1',
      hotelId: 'hotel-1',
      hotelName: 'Las Palmeras',
      // ... más datos
    })
  }

  return (
    <button onClick={handleAdd}>
      Agregar {quotation?.accommodations.length || 0}
    </button>
  )
}
```

---

## 🔍 Debugging

### Console Logs
```typescript
console.log('Valor:', valor)
console.error('Error:', error)
console.table(datos) // Para arrays/objetos
```

### DevTools React
1. Instala: [React Developer Tools](https://react-devtools-extension.readthedocs.io/)
2. Abre DevTools (F12)
3. Tab "Components" - inspecciona props y state

### Depuración de Network
1. DevTools → Network tab
2. Filtra por XHR/Fetch
3. Verifica request/response

---

## 📝 Variables de Entorno

Crear archivo `.env.local`:
```
VITE_API_URL=http://localhost:3001/api
VITE_AIRTABLE_KEY=xxxxx
VITE_WOMPI_KEY=xxxxx
VITE_AGENCIA_API=http://localhost:3001/api/agencias
```

Acceder en código:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

---

## 📱 Responsive Design

### Mobile First
```css
/* Mobile (por defecto) */
.container {
  width: 100%;
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    width: 90%;
    max-width: 700px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    width: 80%;
    max-width: 1200px;
  }
}
```

### Grid Responsivo
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
```

---

## 🧪 Testing Básico

### Tests con Vitest
```typescript
// src/__tests__/services.test.ts
import { describe, it, expect } from 'vitest'
import { quotationService } from '@/services/quotationService'

describe('QuotationService', () => {
  it('debería crear una cotización', async () => {
    const result = await quotationService.createQuotation({
      userId: 'user-1',
      accommodations: [],
      tours: [],
      transports: [],
    })

    expect(result.id).toBeDefined()
    expect(result.total).toBe(0)
  })
})
```

### Run tests
```bash
npm run test
```

---

## 🚀 Deploy a WordPress

```bash
# 1. Build para producción
npm run build:wordpress

# 2. Upload a servidor
# Carpeta: /wp-content/plugins/guiasai-agencias/

# 3. Activar plugin en WordPress
# Dashboard → Plugins → Activar "GuiaSAI Agencias"

# 4. Acceder
# https://guiasanandresislas.com/agencias
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module"
```
→ Reinstala: npm install
→ Limpia cache: rm -rf node_modules && npm install
```

### App no carga en /agencias
```
→ Verifica: vite.config.ts tiene base: '/agencias/'
→ Verifica: .htaccess está en WordPress
```

### Botones no responden
```
→ Verifica: onClick handlers están bien pasados
→ Verifica: useState se actualiza correctamente
```

### API no conecta
```
→ Verifica: URL en .env.local es correcta
→ Verifica: Backend está corriendo
→ Abre DevTools → Network → mira requests
```

---

## 📚 Recursos Útiles

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Vite Docs](https://vitejs.dev)
- [Axios Docs](https://axios-http.com)

---

**¿Preguntas?** Contacta a Sky o el Dev Lead  
**Última actualización**: 20 de Enero, 2026
