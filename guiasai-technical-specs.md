# 🌴 GUIASAI BUSINESS - ESPECIFICACIONES TÉCNICAS DE REDISEÑO
## Hub Turístico Premium San Andrés y Providencia

---

## 📑 ÍNDICE
1. Resumen Ejecutivo
2. Sistema de Diseño
3. Componentes UI Premium
4. Arquitectura Visual
5. Guía de Implementación
6. Assets y Recursos
7. Checklist de Calidad

---

## 1. RESUMEN EJECUTIVO

### 🎯 Objetivo del Rediseño
Transformar GuiaSAI Business en la plataforma B2B de turismo más atractiva y confiable del Caribe colombiano, diseñada específicamente para impresionar a agencias de viajes internacionales y conectarlas con proveedores locales certificados de San Andrés y Providencia.

### 💡 Propuesta de Valor Única
- **Soporte Post-Venta 24/7** por equipo local
- **Proveedores Verificados** - Empresarios locales certificados
- **Respuesta Inmediata** - Cotizaciones en <2 horas
- **Comisiones Competitivas** - Estructura transparente

### 🎨 Identidad Visual Actualizada

**Paleta de Colores Premium:**
```css
/* Océano Caribeño */
--primary-ocean: #00B4D8;
--primary-coral: #FF6B35;
--secondary-turquoise: #06FFA5;
--secondary-deepblue: #023E8A;

/* Gradientes de Lujo */
--gradient-ocean: linear-gradient(135deg, #00B4D8 0%, #0077B6 50%, #023E8A 100%);
--gradient-sunset: linear-gradient(135deg, #FF8C42 0%, #FF6B35 50%, #E63946 100%);
--gradient-paradise: linear-gradient(135deg, #06FFA5 0%, #00B4D8 50%, #023E8A 100%);
```

**Tipografías:**
- **Display/Títulos:** Playfair Display (serif elegante)
- **UI/Navegación:** Poppins (sans-serif moderna)
- **Cuerpo/Texto:** Inter (legibilidad óptima)

---

## 2. SISTEMA DE DISEÑO

### 🎨 Design Tokens

#### Espaciado
```css
--spacing-xs: 0.25rem;    /* 4px */
--spacing-sm: 0.5rem;     /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */
--spacing-2xl: 3rem;      /* 48px */
--spacing-3xl: 4rem;      /* 64px */
```

#### Bordes y Radios
```css
--radius-sm: 0.5rem;      /* Inputs, tags */
--radius-md: 0.75rem;     /* Botones estándar */
--radius-lg: 1rem;        /* Tarjetas pequeñas */
--radius-xl: 1.5rem;      /* Tarjetas principales */
--radius-2xl: 2rem;       /* Modales, secciones destacadas */
--radius-full: 9999px;    /* Pills, avatares */
```

#### Sombras (Elevation System)
```css
--shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
--shadow-soft: 0 2px 8px -2px rgba(0, 0, 0, 0.08);
--shadow-medium: 0 8px 16px -4px rgba(0, 0, 0, 0.12);
--shadow-large: 0 16px 32px -8px rgba(0, 0, 0, 0.16);
--shadow-xl: 0 24px 48px -12px rgba(0, 0, 0, 0.20);

/* Sombras de Marca */
--shadow-glow: 0 0 32px rgba(0, 180, 216, 0.3);
--shadow-glow-coral: 0 0 32px rgba(255, 107, 53, 0.3);
```

#### Transiciones
```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;

--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 3. COMPONENTES UI PREMIUM

### 📱 Header Premium con Glass Morphism

**Características:**
- Sticky positioning con backdrop-filter blur
- Transparencia adaptativa al scroll
- Navegación horizontal con pills interactivos
- Indicador de cotización con badge animado
- Avatar de usuario con dropdown

**Especificaciones Técnicas:**
```jsx
// React Component Structure
<header className="premium-header">
  <div className="header-container">
    <BrandSection>
      <LogoPremium />
    </BrandSection>
    
    <NavigationPremium>
      <NavLink active>Alojamientos</NavLink>
      <NavLink>Tours</NavLink>
      <NavLink>Transportes</NavLink>
    </NavigationPremium>
    
    <HeaderActions>
      <QuoteIndicator count={3} />
      <UserAvatar initials="AG" />
    </HeaderActions>
  </div>
