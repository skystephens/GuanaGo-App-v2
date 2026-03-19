# 💎 GUÍA: Usar Claude Code Eficientemente (Sin Desperdiciar Tokens)

## 🚨 PROBLEMA QUE TUVISTE

"Usé Claude Code 1 vez, gasté muchos tokens, no guardé la conversación, ahora no tengo contexto"

---

## ✅ SOLUCIÓN: Estrategia de 3 Capas

```
┌────────────────────────────────────────────┐
│ CAPA 1: AIRTABLE (Memoria Permanente)     │ ← GRATIS, Infinito
│ Todo el contexto vive aquí                │
└────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────┐
│ CAPA 2: Archivos .md Locales              │ ← GRATIS
│ Resúmenes y decisiones importantes         │
└────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────┐
│ CAPA 3: Claude Code (Solo para ejecutar)  │ ← TOKENS LIMITADOS
│ Usarlo SOLO cuando necesites código       │
└────────────────────────────────────────────┘
```

---

## 🎯 REGLA DE ORO

**NUNCA uses Claude Code para:**
- ❌ Brainstorming
- ❌ Planificación
- ❌ Discusiones de arquitectura
- ❌ Investigación
- ❌ Preguntas generales

**SOLO usa Claude Code para:**
- ✅ "Implementa TASK-001"
- ✅ "Fix bug en archivo X"
- ✅ "Refactoriza componente Y"
- ✅ "Escribe tests para Z"

---

## 📝 WORKFLOW EFICIENTE

### ANTES de abrir Claude Code:

**1. Planifica en Airtable (GRATIS)**

```
Crea tarea en Tasks_Kanban:
┌──────────────────────────────────────────┐
│ ID: TASK-007                             │
│ Nombre: Crear componente PointsBalance  │
│ Descripción: Componente React que...    │
│ Archivos: /src/components/points/...    │
│ Documentos: Link a DOC-001              │
└──────────────────────────────────────────┘

Crea spec en Documentos_RAG:
┌──────────────────────────────────────────┐
│ ID: DOC-007                              │
│ Título: Spec PointsBalance              │
│ Contenido_Markdown:                      │
│   # Componente PointsBalance            │
│   ## Props                               │
│   - userId: string                       │
│   - compact?: boolean                    │
│   ## Lógica                              │
│   - Fetch puntos desde Zustand           │
│   - Mostrar con animación                │
│   ## Diseño                              │
│   - Card con gradiente                   │
│   - Ícono de estrella                    │
└──────────────────────────────────────────┘
```

**2. Escribe contexto en archivo .md local**

```bash
# En tu proyecto
echo "
# TASK-007: PointsBalance Component

## Objetivo
Crear componente que muestre balance de puntos del usuario

## Dependencias
- usePointsStore (ya existe en src/stores/pointsStore.ts)
- PointsIcon (importar de lucide-react)

## Ubicación
src/components/points/PointsBalance.tsx

## Tests
src/components/points/PointsBalance.test.tsx

## Criterios de éxito
- [x] Componente renderiza correctamente
- [x] Muestra puntos desde store
- [x] Animación de contador
- [x] Tests unitarios passing
" > .claude/tasks/TASK-007.md
```

**3. Sincroniza con script (opcional)**

```bash
npm run sync-airtable
# Baja todas las tareas y docs a .claude/context/
```

---

### DURANTE el uso de Claude Code:

**Prompt EFICIENTE (ahorra tokens):**

```
❌ MAL (desperdicia tokens):

"Hola Claude, necesito que me ayudes a crear un componente
para mostrar puntos del usuario. Debería ser un componente
React que use Zustand para el estado. Quiero que tenga una
animación cuando cambian los puntos. El diseño debe ser
moderno con un gradiente. También necesito que escribas tests.
Ah, y debería ser responsive. Usa TypeScript por favor..."

(200+ tokens de contexto que ya está en Airtable)
```

```
✅ BIEN (mínimos tokens):

Lee .claude/tasks/TASK-007.md y ejecútalo.
```

