// ============================================================
// ARCHIVO: pages/admin/AdminSkyPanel.tsx
// SkyPanel Pro — Torre de Control multi-proyecto
// Adaptado al sistema de rutas interno de GuanaGO (sin React Router)
// Datos en tiempo real desde Airtable
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, RefreshCw, LogOut, GitBranch, ArrowLeft, ChevronRight
} from 'lucide-react';
import { AppRoute } from '../../types';

// ─── AIRTABLE CONFIG ─────────────────────────────────────────
const AT_TOKEN = import.meta.env.VITE_AIRTABLE_API_KEY;

type AirtableRecord = { id: string; fields: Record<string, any> };

async function fetchAirtable(baseId: string, table: string, params = ""): Promise<AirtableRecord[]> {
  if (!baseId || !AT_TOKEN) return [];
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}${params}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${AT_TOKEN}` } });
  if (!res.ok) throw new Error(`Airtable ${res.status}`);
  const json = await res.json();
  return json.records as AirtableRecord[];
}

// ─── PROYECTOS CONFIG ────────────────────────────────────────
// Los base IDs van en .env — agrega las variables cuando las tengas
const PROJECTS = [
  {
    id: "guanago",
    name: "GuanaGO",
    icon: "🌊",
    color: "#06b6d4",
    url: "guanago.travel",
    status: "produccion",
    base: import.meta.env.VITE_AIRTABLE_BASE_ID || "appiReH55Qhrbv4Lk",
    tables: {
      reservas:     "Reservas",
      socios:       "Leads",
      servicios:    "ServiciosTuristicos_SAI",
      tareas:       "Tareas_To_do",
    },
    mindmap: [
      { id: "ops",     label: "Operaciones",     color: "#059669", children: ["Reservas", "Aprobaciones", "Cotizaciones"] },
      { id: "socios",  label: "Socios & Users",  color: "#0891b2", children: ["Socios", "Usuarios", "Finanzas"] },
      { id: "cultura", label: "Contenido",        color: "#d97706", children: ["Servicios", "Caribbean", "Artistas"] },
      { id: "cerebro", label: "Cerebro",          color: "#7c3aed", children: ["Notas", "Oportunidades", "Contexto IA"] },
      { id: "torre",   label: "Torre de Control", color: "#0ea5e9", children: ["Tareas", "Backend", "Estructura"] },
    ],
  },
  {
    id: "guiasai",
    name: "GuiaSAI",
    icon: "✈️",
    color: "#8b5cf6",
    url: "guiasai.com",
    status: "produccion",
    base: import.meta.env.VITE_AT_BASE_GUIASAI || "",
    tables: {
      agencias:    "Agencias",
      operadores:  "Operadores",
      tareas:      "Tareas",
    },
    mindmap: [
      { id: "b2b",    label: "Portal B2B",  color: "#7c3aed", children: ["Agencias", "Operadores"] },
      { id: "crm",    label: "CRM",         color: "#6d28d9", children: ["Leads", "Seguimientos"] },
      { id: "tareas", label: "Desarrollo",  color: "#4c1d95", children: ["Tareas", "Roadmap"] },
    ],
  },
  {
    id: "trade",
    name: "Trade",
    icon: "📈",
    color: "#f59e0b",
    url: "",
    status: "produccion",
    base: import.meta.env.VITE_AT_BASE_TRADE || "",
    tables: {
      operaciones: "Operaciones",
      señales:     "Señales",
      resumen:     "Resumen",
    },
    mindmap: [
      { id: "signals", label: "Señales",     color: "#b45309", children: ["Señales", "Alertas"] },
      { id: "ops",     label: "Operaciones", color: "#d97706", children: ["Operaciones", "Historial"] },
      { id: "stats",   label: "Stats",       color: "#f59e0b", children: ["Resumen", "PnL"] },
    ],
  },
  {
    id: "iglesia",
    name: "IglesiaTAFE",
    icon: "⛪",
    color: "#10b981",
    url: "",
    status: "desarrollo",
    base: import.meta.env.VITE_AT_BASE_IGLESIA || "",
    tables: {
      tareas:   "Tareas",
      sprints:  "Sprints",
      equipo:   "Equipo",
    },
    mindmap: [
      { id: "sprints", label: "Sprints",   color: "#047857", children: ["Sprints", "Tareas"] },
      { id: "equipo",  label: "Equipo",    color: "#059669", children: ["Equipo", "Roles"] },
      { id: "media",   label: "Contenido", color: "#10b981", children: ["Posts", "Transmisiones"] },
    ],
  },
  {
    id: "agua",
    name: "Agua App",
    icon: "💧",
    color: "#3b82f6",
    url: "",
    status: "desarrollo",
    base: import.meta.env.VITE_AT_BASE_AGUA || "",
    tables: {
      pedidos:     "Pedidos",
      conductores: "Conductores",
      rutas:       "Rutas",
    },
    mindmap: [
      { id: "despacho", label: "Despacho",     color: "#1d4ed8", children: ["Pedidos", "Rutas"] },
      { id: "drivers",  label: "Conductores",  color: "#2563eb", children: ["Conductores", "Zonas"] },
      { id: "clientes", label: "Clientes",     color: "#3b82f6", children: ["Clientes", "Historial"] },
    ],
  },
];

type Project = typeof PROJECTS[0];

// ─── PROPS ────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────
export default function AdminSkyPanel({ onBack }: Props) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌴</span>
            <div>
              <p className="text-sm font-bold text-white">SkyPanel</p>
              <p className="text-xs text-slate-500">sky@guanago.travel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Índice Maestro */}
          <button
            onClick={() => setActiveProject(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
              !activeProject ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard size={15} /> Índice Maestro
          </button>

          {PROJECTS.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left"
              style={
                activeProject?.id === p.id
                  ? { backgroundColor: `${p.color}33`, color: p.color }
                  : { color: "#94a3b8" }
              }
              onMouseEnter={e => {
                if (activeProject?.id !== p.id) {
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#1e293b";
                }
              }}
              onMouseLeave={e => {
                if (activeProject?.id !== p.id) {
                  (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "";
                }
              }}
            >
              <span>{p.icon}</span> {p.name}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-600">
            <RefreshCw size={11} />
            {lastRefresh.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button
            onClick={onBack}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={15} /> Volver al Admin
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {activeProject ? (
          <ProjectDetail
            project={activeProject}
            onBack={() => setActiveProject(null)}
          />
        ) : (
          <MasterIndex onRefresh={() => setLastRefresh(new Date())} onSelect={setActiveProject} />
        )}
      </main>
    </div>
  );
}

// ─── ÍNDICE MAESTRO ──────────────────────────────────────────
function MasterIndex({
  onRefresh,
  onSelect,
}: {
  onRefresh: () => void;
  onSelect: (p: Project) => void;
}) {
  const [stats, setStats] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const result: typeof stats = {};
    for (const proj of PROJECTS) {
      if (!proj.base) continue;
      result[proj.id] = {};
      for (const [key, table] of Object.entries(proj.tables)) {
        try {
          const recs = await fetchAirtable(proj.base, table, "?pageSize=10");
          result[proj.id][key] = recs.length;
        } catch {
          result[proj.id][key] = 0;
        }
      }
    }
    setStats(result);
    setLoading(false);
    onRefresh();
  }, [onRefresh]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const statusBadge: Record<string, string> = {
    produccion: "bg-emerald-900 text-emerald-400",
    desarrollo: "bg-amber-900 text-amber-400",
    variable:   "bg-slate-800 text-slate-400",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Índice Maestro</h1>
          <p className="text-slate-500 text-sm">Sky Stephens · San Andrés · datos en vivo desde Airtable</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PROJECTS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="block bg-slate-900 border rounded-xl p-5 hover:scale-[1.01] transition-all text-left group"
            style={{ borderColor: `${p.color}44` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <h3 className="font-semibold text-white text-sm">{p.name}</h3>
                  {p.url && (
                    <p className="text-xs font-mono text-slate-600">{p.url}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[p.status] || statusBadge.variable}`}>
                  {p.status === "produccion" ? "Producción" : p.status === "desarrollo" ? "Desarrollo" : "Variable"}
                </span>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {Object.keys(p.tables).slice(0, 4).map(key => (
                <div key={key} className="bg-slate-950 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-600 capitalize">{key}</p>
                  <p className="text-sm font-bold" style={{ color: p.color }}>
                    {loading ? "..." : (stats[p.id]?.[key] ?? "—")}
                  </p>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── DETALLE DE PROYECTO ─────────────────────────────────────
function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const [activeTable, setActiveTable] = useState(Object.keys(project.tables)[0]);
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"table" | "mindmap">("table");

  useEffect(() => {
    if (!project.base) { setRecords([]); return; }
    setLoading(true);
    const tableName = project.tables[activeTable as keyof typeof project.tables];
    fetchAirtable(project.base, tableName)
      .then(recs => setRecords(recs))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [activeTable, project]);

  const columns = records.length > 0 ? Object.keys(records[0].fields).slice(0, 7) : [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-3xl">{project.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            <p className="text-xs font-mono text-slate-600">
              {project.base ? project.base : "base no configurada — agrega VITE_AT_BASE_* en .env"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("table")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={view === "table" ? { backgroundColor: project.color, color: "#fff" } : { backgroundColor: "#1e293b", color: "#64748b" }}
          >
            Tabla
          </button>
          <button
            onClick={() => setView("mindmap")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            style={view === "mindmap" ? { backgroundColor: project.color, color: "#fff" } : { backgroundColor: "#1e293b", color: "#64748b" }}
          >
            <GitBranch size={12} /> Torre
          </button>
        </div>
      </div>

      {view === "table" ? (
        <>
          {/* Tabs de tablas */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {Object.keys(project.tables).map(key => (
              <button
                key={key}
                onClick={() => setActiveTable(key)}
                className="px-3 py-1.5 rounded-lg text-xs capitalize transition-colors"
                style={activeTable === key ? { backgroundColor: project.color, color: "#fff" } : { backgroundColor: "#1e293b", color: "#64748b" }}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Tabla de datos */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            {!project.base ? (
              <div className="p-8 text-center">
                <p className="text-slate-500 text-sm mb-1">Base no configurada</p>
                <p className="text-slate-700 text-xs font-mono">Agrega VITE_AT_BASE_{project.id.toUpperCase()} en .env</p>
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-slate-600 text-sm">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-slate-700" />
                Cargando desde Airtable...
              </div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-slate-600 text-sm">Sin registros en esta tabla</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {columns.map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs text-slate-500 uppercase font-medium whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(rec => (
                      <tr key={rec.id} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                        {columns.map(col => {
                          const val = rec.fields[col];
                          const display = Array.isArray(val)
                            ? val.join(", ")
                            : typeof val === "boolean"
                            ? (val ? "✓" : "—")
                            : val ?? "—";
                          return (
                            <td key={col} className="px-4 py-2.5 text-slate-300 whitespace-nowrap max-w-xs truncate">
                              {String(display)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2 text-xs text-slate-600 border-t border-slate-800 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {records.length} registros · Airtable live
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <MindMapView project={project} />
      )}
    </div>
  );
}

// ─── MAPA MENTAL / TORRE DE CONTROL ──────────────────────────
function MindMapView({ project }: { project: Project }) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch size={16} style={{ color: project.color }} />
        <h2 className="text-sm font-semibold text-white">Torre de Control — {project.name}</h2>
      </div>

      {/* Nodo central */}
      <div className="flex flex-col items-center">
        <div
          className="px-5 py-3 rounded-xl text-white text-sm font-bold mb-8 shadow-lg"
          style={{ backgroundColor: project.color }}
        >
          {project.icon} {project.name}
          {project.url && <span className="ml-2 text-xs opacity-70">· {project.url}</span>}
        </div>

        {/* Secciones del mapa mental */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {project.mindmap.map(section => (
            <div
              key={section.id}
              className="rounded-xl border p-4"
              style={{ borderColor: `${section.color}55`, backgroundColor: `${section.color}11` }}
            >
              <h3 className="text-xs font-bold mb-3" style={{ color: section.color }}>
                {section.label}
              </h3>
              <div className="space-y-1.5">
                {section.children.map(child => (
                  <div
                    key={child}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-950 text-slate-400 text-xs"
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }} />
                    {child}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