</header>
```

**Estados:**
- Default: `background: rgba(255, 255, 255, 0.85)`
- Scrolled: `background: rgba(255, 255, 255, 0.95)`
- Mobile: Burger menu colapsable

**Animaciones:**
- Scroll transition: `250ms ease-out`
- Nav link hover: Scale + background fade
- Badge pulse: `2s infinite`

---

### 🎴 Service Cards Premium

**Anatomía de la Tarjeta:**
```
┌─────────────────────────────────┐
│   Image (16:10 aspect ratio)   │
│   ┌─────────────────────────┐   │
│   │ Overlay con Gradiente   │   │
│   │ Badges: Luxury, Type    │   │
│   │ Rating: ⭐⭐⭐⭐⭐ 4.9      │   │
│   └─────────────────────────┘   │
├─────────────────────────────────┤
│ Card Content                    │
│ • Título (Playfair 1.5rem)      │
│ • Ubicación con ícono           │
│ • Descripción (2-3 líneas)      │
│ • Feature tags (max 4)          │
├─────────────────────────────────┤
│ Footer                          │
│ Precio | Botón "Agregar"        │
└─────────────────────────────────┘
```

**Hover Effects:**
1. Card: `translateY(-8px)` + shadow elevation
2. Image: `scale(1.1)` con overflow hidden
3. Button: `scale(1.05)` + shadow increase

**Especificaciones CSS:**
```css
.service-card-premium {
  background: var(--white);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  transition: all 350ms ease-out;
  border: 1px solid var(--gray-100);
}