**O aún mejor con MCP:**

```
✅ ÓPTIMO (con MCP configurado):

Implementa TASK-007 de Airtable.
```

Claude Code lee automáticamente de Airtable vía MCP y tiene TODO el contexto.

---

### DESPUÉS de usar Claude Code:

**1. Claude actualiza Airtable automáticamente**

```javascript
// Claude Code hace esto al final:
await airtable.updateRecord('Tasks_Kanban', 'TASK-007', {
  Estado: 'Done',
  Fecha_Completado: new Date().toISOString(),
  Horas_Reales: 1.5,
  Notas_Técnicas: 'Implementado con Zustand. Tests: 5/5 passing'
});
```

**2. Guarda resumen en archivo .md**

```bash
# Claude Code puede crear esto:
echo "
# TASK-007: Completado

## Archivos creados:
- src/components/points/PointsBalance.tsx (✅)
- src/components/points/PointsBalance.test.tsx (✅)

## Tests: 5/5 passing

## Cambios adicionales:
- Agregado export en src/components/index.ts
- Actualizado PointsStore con método formatPoints()

## Próximos pasos:
- Integrar en Dashboard (TASK-008)
" >> .claude/completed/TASK-007-summary.md
```

**3. Commit a Git**

```bash
git add .
git commit -m "feat: implement PointsBalance component [TASK-007]"
git push
```

---

## 💰 COMPARACIÓN DE USO DE TOKENS

| Approach | Tokens/Tarea | Costo Aprox | Contexto Perdido |
|----------|--------------|-------------|------------------|
| **Sin estructura** | 10,000+ | $0.10 | ✗ Todo |
| **Con .md locales** | 3,000 | $0.03 | ✓ 50% guardado |
| **Con MCP + Airtable** | 500-1,000 | $0.01 | ✓ 100% guardado |

---

## 🎯 SETUP ÓPTIMO PARA TU CASO

### Estructura de carpetas recomendada:

```
guanago-monorepo/
├── .claude/
│   ├── mcp-config.json           ← Config MCP (Airtable)
│   ├── context/
│   │   ├── project.md            ← Info general (actualizar 1 vez/semana)
│   │   ├── architecture.md       ← Decisiones (actualizar cuando cambien)
│   │   └── current-tasks.json    ← Auto-sync de Airtable
│   ├── tasks/                    ← Specs detalladas (opcionales)
│   │   ├── TASK-001.md
│   │   └── TASK-007.md
│   └── completed/                ← Resúmenes post-tarea
│       ├── TASK-001-summary.md
│       └── TASK-007-summary.md
├── apps/
│   ├── b2b-agencias/
│   └── guanago-pwa/
└── package.json
```

---

## 🔧 COMANDOS ÚTILES

### Script: sync-airtable.js

```javascript
// package.json
{
  "scripts": {
    "sync": "node scripts/sync-airtable.js",
    "claude:task": "node scripts/claude-task.js"
  }
}
```

### scripts/claude-task.js

```javascript
#!/usr/bin/env node
const taskId = process.argv[2]; // TASK-007

if (!taskId) {
  console.log('Uso: npm run claude:task TASK-007');
  process.exit(1);
}

console.log(`
┌────────────────────────────────────────┐
│ Preparando Claude Code para ${taskId}  │
└────────────────────────────────────────┘

1. Sincronizando con Airtable...
2. Generando contexto mínimo...
3. Listo para Claude Code.

Prompt sugerido:
─────────────────────────────────────────
Implementa ${taskId} según spec en Airtable.
Al terminar, actualiza el estado a Done.
─────────────────────────────────────────
`);

// Aquí puedes agregar lógica adicional:
// - Fetch de Airtable
// - Crear archivo .md temporal
// - Abrir Claude Code automáticamente
```

---

## 📊 MONITOREO DE USO

### Trackear en Airtable: Tabla "Claude_Usage"

