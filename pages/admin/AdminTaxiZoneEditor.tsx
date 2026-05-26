/**
 * AdminTaxiZoneEditor
 * Herramienta interna para trazar polígonos GPS de las 5 zonas de taxi de San Andrés.
 * Clic en el mapa → agrega punto. Exporta el bloque ZONE_POLYGONS listo para
 * pegar en TaxiZonesMapbox.tsx.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, Copy, Check, Trash2, CornerDownLeft, Map, Save, Loader2, Upload } from 'lucide-react';
import { AppRoute } from '../../types';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY || '';

interface Props {
  onBack: () => void;
  onNavigate?: (route: AppRoute) => void;
}

type ZoneId = 'z1' | 'z2' | 'z3' | 'z4' | 'z5';
type Point = [number, number]; // [lng, lat]

const ZONES_META: Record<ZoneId, { name: string; hint: string; color: string; hex: string; center: [number, number] }> = {
  z1: { name: 'Z1 – Centro / North End', hint: 'Aeropuerto, Centro, Spratt Bight, El Cliff, Peatonal', color: 'bg-yellow-400', hex: '#FACC15', center: [-81.700, 12.585] },
  z2: { name: 'Z2 – San Luis',           hint: 'San Luis, Sound Bay, Rocky Cay, Bahía Sonora',          color: 'bg-green-500',  hex: '#22C55E', center: [-81.681, 12.548] },
  z3: { name: 'Z3 – La Loma / El Cove',  hint: 'La Loma, El Cove, Orange Hill, Brooks Hill',            color: 'bg-pink-500',   hex: '#EC4899', center: [-81.715, 12.547] },
  z4: { name: 'Z4 – Sur / Punta Sur',    hint: 'Punta Sur, Tom Hooker, El Acuario, South End',          color: 'bg-blue-400',   hex: '#60A5FA', center: [-81.701, 12.508] },
  z5: { name: 'Z5 – West View / Cove',   hint: 'West View, Cueva de Morgan, Big Pond',                  color: 'bg-red-500',    hex: '#EF4444', center: [-81.737, 12.538] },
};

const ZONE_IDS: ZoneId[] = ['z1', 'z2', 'z3', 'z4', 'z5'];

const emptyPoints = (): Record<ZoneId, Point[]> => ({ z1: [], z2: [], z3: [], z4: [], z5: [] });
const emptyMarkers = (): Record<ZoneId, mapboxgl.Marker[]> => ({ z1: [], z2: [], z3: [], z4: [], z5: [] });

const AdminTaxiZoneEditor: React.FC<Props> = ({ onBack }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapLoaded = useRef(false);
  const markersRef = useRef<Record<ZoneId, mapboxgl.Marker[]>>(emptyMarkers());

  const [activeZone, setActiveZone] = useState<ZoneId>('z1');
  const [zonePoints, setZonePoints] = useState<Record<ZoneId, Point[]>>(emptyPoints());
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<Record<ZoneId, number> | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Cargando zonas guardadas…');
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  // Refs para acceder a valores actuales en callbacks del mapa
  const activeZoneRef = useRef<ZoneId>('z1');
  const zonePointsRef = useRef<Record<ZoneId, Point[]>>(emptyPoints());

  activeZoneRef.current = activeZone;
  zonePointsRef.current = zonePoints;

  // ── Inicializar mapa ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-81.705, 12.535],
      zoom: 11.8,
      attributionControl: false,
      dragRotate: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      // Forzar recálculo de dimensiones — Mapbox a veces inicializa con altura
      // incorrecta cuando el contenedor usa flexbox con h-full
      map.resize();
      requestAnimationFrame(() => map.resize());

      ZONE_IDS.forEach(zid => {
        map.addSource(`poly-${zid}`, { type: 'geojson', data: geoEmpty() });
        map.addLayer({ id: `fill-${zid}`, type: 'fill', source: `poly-${zid}`,
          paint: { 'fill-color': ZONES_META[zid].hex, 'fill-opacity': 0.3 } });
        map.addLayer({ id: `line-${zid}`, type: 'line', source: `poly-${zid}`,
          paint: { 'line-color': ZONES_META[zid].hex, 'line-width': 2 } });
      });
      mapLoaded.current = true;

      // ── Cargar zonas guardadas del servidor ─────────────────────────────────
      fetch(`${API_BASE}/api/taxi-zones`)
        .then(r => r.json())
        .then(data => {
          if (!data.success || !data.data?.zones) {
            setStatusMsg('Listo — no hay zonas guardadas, haz clic para trazar');
            return;
          }
          const loaded = data.data.zones as Record<ZoneId, Point[]>;
          setZonePoints(loaded);
          zonePointsRef.current = loaded;
          ZONE_IDS.forEach(zid => {
            const pts = loaded[zid] || [];
            if (pts.length >= 2) {
              const src = map.getSource(`poly-${zid}`) as mapboxgl.GeoJSONSource;
              src?.setData({
                type: 'Feature', properties: {},
                geometry: { type: 'Polygon', coordinates: [[...pts, pts[0]]] },
              });
            }
            pts.forEach(([lng, lat], i) => addMarkerForPoint(zid, lng, lat, i + 1));
          });
          const total = ZONE_IDS.reduce((s, z) => s + (loaded[z]?.length || 0), 0);
          setStatusMsg(`✓ ${total} puntos restaurados del servidor`);
        })
        .catch(() => setStatusMsg('Listo — haz clic en el mapa para trazar'));
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      const zid = activeZoneRef.current;
      addPointToZone(zid, lng, lat);
    });

    map.on('dblclick', (e) => {
      e.preventDefault();
      closeCurrentPolygon();
    });

    mapRef.current = map;

    // ResizeObserver: mantiene el mapa sincronizado con el contenedor
    const observer = new ResizeObserver(() => map.resize());
    if (mapContainerRef.current) observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      mapLoaded.current = false;
    };
  }, []);

  // ── Agregar punto ─────────────────────────────────────────────────────────
  const addPointToZone = useCallback((zid: ZoneId, lng: number, lat: number) => {
    setZonePoints(prev => {
      const updated = { ...prev, [zid]: [...prev[zid], [lng, lat] as Point] };
      // Actualizar polígono en el mapa
      redrawPolygon(zid, updated[zid]);
      // Agregar marcador
      addMarkerForPoint(zid, lng, lat, updated[zid].length);
      setStatusMsg(`Z${zid[1]} — ${updated[zid].length} punto(s)`);
      return updated;
    });
  }, []);

  function addMarkerForPoint(zid: ZoneId, lng: number, lat: number, n: number) {
    if (!mapRef.current) return;
    const el = document.createElement('div');
    el.style.cssText = `
      width:20px;height:20px;border-radius:50%;
      background:${ZONES_META[zid].hex};border:2px solid white;
      display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:800;color:#000;
      box-shadow:0 1px 4px rgba(0,0,0,.5);cursor:pointer;
    `;
    el.textContent = String(n);
    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
    markersRef.current[zid].push(marker);
  }

  function redrawPolygon(zid: ZoneId, pts: Point[]) {
    if (!mapRef.current || !mapLoaded.current) return;
    const source = mapRef.current.getSource(`poly-${zid}`) as mapboxgl.GeoJSONSource;
    if (!source) return;
    if (pts.length < 2) { source.setData(geoEmpty()); return; }
    source.setData({
      type: 'Feature', properties: {},
      geometry: { type: 'Polygon', coordinates: [[...pts, pts[0]]] }
    });
  }

  // ── Cerrar polígono (Enter / botón) ───────────────────────────────────────
  const closeCurrentPolygon = useCallback(() => {
    const pts = zonePointsRef.current[activeZoneRef.current];
    if (pts.length < 3) { setStatusMsg('Necesitas al menos 3 puntos'); return; }
    redrawPolygon(activeZoneRef.current, pts);
    setStatusMsg(`✓ Z${activeZoneRef.current[1]} cerrado — ${pts.length} puntos`);
  }, []);

  // ── Eliminar último punto (Ctrl+Z / Backspace) ────────────────────────────
  const undoLastPoint = useCallback(() => {
    const zid = activeZoneRef.current;
    setZonePoints(prev => {
      if (prev[zid].length === 0) return prev;
      const updated = { ...prev, [zid]: prev[zid].slice(0, -1) };
      // Quitar marcador
      const last = markersRef.current[zid].pop();
      last?.remove();
      redrawPolygon(zid, updated[zid]);
      setStatusMsg(`Z${zid[1]} — ${updated[zid].length} punto(s)`);
      return updated;
    });
  }, []);

  // ── Limpiar zona ──────────────────────────────────────────────────────────
  const clearZone = useCallback((zid: ZoneId) => {
    markersRef.current[zid].forEach(m => m.remove());
    markersRef.current[zid] = [];
    setZonePoints(prev => {
      const updated = { ...prev, [zid]: [] };
      redrawPolygon(zid, []);
      return updated;
    });
    setStatusMsg(`Z${zid[1]} limpiada`);
  }, []);

  // ── Cambiar zona activa ───────────────────────────────────────────────────
  const switchZone = useCallback((zid: ZoneId) => {
    setActiveZone(zid);
    setStatusMsg(`Editando ${ZONES_META[zid].name}`);
    mapRef.current?.flyTo({ center: ZONES_META[zid].center, zoom: 12.5, duration: 600 });
  }, []);

  // ── Teclado ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'Enter') closeCurrentPolygon();
      if (e.key === 'Backspace' || (e.key === 'z' && e.ctrlKey)) { e.preventDefault(); undoLastPoint(); }
      if (e.key >= '1' && e.key <= '5') switchZone(`z${e.key}` as ZoneId);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCurrentPolygon, undoLastPoint, switchZone]);

  // ── Parser de código TSX exportado ───────────────────────────────────────
  function parseTsxCode(code: string): { zones: Record<ZoneId, Point[]>; errors: string[] } {
    const zones = emptyPoints();
    const errors: string[] = [];

    for (const zid of ZONE_IDS) {
      // Buscar el bloque de la zona (ej: "  z1:")
      const zoneStart = code.indexOf(`  ${zid}:`);
      if (zoneStart === -1) { errors.push(`${zid.toUpperCase()}: bloque no encontrado`); continue; }

      // Buscar "coordinates: [[" dentro del bloque
      const coordTag = code.indexOf('coordinates: [[', zoneStart);
      if (coordTag === -1) { errors.push(`${zid.toUpperCase()}: sin coordenadas`); continue; }

      // Extraer el contenido entre [[ y ]]
      const innerStart = code.indexOf('[[', coordTag) + 2;
      const innerEnd   = code.indexOf(']]', innerStart);
      if (innerEnd === -1) { errors.push(`${zid.toUpperCase()}: formato mal cerrado`); continue; }

      const block = code.slice(innerStart, innerEnd);

      // Extraer todos los pares [lng, lat]
      const re = /\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/g;
      const points: Point[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(block)) !== null) {
        points.push([parseFloat(m[1]), parseFloat(m[2])]);
      }

      if (points.length < 3) {
        if (points.length > 0) errors.push(`${zid.toUpperCase()}: solo ${points.length} punto(s) — necesita ≥3`);
        continue;
      }

      // Eliminar punto de cierre (último = primero) si existe
      const first = points[0];
      const last  = points[points.length - 1];
      const isDupe = Math.abs(last[0] - first[0]) < 0.000001 && Math.abs(last[1] - first[1]) < 0.000001;
      zones[zid] = isDupe ? points.slice(0, -1) : points;
    }

    return { zones, errors };
  }

  // ── Cargar zonas importadas en el mapa ────────────────────────────────────
  const loadImportedZones = useCallback((newPoints: Record<ZoneId, Point[]>) => {
    // Limpiar todos los marcadores actuales
    ZONE_IDS.forEach(zid => {
      markersRef.current[zid].forEach(m => m.remove());
      markersRef.current[zid] = [];
    });

    // Actualizar estado y ref
    setZonePoints(newPoints);
    zonePointsRef.current = newPoints;

    // Redibujar polígonos y marcadores
    ZONE_IDS.forEach(zid => {
      const pts = newPoints[zid];
      redrawPolygon(zid, pts);
      pts.forEach(([lng, lat], i) => addMarkerForPoint(zid, lng, lat, i + 1));
    });

    const total = ZONE_IDS.reduce((s, z) => s + newPoints[z].length, 0);
    setStatusMsg(`✓ ${total} puntos importados correctamente`);
    setShowImport(false);
    setImportText('');
    setImportErrors([]);
    setImportPreview(null);
  }, []);

  // ── Previsualizar mientras el usuario pega ────────────────────────────────
  const handleImportChange = (code: string) => {
    setImportText(code);
    if (!code.trim()) { setImportPreview(null); setImportErrors([]); return; }
    const { zones, errors } = parseTsxCode(code);
    setImportErrors(errors);
    const preview = {} as Record<ZoneId, number>;
    ZONE_IDS.forEach(zid => { preview[zid] = zones[zid]?.length ?? 0; });
    setImportPreview(preview);
  };

  const handleImportConfirm = () => {
    const { zones, errors } = parseTsxCode(importText);
    const hasAny = ZONE_IDS.some(z => (zones[z]?.length ?? 0) >= 3);
    if (!hasAny) {
      setImportErrors([...errors, '⚠️ No se encontró ninguna zona válida (mínimo 3 puntos)']);
      return;
    }
    loadImportedZones(zones);
  };

  // ── Generar código ────────────────────────────────────────────────────────
  const generateCode = (): string => {
    const pts = zonePoints;
    const lines: string[] = [
      `// GuanaGO — Zonas de Taxi San Andrés — generado ${new Date().toLocaleString('es-CO')}`,
      `const ZONE_POLYGONS: Record<string, { coordinates: number[][][]; center: [number, number]; color: string }> = {`,
    ];
    ZONE_IDS.forEach((zid, i) => {
      const p = pts[zid];
      const meta = ZONES_META[zid];
      const comma = i < ZONE_IDS.length - 1 ? ',' : '';
      if (p.length < 3) {
        lines.push(`  // ⚠️ ${zid}: sin suficientes puntos (${p.length})`);
        lines.push(`  ${zid}: { coordinates: [[]], center: [${meta.center[0]}, ${meta.center[1]}], color: '${meta.hex}' }${comma}`);
        return;
      }
      const cx = (p.reduce((s, q) => s + q[0], 0) / p.length).toFixed(6);
      const cy = (p.reduce((s, q) => s + q[1], 0) / p.length).toFixed(6);
      lines.push(`  ${zid}: {`);
      lines.push(`    // ${meta.name}`);
      lines.push(`    coordinates: [[`);
      p.forEach(([lng, lat]) => lines.push(`      [${lng.toFixed(6)}, ${lat.toFixed(6)}],`));
      lines.push(`      [${p[0][0].toFixed(6)}, ${p[0][1].toFixed(6)}],  // cierre`);
      lines.push(`    ]],`);
      lines.push(`    center: [${cx}, ${cy}],`);
      lines.push(`    color: '${meta.hex}',`);
      lines.push(`  }${comma}`);
    });
    lines.push('};');
    return lines.join('\n');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Guardar zonas en Firestore → el mapa público las leerá en tiempo real ──
  const saveToBackend = async () => {
    const hasPoints = ZONE_IDS.some(z => zonePoints[z].length >= 3);
    if (!hasPoints) {
      setStatusMsg('⚠️ Necesitas al menos 3 puntos en alguna zona');
      return;
    }
    setSaving(true);
    setSaveOk(false);
    try {
      const res = await fetch(`${API_BASE}/api/taxi-zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones: zonePoints }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveOk(true);
        setStatusMsg('✅ Zonas guardadas y publicadas en el mapa de taxi');
        setTimeout(() => setSaveOk(false), 3000);
      } else {
        setStatusMsg('❌ Error al guardar: ' + data.error);
      }
    } catch {
      setStatusMsg('❌ Error de conexión al guardar');
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = ZONE_IDS.reduce((s, z) => s + zonePoints[z].length, 0);
  const activePts = zonePoints[activeZone];

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="w-px h-4 bg-gray-700" />
        <Map size={15} className="text-teal-400" />
        <span className="font-semibold text-sm">Editor de Zonas de Taxi</span>
        <span className="text-gray-600 text-xs">— San Andrés</span>
        <div className="flex-1" />
        <span className="text-xs text-gray-600">{totalPoints} pts totales</span>
        <button
          onClick={saveToBackend}
          disabled={saving}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            saveOk
              ? 'bg-green-900 text-green-300 border border-green-700'
              : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border border-emerald-600 disabled:opacity-50'
          }`}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saveOk ? <Check size={12} /> : <Save size={12} />}
          {saving ? 'Guardando…' : saveOk ? '¡Publicado!' : 'Guardar y publicar'}
        </button>
        <button
          onClick={() => { setShowImport(true); setImportText(''); setImportErrors([]); setImportPreview(null); }}
          className="bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Upload size={12} /> Importar TSX
        </button>
        <button
          onClick={() => setShowExport(true)}
          className="bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          Exportar TSX
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Mapa */}
        <div className="relative flex-1">
          <div ref={mapContainerRef} className="w-full h-full" style={{ cursor: 'crosshair' }} />
          {/* Instrucción flotante */}
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 bg-black/80 text-gray-300 text-xs px-4 py-1.5 rounded-full border border-gray-700 pointer-events-none whitespace-nowrap">
            Clic para agregar punto · Doble clic o Enter para cerrar polígono · Ctrl+Z para deshacer · 1–5 cambia zona
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden shrink-0">

          {/* Tabs de zona */}
          <div className="flex border-b border-gray-800 shrink-0">
            {ZONE_IDS.map(zid => (
              <button
                key={zid}
                onClick={() => switchZone(zid)}
                className={`flex-1 py-2 text-[10px] font-bold tracking-wider uppercase transition-all border-b-2 ${
                  activeZone === zid
                    ? 'text-white'
                    : 'text-gray-600 border-transparent hover:text-gray-400'
                }`}
                style={activeZone === zid ? { color: ZONES_META[zid].hex, borderBottomColor: ZONES_META[zid].hex } : {}}
              >
                {zid.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Info zona activa */}
          <div className="px-3 py-2.5 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ZONES_META[activeZone].hex }} />
              <span className="text-xs font-semibold text-white">{ZONES_META[activeZone].name}</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed pl-4">{ZONES_META[activeZone].hint}</p>
          </div>

          {/* Conteo y lista de puntos */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 shrink-0">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Puntos GPS</span>
            <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{activePts.length} pts</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activePts.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-gray-600">
                Sin puntos aún.<br />Haz clic en el mapa.
              </div>
            ) : (
              activePts.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono text-gray-500 hover:bg-gray-800 group">
                  <span className="text-gray-700 w-4 shrink-0">{i + 1}</span>
                  <span className="flex-1">{p[0].toFixed(4)}, {p[1].toFixed(4)}</span>
                  <button
                    onClick={() => {
                      // Eliminar punto i
                      setZonePoints(prev => {
                        const newPts = prev[activeZone].filter((_, idx) => idx !== i);
                        markersRef.current[activeZone].forEach(m => m.remove());
                        markersRef.current[activeZone] = [];
                        // Re-agregar todos los marcadores restantes
                        newPts.forEach(([lng, lat], ni) => addMarkerForPoint(activeZone, lng, lat, ni + 1));
                        redrawPolygon(activeZone, newPts);
                        return { ...prev, [activeZone]: newPts };
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Acciones */}
          <div className="p-2.5 border-t border-gray-800 flex flex-col gap-2 shrink-0">

            {/* ★ Guardar y publicar */}
            <button
              onClick={saveToBackend}
              disabled={saving}
              className={`w-full text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                saveOk
                  ? 'bg-green-900 text-green-300 border border-green-700'
                  : 'bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border border-emerald-600 disabled:opacity-50'
              }`}
            >
              {saving
                ? <><Loader2 size={12} className="animate-spin" /> Guardando…</>
                : saveOk
                  ? <><Check size={12} /> ¡Publicado!</>
                  : <><Save size={12} /> Guardar y publicar</>
              }
            </button>

            <button
              onClick={closeCurrentPolygon}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CornerDownLeft size={12} /> Cerrar polígono
            </button>
            <button
              onClick={undoLastPoint}
              className="w-full bg-transparent hover:bg-gray-800 text-gray-500 border border-gray-800 text-xs font-semibold py-1.5 rounded-lg transition-colors"
            >
              ↩ Deshacer último punto
            </button>
            <button
              onClick={() => clearZone(activeZone)}
              className="w-full bg-transparent hover:bg-red-950 text-gray-600 hover:text-red-400 border border-gray-800 hover:border-red-900 text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 size={11} /> Limpiar {activeZone.toUpperCase()}
            </button>
          </div>

          {/* Status bar */}
          <div className="px-3 py-1.5 border-t border-gray-800 text-[10px] text-gray-600 shrink-0">
            {statusMsg}
          </div>
        </div>
      </div>

      {/* Modal de importación */}
      {showImport && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowImport(false); }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Upload size={14} className="text-teal-400" />
                <h2 className="text-sm font-bold text-white">Importar código TSX</h2>
              </div>
              <button onClick={() => setShowImport(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>

            {/* Instrucción */}
            <div className="px-4 py-2.5 bg-gray-800/50 border-b border-gray-800">
              <p className="text-[11px] text-gray-400">
                Pega el bloque <code className="text-teal-400">ZONE_POLYGONS = &#123;…&#125;</code> exportado previamente.
                Los puntos se cargarán en el mapa y podrás seguir editando.
              </p>
            </div>

            {/* Textarea */}
            <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3">
              <textarea
                value={importText}
                onChange={e => handleImportChange(e.target.value)}
                placeholder={`// GuanaGO — Zonas de Taxi San Andrés — generado …\nconst ZONE_POLYGONS: Record<…> = {\n  z1: {\n    coordinates: [[\n      [-81.707538, 12.574111],\n      …\n    ]],\n    …\n  },\n  …\n};`}
                className="flex-1 min-h-[260px] bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 font-mono text-[10px] text-green-300 placeholder-gray-700 resize-none focus:outline-none focus:border-teal-600"
                spellCheck={false}
              />

              {/* Preview por zona */}
              {importPreview && (
                <div className="flex gap-2 flex-wrap">
                  {ZONE_IDS.map(zid => {
                    const pts = importPreview[zid];
                    const ok  = pts >= 3;
                    return (
                      <div
                        key={zid}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          ok
                            ? 'bg-green-950 border-green-800 text-green-400'
                            : pts > 0
                              ? 'bg-yellow-950 border-yellow-800 text-yellow-500'
                              : 'bg-gray-800 border-gray-700 text-gray-600'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ background: ZONES_META[zid].hex }} />
                        {zid.toUpperCase()}
                        <span className="opacity-70">{pts > 0 ? `${pts} pts` : 'vacío'}</span>
                        {ok ? '✓' : pts > 0 ? '⚠' : ''}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Errores */}
              {importErrors.length > 0 && (
                <div className="bg-red-950/50 border border-red-800/50 rounded-lg px-3 py-2">
                  {importErrors.map((e, i) => (
                    <p key={i} className="text-[10px] text-red-400 font-mono">{e}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-gray-800">
              <button
                onClick={handleImportConfirm}
                disabled={!importText.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-teal-900 text-teal-300 border border-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Upload size={12} /> Cargar en el mapa
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <div className="flex-1 flex items-center">
                <p className="text-[10px] text-gray-600">
                  Esto reemplazará los puntos actuales en el mapa
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de exportación */}
      {showExport && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowExport(false); }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-bold text-white">Código listo para TaxiZonesMapbox.tsx</h2>
              <button onClick={() => setShowExport(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="font-mono text-[10px] text-green-300 leading-relaxed whitespace-pre-wrap break-all">
                {generateCode()}
              </pre>
            </div>
            <div className="flex gap-2 px-4 py-3 border-t border-gray-800">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  copied
                    ? 'bg-green-900 text-green-300 border border-green-700'
                    : 'bg-teal-900 text-teal-300 border border-teal-700 hover:bg-teal-800'
                }`}
              >
                {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar código</>}
              </button>
              <button
                onClick={() => setShowExport(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
              <div className="flex-1 flex items-center">
                <p className="text-[10px] text-gray-600">
                  Pega el bloque <code className="text-teal-500">ZONE_POLYGONS</code> en{' '}
                  <code className="text-gray-400">components/TaxiZonesMapbox.tsx</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function geoEmpty(): GeoJSON.Feature {
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[]] } };
}

export default AdminTaxiZoneEditor;