.service-card-premium:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: rgba(0, 180, 216, 0.3);
}
```

**Badges System:**
- Luxury: `background: linear-gradient(45deg, #FF6B35, #FFB627)`
- Boutique: `background: var(--gradient-ocean)`
- Eco-Friendly: `background: var(--accent-palm)`
- All-Inclusive: `background: var(--secondary-turquoise)`

---

### 🔍 Filtros Premium con Glass Effect

**Layout Responsive:**
- Desktop: Grid 4-5 columnas + botón
- Tablet: Grid 2-3 columnas
- Mobile: Stack vertical

**Componentes:**
```jsx
<FiltersCard>
  <FilterGrid>
    <FilterGroup label="📅 Fecha Check-in">
      <DatePicker />
    </FilterGroup>
    
    <FilterGroup label="👥 Huéspedes">
      <NumberInput min={1} max={20} />
    </FilterGroup>
    
    <FilterGroup label="💰 Presupuesto">
      <RangeSlider min={50} max={500} />
    </FilterGroup>
    
    <FilterGroup label="🏷️ Tipo">
      <MultiSelect options={[...]} />
    </FilterGroup>
    
    <ButtonFilter>🔍 Buscar</ButtonFilter>
  </FilterGrid>
</FiltersCard>
```

**Estados de Input:**
```css
.filter-input:focus {
  border-color: var(--primary-ocean);
  box-shadow: 0 0 0 4px rgba(0, 180, 216, 0.1);
  outline: none;
}
```

---

### 💬 Floating Quote Summary

**Comportamiento:**
- Fixed position: `bottom: 2rem; right: 2rem`
- Mobile: Full width bottom sheet
- Auto-show cuando se agrega primer item
- Draggable opcional (nice to have)

**Estructura:**
```jsx
<QuoteFloating active={itemCount > 0}>
  <QuoteHeader>
    <Title>Mi Cotización</Title>
    <ItemCount>{itemCount} servicios</ItemCount>
  </QuoteHeader>
  
  <QuoteItems maxHeight="200px" scrollable>
    {items.map(item => (
      <QuoteItem key={item.id}>
        <Thumbnail src={item.image} />
        <ItemInfo name={item.name} price={item.price} />
        <RemoveButton />
      </QuoteItem>
    ))}
  </QuoteItems>
  
  <QuoteTotal>
    <Label>Total Estimado</Label>
    <Amount>${totalAmount}</Amount>
  </QuoteTotal>
  
  <QuoteActions>
    <ButtonSecondary>Ver Detalle</ButtonSecondary>
    <ButtonPrimary>Enviar Cotización</ButtonPrimary>
  </QuoteActions>
</QuoteFloating>
```

**Animación de Entrada:**
```css
@keyframes slideInUp {
  from {
    transform: translateY(150%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.quote-floating.active {
  animation: slideInUp 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

## 4. ARQUITECTURA VISUAL

### 📐 Grid System

**Container Max-Width:** `1400px`
**Breakpoints:**
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Tablets portrait */
--breakpoint-md: 768px;   /* Tablets landscape */
--breakpoint-lg: 1024px;  /* Desktop pequeño */
--breakpoint-xl: 1280px;  /* Desktop estándar */
--breakpoint-2xl: 1400px; /* Desktop grande */
```

**Services Grid:**
```css
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2rem;
}

@media (max-width: 768px) {
  .services-grid {
    grid-template-columns: 1fr;
  }
}
```

---

### 🎭 Sección Hero Premium

**Elementos Clave:**
1. **Background:** Gradiente océano con pattern overlay
2. **Título:** Playfair Display 3.5rem (responsive)
3. **Subtítulo:** Descripción del hub con propuesta de valor
4. **Stats Cards:** 3 métricas clave (proveedores, soporte, satisfacción)

**Layout:**
```
┌───────────────────────────────────────────┐
│ Gradient Background + Pattern Overlay    │
│                                           │
│ [Título Grande]                           │
│ El Paraíso del Caribe para tus Clientes  │
│                                           │
│ [Subtítulo]                               │
│ Conecta con los mejores proveedores...   │
│                                           │
│ ┌────────┐  ┌────────┐  ┌────────┐      │
│ │ 150+   │  │ 24/7   │  │ 98%    │      │
│ │Provee. │  │Soporte │  │Satisf. │      │
│ └────────┘  └────────┘  └────────┘      │
└───────────────────────────────────────────┘
```

**Gradiente Hero:**
```css
.hero-premium {
  background: linear-gradient(135deg, #00B4D8 0%, #0077B6 50%, #023E8A 100%);
  position: relative;
  overflow: hidden;
}

.hero-pattern {
  position: absolute;
  opacity: 0.1;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.15), transparent 50%);
}
```

---

### 🏆 Trust Section

**Objetivo:** Reforzar credibilidad y diferenciación

**4 Pilares de Confianza:**
1. 🤝 **Soporte Post-Venta** - Equipo local 24/7
2. 💎 **Proveedores Verificados** - Empresarios certificados
3. ⚡ **Respuesta Inmediata** - Cotizaciones <2h
4. 💰 **Mejores Comisiones** - Estructura transparente

**Design:**
```jsx
<TrustSection gradient={oceanGradient}>
  <SectionTitle>¿Por qué elegir GuiaSAI Business?</SectionTitle>
  
  <TrustGrid cols={4}>
    <TrustCard>
      <IconCircle gradient="coral">🤝</IconCircle>
      <CardTitle>Soporte Post-Venta</CardTitle>
      <CardText>Equipo local dedicado 24/7...</CardText>
    </TrustCard>
    {/* Repetir para los 4 pilares */}
  </TrustGrid>
</TrustSection>
```

**Estilo de Cards:**
```css
.trust-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 2rem;
  border-radius: var(--radius-xl);
  text-align: center;
  box-shadow: var(--shadow-large);
  transition: transform 250ms ease-out;
}

.trust-card:hover {
  transform: translateY(-4px);
}
```

---

## 5. GUÍA DE IMPLEMENTACIÓN

### 🛠️ Stack Tecnológico Recomendado

**Frontend:**
- React 18+ (Hooks, Context API)
- TypeScript (type safety)
- Styled-components o Tailwind CSS
- Framer Motion (animaciones avanzadas)

**State Management:**
- Zustand o Redux Toolkit (cotización global)

**Data Fetching:**
- React Query (cache, loading states)
- Axios (HTTP client)

**Forms:**
- React Hook Form + Zod (validación)

---

### 📦 Estructura de Carpetas

```
src/
├── components/
│   ├── layout/
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   ├── Header.styles.ts
│   │   │   ├── Navigation.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── Footer/
│   │   └── MainLayout.tsx
│   │
│   ├── cards/
│   │   ├── ServiceCard/
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── ServiceCard.styles.ts
│   │   │   ├── CardImage.tsx
│   │   │   ├── CardContent.tsx
│   │   │   └── CardFooter.tsx
│   │   ├── TrustCard.tsx
│   │   └── QuoteItem.tsx
│   │
│   ├── filters/
│   │   ├── FilterPanel.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── GuestSelector.tsx
│   │   └── PriceRangeSlider.tsx
│   │
│   ├── quote/
│   │   ├── QuoteFloating.tsx
│   │   ├── QuoteList.tsx
│   │   ├── QuoteTotal.tsx
│   │   └── QuoteActions.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       └── Modal.tsx
│
├── pages/
│   ├── Accommodations.tsx
│   ├── Tours.tsx
│   ├── Transport.tsx
│   └── QuoteDetail.tsx
│
├── styles/
│   ├── tokens.ts (design tokens)
│   ├── global.css
│   └── animations.ts
│
├── hooks/
│   ├── useQuote.ts
│   ├── useFilters.ts
│   └── useScrollHeader.ts
│
└── utils/
    ├── formatPrice.ts
    └── dateHelpers.ts
```

---

### 🎯 Fases de Implementación

#### **FASE 1: Fundamentos (Semana 1-2)**
- [ ] Setup de proyecto con TypeScript
- [ ] Implementar design tokens
- [ ] Crear componentes UI base (Button, Input, Badge)
- [ ] Implementar layout básico (Header, Footer)

#### **FASE 2: Componentes Core (Semana 3-4)**
- [ ] Service Card Premium con todas sus variantes
- [ ] Sistema de filtros completo
- [ ] Grid responsive de servicios
- [ ] Navegación funcional

#### **FASE 3: Funcionalidad Cotización (Semana 5)**
- [ ] State management de cotización (Zustand)
- [ ] Floating Quote Summary
- [ ] Agregar/eliminar items
- [ ] Cálculo de totales
- [ ] Persistencia en localStorage

#### **FASE 4: Secciones Adicionales (Semana 6)**
- [ ] Hero Section con animaciones
- [ ] Trust Section
- [ ] Footer con enlaces
- [ ] About modal

#### **FASE 5: Interacciones y Animaciones (Semana 7)**
- [ ] Framer Motion para transiciones
- [ ] Scroll animations
- [ ] Micro-interactions en cards
- [ ] Loading states elegantes

#### **FASE 6: Responsive & Performance (Semana 8)**
- [ ] Mobile-first responsive
- [ ] Optimización de imágenes (lazy loading)
- [ ] Code splitting
- [ ] Performance testing
- [ ] Accessibility audit (A11y)

---

## 6. ASSETS Y RECURSOS

### 📸 Imágenes Necesarias

**Categorías:**
1. **Alojamientos** (mínimo 20 fotos de alta calidad)
   - Hoteles de lujo: 8 imágenes
   - Hoteles boutique: 6 imágenes
   - Posadas nativas: 6 imágenes

2. **Tours** (mínimo 15 fotos)
   - Snorkeling/buceo: 5 imágenes
   - Tour Johnny Cay: 3 imágenes
   - Vuelta a la isla: 4 imágenes
   - Hoyo Soplador: 3 imágenes

3. **Transportes** (mínimo 10 fotos)
   - Lanchas: 4 imágenes
   - Carros de golf: 3 imágenes
   - Transfer aeropuerto: 3 imágenes

**Especificaciones Técnicas:**
- Formato: WebP (fallback a JPG)
- Resolución mínima: 1920x1080px
- Aspect ratio tarjetas: 16:10
- Compresión: 85% quality
- Naming convention: `service-type-name-001.webp`

### 🎨 Iconografía

**Librería Recomendada:** Lucide Icons o Phosphor Icons

**Íconos Necesarios:**
- 🏨 Alojamiento
- 🚤 Tours
- ✈️ Transporte
- 📅 Calendario
- 👥 Huéspedes
- 💰 Precio
- ⭐ Rating
- 📍 Ubicación
- ✅ Check/incluye
- ❌ No incluye
- 🔍 Búsqueda
- ➕ Agregar
- 🗑️ Eliminar

---

### 🎭 Ilustraciones Custom (Opcional)

**Hero Illustrations:**
- Playa San Andrés estilizada
- Johnny Cay icónico
- Mar de 7 colores abstracto

**Empty States:**
- "No hay resultados" con ilustración de búsqueda
- "Cotización vacía" con maleta
- "Error de carga" con señal wifi

**Estilo Recomendado:** Flat design con gradientes sutiles, colores de marca

---

## 7. CHECKLIST DE CALIDAD

### ✅ Pre-Launch Checklist

#### **Performance**
- [ ] Lighthouse score >90 (Performance)
- [ ] First Contentful Paint <1.8s
- [ ] Time to Interactive <3.9s
- [ ] Imágenes optimizadas (WebP + lazy loading)
- [ ] Código minificado y comprimido
- [ ] Cache strategies implementadas

#### **Accessibility (A11y)**
- [ ] Lighthouse score >95 (Accessibility)
- [ ] Navegación por teclado funcional
- [ ] Screen reader compatible
- [ ] Contraste de colores WCAG AA
- [ ] Alt text en todas las imágenes
- [ ] ARIA labels apropiados
- [ ] Focus states visibles

#### **Responsive Design**
- [ ] Mobile (320px - 767px) ✓
- [ ] Tablet (768px - 1023px) ✓
- [ ] Desktop (1024px - 1439px) ✓
- [ ] Large Desktop (1440px+) ✓
- [ ] Touch targets mínimo 44x44px
- [ ] Texto legible sin zoom

#### **SEO**
- [ ] Meta tags completos
- [ ] Open Graph tags
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] Structured data (Schema.org)
- [ ] URLs semánticas