```
Fecha       | Tarea    | Tokens | Costo  | Eficiencia
------------|----------|--------|--------|-------------
2026-01-29  | TASK-001 | 8,500  | $0.085 | 🔴 Ineficiente
2026-01-30  | TASK-007 | 950    | $0.009 | 🟢 Óptimo
```

### Calculadora de eficiencia:

```javascript
// Añadir a tus métricas
const efficiency = (outputValue / tokensUsed) * 1000;

// outputValue = líneas de código útil generadas
// tokensUsed = tokens consumidos

// Meta: >5 líneas por 1K tokens
```

---

## 🎯 MEJORES PRÁCTICAS

### ✅ DO:

1. **Planifica fuera de Claude Code**
   - Usa Airtable para specs
   - Usa Gemini Gem (contexto grande) para arquitectura
   - Usa ChatGPT para brainstorming

2. **Claude Code solo para ejecución**
   - Prompts cortos
   - Referencias a archivos/tareas
   - Instrucciones claras

3. **Guarda el contexto**
   - Airtable actualizado automáticamente
   - Archivos .md con decisiones
   - Git commits descriptivos

### ❌ DON'T:

1. **No uses Claude Code como chat**
   - No preguntes "¿Qué opinas de..."
   - No pidas que explique conceptos
   - No hagas brainstorming

2. **No repitas contexto**
   - No copies/pegues specs cada vez
   - Usa MCP para que lea de Airtable
   - Referencia archivos, no los pegues

3. **No pierdas el trabajo**
   - Siempre guarda resumen
   - Commitea inmediatamente
   - Actualiza Airtable

---

## 💡 TRUCOS AVANZADOS

### 1. Pre-carga de contexto (1 vez/semana)

```bash
# Actualiza el contexto base
cat > .claude/context/project.md << EOF
# GuanaGO Project

Stack: React 18, Vite, TypeScript, Airtable
Estado: Pre-ANATO 2026

## Convenciones:
- Componentes en src/components/
- Tests co-located (.test.tsx)
- Zustand para state
- Naming: PascalCase componentes

## Decisiones recientes:
- [Leer de Airtable tabla Documentos_RAG tipo "Decisión"]

## Arquitectura:
- [Leer de DOC-002: Decisión Zustand]

Ver Airtable para detalles actualizados.
EOF
```

### 2. Aliases útiles

```bash
# .bashrc o .zshrc
alias ct="npm run claude:task"
alias sync="npm run sync-airtable"

# Uso:
$ sync           # Sincroniza Airtable
$ ct TASK-007    # Prepara para Claude Code
```

### 3. Template de prompt

```bash
# .claude/templates/implement-task.txt
Implementa {{TASK_ID}} de Airtable.

Contexto en:
- Airtable tabla Tasks_Kanban
- Docs relacionados en Documentos_RAG
- Archivos afectados listados en tarea

Al terminar:
1. Ejecuta tests
2. Actualiza Airtable (estado → Done)
3. Genera resumen en .claude/completed/
```

---

## 🚀 RESULTADO FINAL

Con este setup:

✅ **Ahorras 80% de tokens**
- De 10K → 2K tokens por tarea

✅ **Nunca pierdes contexto**
- Todo en Airtable + Git

✅ **Workflow repetible**
- Mismo proceso para cada tarea

✅ **Escalable**
- Funciona para 10 o 1,000 tareas

---

## 📞 PRÓXIMOS PASOS

1. **HOY: Termina relaciones Airtable** (Paso 7)
2. **HOY: Crea tabla Reservas** (para automatización)
3. **MAÑANA: Setup Make.com** (email → voucher)
4. **MAÑANA: Config MCP en Claude Code**
5. **PASADO: Primera tarea optimizada**

---

**¿Con cuál empezamos: Automatización de reservas o Setup eficiente de Claude Code?**

Yo recomiendo **automatización de reservas** porque:
- ROI inmediato (ahorras tiempo HOY)
- Practica Make.com (necesario para el sistema completo)
- Genera confianza en automatización
- Libera tiempo para configurar Claude Code bien
