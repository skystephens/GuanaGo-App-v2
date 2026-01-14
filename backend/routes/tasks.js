import express from 'express';

const router = express.Router();

/**
 * Sistema de Tareas - Endpoints para Make.com e IA
 * 
 * Este controlador maneja:
 * - GET /api/tasks - Obtener todas las tareas
 * - POST /api/tasks - Crear nueva tarea
 * - PUT /api/tasks/:id - Actualizar tarea
 * - POST /api/tasks/analyze - Análisis IA del estado del proyecto
 * - POST /api/tasks/webhook - Endpoint para Make.com
 */

// Almacenamiento temporal en memoria (en producción usar Airtable)
let tasks = [];
let lastAnalysis = null;

// Configuración de colores y labels
const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', priority: 2 },
  en_progreso: { label: 'En Progreso', priority: 1 },
  urgente_pendiente: { label: 'Urgente', priority: 0 },
  terminado: { label: 'Terminado', priority: 4 },
  bloqueado: { label: 'Bloqueado', priority: 3 }
};

const PRIORITY_ORDER = { critica: 0, alta: 1, media: 2, baja: 3 };

/**
 * GET /api/tasks
 * Obtener todas las tareas con filtros opcionales
 */
router.get('/', (req, res) => {
  try {
    const { status, categoria, prioridad, archivo } = req.query;
    
    let filteredTasks = [...tasks];
    
    if (status) {
      filteredTasks = filteredTasks.filter(t => t.status === status);
    }
    if (categoria) {
      filteredTasks = filteredTasks.filter(t => t.categoria === categoria);
    }
    if (prioridad) {
      filteredTasks = filteredTasks.filter(t => t.prioridad === prioridad);
    }
    if (archivo) {
      filteredTasks = filteredTasks.filter(t => t.archivoReferencia === archivo);
    }
    
    // Ordenar por urgencia y prioridad
    filteredTasks.sort((a, b) => {
      if (STATUS_CONFIG[a.status].priority !== STATUS_CONFIG[b.status].priority) {
        return STATUS_CONFIG[a.status].priority - STATUS_CONFIG[b.status].priority;
      }
      return PRIORITY_ORDER[a.prioridad] - PRIORITY_ORDER[b.prioridad];
    });
    
    res.json({
      success: true,
      total: filteredTasks.length,
      tasks: filteredTasks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tasks
 * Crear nueva tarea
 */
router.post('/', (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      prioridad = 'media',
      categoria = 'frontend',
      archivoReferencia,
      seccionReferencia,
      estimacionHoras,
      dependeDe
    } = req.body;
    
    if (!titulo) {
      return res.status(400).json({ success: false, error: 'El título es requerido' });
    }
    
    const newTask = {
      id: `task-${Date.now()}`,
      titulo,
      descripcion: descripcion || '',
      status: 'pendiente',
      prioridad,
      categoria,
      archivoReferencia,
      seccionReferencia,
      estimacionHoras,
      dependeDe: dependeDe || [],
      creadoPor: 'api',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    tasks.push(newTask);
    
    res.status(201).json({
      success: true,
      task: newTask
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/tasks/:id
 * Actualizar una tarea
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
    }
    
    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    // Si se marca como terminada, agregar fecha de completado
    if (updates.status === 'terminado' && tasks[taskIndex].status !== 'terminado') {
      updatedTask.completedAt = new Date().toISOString().split('T')[0];
    }
    
    tasks[taskIndex] = updatedTask;
    
    res.json({
      success: true,
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/tasks/:id
 * Eliminar una tarea
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
    }
    
    tasks.splice(taskIndex, 1);
    
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tasks/stats
 * Obtener estadísticas del proyecto
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      total: tasks.length,
      pendientes: tasks.filter(t => t.status === 'pendiente').length,
      enProgreso: tasks.filter(t => t.status === 'en_progreso').length,
      urgentesPendientes: tasks.filter(t => t.status === 'urgente_pendiente').length,
      terminadas: tasks.filter(t => t.status === 'terminado').length,
      bloqueadas: tasks.filter(t => t.status === 'bloqueado').length,
      porCategoria: {},
      porArchivo: {},
      horasEstimadas: tasks.reduce((sum, t) => sum + (t.estimacionHoras || 0), 0),
      horasReales: tasks.reduce((sum, t) => sum + (t.horasReales || 0), 0)
    };
    
    // Agrupar por categoría
    tasks.forEach(task => {
      if (!stats.porCategoria[task.categoria]) {
        stats.porCategoria[task.categoria] = { total: 0, completadas: 0 };
      }
      stats.porCategoria[task.categoria].total++;
      if (task.status === 'terminado') {
        stats.porCategoria[task.categoria].completadas++;
      }
    });
    
    // Agrupar por archivo de referencia
    tasks.forEach(task => {
      if (task.archivoReferencia) {
        if (!stats.porArchivo[task.archivoReferencia]) {
          stats.porArchivo[task.archivoReferencia] = { total: 0, completadas: 0 };
        }
        stats.porArchivo[task.archivoReferencia].total++;
        if (task.status === 'terminado') {
          stats.porArchivo[task.archivoReferencia].completadas++;
        }
      }
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tasks/analyze
 * Generar análisis del proyecto para IA
 * Retorna un prompt estructurado que puede ser enviado a GPT/Claude/Groq
 */
router.post('/analyze', (req, res) => {
  try {
    const urgentes = tasks.filter(t => t.status === 'urgente_pendiente' || t.prioridad === 'critica');
    const bloqueadas = tasks.filter(t => t.status === 'bloqueado');
    const enProgreso = tasks.filter(t => t.status === 'en_progreso');
    const sinDependencias = tasks.filter(t => 
      t.status === 'pendiente' && 
      (!t.dependeDe || t.dependeDe.length === 0 || t.dependeDe.every(depId => {
        const depTask = tasks.find(dt => dt.id === depId);
        return depTask && depTask.status === 'terminado';
      }))
    );
    
    // Calcular progreso por archivo
    const archivos = {};
    tasks.forEach(task => {
      if (task.archivoReferencia) {
        if (!archivos[task.archivoReferencia]) {
          archivos[task.archivoReferencia] = { total: 0, completadas: 0, tareas: [] };
        }
        archivos[task.archivoReferencia].total++;
        archivos[task.archivoReferencia].tareas.push(task.titulo);
        if (task.status === 'terminado') {
          archivos[task.archivoReferencia].completadas++;
        }
      }
    });
    
    const analysis = {
      timestamp: new Date().toISOString(),
      resumen: {
        total: tasks.length,
        completadas: tasks.filter(t => t.status === 'terminado').length,
        porcentajeCompletado: tasks.length > 0 
          ? Math.round(tasks.filter(t => t.status === 'terminado').length / tasks.length * 100) 
          : 0
      },
      alertas: {
        urgentes: urgentes.map(t => ({ id: t.id, titulo: t.titulo, prioridad: t.prioridad })),
        bloqueadas: bloqueadas.map(t => ({ id: t.id, titulo: t.titulo, dependeDe: t.dependeDe }))
      },
      enProgreso: enProgreso.map(t => ({
        id: t.id,
        titulo: t.titulo,
        horasEstimadas: t.estimacionHoras,
        horasReales: t.horasReales
      })),
      proximasAcciones: sinDependencias.slice(0, 5).map(t => ({
        id: t.id,
        titulo: t.titulo,
        categoria: t.categoria,
        prioridad: t.prioridad,
        estimacionHoras: t.estimacionHoras
      })),
      progresoArchivos: archivos,
      promptParaIA: `
Eres un asistente de gestión de proyectos para GuanaGO, una super-app turística para San Andrés Isla.

## Estado Actual del Proyecto

### Métricas Generales
- Total de tareas: ${tasks.length}
- Completadas: ${tasks.filter(t => t.status === 'terminado').length} (${tasks.length > 0 ? Math.round(tasks.filter(t => t.status === 'terminado').length / tasks.length * 100) : 0}%)
- En progreso: ${enProgreso.length}
- Pendientes: ${tasks.filter(t => t.status === 'pendiente').length}
- Urgentes: ${urgentes.length}
- Bloqueadas: ${bloqueadas.length}

### Tareas Urgentes/Críticas
${urgentes.length > 0 ? urgentes.map(t => `- ${t.titulo} (${t.prioridad})`).join('\n') : 'Ninguna'}

### Tareas Bloqueadas
${bloqueadas.length > 0 ? bloqueadas.map(t => `- ${t.titulo} - Depende de: ${t.dependeDe?.join(', ') || 'N/A'}`).join('\n') : 'Ninguna'}

### Próximas tareas disponibles (sin dependencias bloqueantes)
${sinDependencias.slice(0, 5).map(t => `- ${t.titulo} (${t.categoria}, ${t.prioridad}, ${t.estimacionHoras || '?'}h)`).join('\n')}

### Progreso por Documento
${Object.entries(archivos).map(([archivo, data]) => `- ${archivo}: ${data.completadas}/${data.total} (${Math.round(data.completadas/data.total*100)}%)`).join('\n')}

Por favor, analiza este estado y proporciona:
1. Un resumen ejecutivo del proyecto
2. Los 3 principales riesgos o cuellos de botella
3. Recomendaciones priorizadas para avanzar
4. Una sugerencia de enfoque para hoy
`
    };
    
    lastAnalysis = analysis;
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tasks/webhook
 * Endpoint para recibir datos desde Make.com
 * Puede recibir actualizaciones masivas o respuestas de IA
 */
router.post('/webhook', (req, res) => {
  try {
    const { action, data, aiResponse } = req.body;
    
    let result = {};
    
    switch (action) {
      case 'sync':
        // Sincronizar tareas desde Make.com/Airtable
        if (Array.isArray(data)) {
          tasks = data;
          result = { synced: tasks.length };
        }
        break;
        
      case 'bulk_update':
        // Actualización masiva de estados
        if (Array.isArray(data)) {
          data.forEach(update => {
            const taskIndex = tasks.findIndex(t => t.id === update.id);
            if (taskIndex !== -1) {
              tasks[taskIndex] = { ...tasks[taskIndex], ...update };
            }
          });
          result = { updated: data.length };
        }
        break;
        
      case 'ai_recommendation':
        // Guardar recomendación de IA
        if (aiResponse) {
          // Buscar tareas mencionadas y agregar notas
          tasks.forEach((task, idx) => {
            if (aiResponse.toLowerCase().includes(task.titulo.toLowerCase())) {
              tasks[idx].notasIA = aiResponse;
              tasks[idx].ultimoAnalisis = new Date().toISOString();
            }
          });
          result = { processed: true, recommendation: aiResponse };
        }
        break;
        
      case 'get_pending':
        // Retornar tareas pendientes para procesamiento en Make
        result = {
          pendientes: tasks.filter(t => t.status === 'pendiente'),
          urgentes: tasks.filter(t => t.status === 'urgente_pendiente'),
          enProgreso: tasks.filter(t => t.status === 'en_progreso')
        };
        break;
        
      default:
        return res.status(400).json({ success: false, error: 'Acción no reconocida' });
    }
    
    res.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tasks/export
 * Exportar todas las tareas en formato compatible con Make.com
 */
router.get('/export', (req, res) => {
  try {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project: 'GuanaGO',
      stats: {
        total: tasks.length,
        completadas: tasks.filter(t => t.status === 'terminado').length,
        pendientes: tasks.filter(t => t.status === 'pendiente').length,
        urgentes: tasks.filter(t => t.status === 'urgente_pendiente').length
      },
      tasks: tasks.map(t => ({
        ...t,
        statusLabel: STATUS_CONFIG[t.status]?.label || t.status
      }))
    };
    
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