#### **Cross-Browser**
- [ ] Chrome (últimas 2 versiones)
- [ ] Firefox (últimas 2 versiones)
- [ ] Safari (últimas 2 versiones)
- [ ] Edge (últimas 2 versiones)

#### **Funcionalidad**
- [ ] Agregar a cotización funciona
- [ ] Eliminar de cotización funciona
- [ ] Filtros aplican correctamente
- [ ] Formulario de envío valida
- [ ] Navegación entre secciones suave
- [ ] Estados de carga/error

---

## 📊 KPIs de Éxito

**Métricas a Monitorear (Post-Launch):**

1. **Conversión:**
   - Tasa de cotizaciones enviadas
   - Tiempo promedio hasta primera cotización
   - Items promedio por cotización

2. **Engagement:**
   - Bounce rate <40%
   - Tiempo en sitio >3 minutos
   - Páginas por sesión >3

3. **Performance:**
   - Page load time <2s
   - Error rate <1%
   - Uptime >99.5%

---

## 🎓 Recursos Adicionales

**Documentación:**
- Figma Design File: [Link al proyecto]
- Style Guide: [Link a documentación]
- Component Library: Storybook deployment

**Contacto Técnico:**
- Design Lead: [nombre@email.com]
- Frontend Lead: [nombre@email.com]
- Product Owner: [nombre@email.com]

---

## 📝 Notas Finales

Este rediseño está específicamente optimizado para:
- **Impresionar agencias de viaje internacionales**
- **Destacar proveedores locales de San Andrés**
- **Transmitir confianza y profesionalismo**
- **Facilitar el proceso de cotización B2B**

El diferenciador clave es el **soporte post-venta local**, que debe estar visiblemente presente en toda la experiencia.

---

**Versión:** 1.0  
**Última actualización:** Enero 2026  
**Estado:** Ready for Development 🚀
