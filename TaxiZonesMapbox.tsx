/**
 * TaxiZonesMapbox - Mapa interactivo de zonas de taxi con Mapbox
 * Usa satellite-streets para mostrar la isla real de San Andrés
 * con polígonos de colores encima de cada zona.
 * Drop-in replacement de SanAndresMap en Taxi.tsx
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TAXI_ZONES } from '../constants';

// Token se configura en .env como VITE_MAPBOX_API_KEY
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY || '';
const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

mapboxgl.accessToken = MAPBOX_TOKEN;

// Tipo de zona para uso interno
type ZonePolygon = { coordinates: number[][][]; center: [number, number] };

/** Convierte los puntos crudos del editor → formato GeoJSON listo para Mapbox */
function pointsToPolygon(pts: number[][]): ZonePolygon | null {
  if (!pts || pts.length < 3) return null;
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return {
    coordinates: [[...pts, pts[0]]],   // GeoJSON polygon cierra el anillo
    center: [cx, cy] as [number, number],
  };
}

interface TaxiZonesMapboxProps {
  selectedZoneId: string;
  onSelectZone: (id: string) => void;
}

const SAN_ANDRES_CENTER: [number, number] = [-81.7050, 12.5300];
const DEFAULT_ZOOM = 11.2;

// Colores hex que corresponden a los colores Tailwind de TAXI_ZONES
const ZONE_HEX: Record<string, string> = {
  z1: '#FACC15', // yellow-400
  z2: '#22C55E', // green-500
  z3: '#EC4899', // pink-500
  z4: '#60A5FA', // blue-400
  z5: '#EF4444', // red-500
};

// Polígonos GeoJSON realistas de San Andrés por zona
// Coordenadas: [lng, lat]
// GuanaGO — Zonas de Taxi San Andrés — generado 24/5/2026, 10:45:37 p. m.
const ZONE_POLYGONS: Record<string, { coordinates: number[][][]; center: [number, number]; color: string }> = {
  z1: {
    // Z1 – Centro / North End
    coordinates: [[
      [-81.707538, 12.574111],
      [-81.705253, 12.573238],
      [-81.703432, 12.574822],
      [-81.700750, 12.576502],
      [-81.698432, 12.578215],
      [-81.695418, 12.580349],
      [-81.691312, 12.580236],
      [-81.688563, 12.580203],
      [-81.687239, 12.581431],
      [-81.688630, 12.582627],
      [-81.691312, 12.583629],
      [-81.693988, 12.585401],
      [-81.697287, 12.586243],
      [-81.700060, 12.588837],
      [-81.700559, 12.590796],
      [-81.702473, 12.591729],
      [-81.704227, 12.593208],
      [-81.706978, 12.593597],
      [-81.709888, 12.591729],
      [-81.712360, 12.589045],
      [-81.714951, 12.585971],
      [-81.720537, 12.580745],
      [-81.721925, 12.579078],
      [-81.722193, 12.576016],
      [-81.707538, 12.574111],  // cierre
    ]],
    center: [-81.702721, 12.583240],
    color: '#FACC15',
  },
  z2: {
    // Z2 – San Luis
    coordinates: [[
      [-81.709074, 12.536811],
      [-81.707741, 12.536514],
      [-81.707665, 12.538483],
      [-81.707824, 12.540653],
      [-81.706673, 12.541983],
      [-81.705500, 12.542772],
      [-81.703909, 12.543485],
      [-81.703486, 12.544278],
      [-81.703809, 12.546790],
      [-81.704326, 12.549477],
      [-81.704278, 12.552607],
      [-81.703869, 12.555094],
      [-81.704231, 12.556976],
      [-81.704231, 12.559564],
      [-81.703468, 12.561995],
      [-81.702222, 12.564251],
      [-81.701660, 12.566525],
      [-81.702263, 12.568055],
      [-81.700214, 12.570760],
      [-81.701419, 12.572995],
      [-81.703468, 12.574014],
      [-81.705095, 12.573035],
      [-81.707517, 12.573748],
      [-81.710889, 12.574098],
      [-81.711129, 12.569291],
      [-81.712668, 12.562526],
      [-81.713887, 12.552136],
      [-81.712697, 12.541160],
      [-81.712185, 12.538774],
      [-81.711259, 12.537741],
      [-81.709074, 12.536811],  // cierre
    ]],
    center: [-81.706289, 12.554886],
    color: '#22C55E',
  },
  z3: {
    // Z3 – La Loma / El Cove
    coordinates: [[
      [-81.727095, 12.527034],
      [-81.728175, 12.526140],
      [-81.730265, 12.526416],
      [-81.731627, 12.527264],
      [-81.733599, 12.528158],
      [-81.735079, 12.529717],
      [-81.735642, 12.530565],
      [-81.735266, 12.531734],
      [-81.734515, 12.533659],
      [-81.733576, 12.535562],
      [-81.733012, 12.537831],
      [-81.732472, 12.539688],
      [-81.732261, 12.541247],
      [-81.731403, 12.543218],
      [-81.730793, 12.545166],
      [-81.730205, 12.546316],
      [-81.729406, 12.547347],
      [-81.729782, 12.548195],
      [-81.730815, 12.549273],
      [-81.731379, 12.551450],
      [-81.731895, 12.553353],
      [-81.732224, 12.554659],
      [-81.731989, 12.555737],
      [-81.731167, 12.557616],
      [-81.729970, 12.559358],
      [-81.729125, 12.560275],
      [-81.727997, 12.561352],
      [-81.727035, 12.562681],
      [-81.726099, 12.563922],
      [-81.724714, 12.565205],
      [-81.723775, 12.566282],
      [-81.722859, 12.567062],
      [-81.723094, 12.568483],
      [-81.723023, 12.569927],
      [-81.722577, 12.571325],
      [-81.722178, 12.572516],
      [-81.722436, 12.573525],
      [-81.722413, 12.574740],
      [-81.722174, 12.575822],
      [-81.711352, 12.574202],
      [-81.711466, 12.569332],
      [-81.714110, 12.559797],
      [-81.714685, 12.550396],
      [-81.713445, 12.540018],
      [-81.727095, 12.527034],  // cierre
    ]],
    center: [-81.727231, 12.551672],
    color: '#EC4899',
  },
  z4: {
    // Z4 – Sur / Punta Sur
    coordinates: [[
      [-81.729849, 12.480429],
      [-81.728952, 12.480562],
      [-81.727919, 12.480975],
      [-81.727258, 12.481752],
      [-81.726683, 12.482513],
      [-81.726259, 12.483389],
      [-81.725836, 12.484265],
      [-81.725511, 12.485245],
      [-81.724868, 12.486154],
      [-81.724309, 12.486914],
      [-81.723835, 12.487807],
      [-81.723293, 12.488485],
      [-81.722717, 12.489774],
      [-81.722209, 12.491031],
      [-81.721633, 12.492122],
      [-81.721007, 12.492882],
      [-81.720798, 12.493915],
      [-81.720662, 12.494824],
      [-81.720103, 12.495668],
      [-81.719528, 12.496775],
      [-81.718766, 12.497569],
      [-81.718427, 12.498527],
      [-81.717835, 12.499453],
      [-81.717445, 12.500065],
      [-81.717732, 12.501160],
      [-81.717478, 12.502135],
      [-81.716953, 12.502796],
      [-81.716411, 12.503606],
      [-81.715903, 12.504433],
      [-81.715581, 12.505425],
      [-81.715734, 12.506417],
      [-81.715852, 12.507194],
      [-81.715446, 12.508114],
      [-81.715107, 12.509172],
      [-81.714921, 12.510246],
      [-81.714836, 12.511221],
      [-81.714803, 12.512487],
      [-81.714668, 12.513793],
      [-81.714380, 12.515149],
      [-81.714157, 12.516693],
      [-81.714151, 12.517869],
      [-81.713813, 12.518745],
      [-81.713609, 12.519621],
      [-81.713660, 12.520596],
      [-81.713711, 12.521406],
      [-81.713491, 12.522216],
      [-81.713254, 12.523191],
      [-81.712695, 12.524332],
      [-81.711476, 12.525076],
      [-81.711019, 12.525852],
      [-81.710121, 12.526431],
      [-81.709478, 12.527208],
      [-81.708885, 12.528051],
      [-81.708052, 12.529265],
      [-81.707510, 12.530190],
      [-81.706951, 12.531182],
      [-81.706562, 12.532256],
      [-81.706951, 12.532901],
      [-81.707476, 12.533298],
      [-81.707392, 12.534190],
      [-81.707612, 12.535298],
      [-81.707713, 12.536276],
      [-81.709123, 12.536593],
      [-81.710780, 12.537017],
      [-81.712367, 12.537319],
      [-81.713148, 12.538484],
      [-81.720055, 12.530959],
      [-81.719326, 12.521880],
      [-81.721141, 12.506131],
      [-81.727419, 12.488238],
      [-81.729849, 12.480429],  // cierre
    ]],
    center: [-81.716637, 12.509617],
    color: '#60A5FA',
  },
  z5: {
    // Z5 – West View / Cove
    coordinates: [[
      [-81.730086, 12.480487],
      [-81.730562, 12.481047],
      [-81.731209, 12.481453],
      [-81.732064, 12.482037],
      [-81.733016, 12.482740],
      [-81.732988, 12.483735],
      [-81.733293, 12.484819],
      [-81.733672, 12.485892],
      [-81.734234, 12.486619],
      [-81.734746, 12.487776],
      [-81.734978, 12.488790],
      [-81.735015, 12.489672],
      [-81.735332, 12.490829],
      [-81.735307, 12.492021],
      [-81.735051, 12.493261],
      [-81.735051, 12.494692],
      [-81.734884, 12.495847],
      [-81.734713, 12.496884],
      [-81.733934, 12.498004],
      [-81.733116, 12.499137],
      [-81.732323, 12.500080],
      [-81.731688, 12.500915],
      [-81.731016, 12.501785],
      [-81.730455, 12.502822],
      [-81.729978, 12.503728],
      [-81.729685, 12.504502],
      [-81.729441, 12.505624],
      [-81.729307, 12.506363],
      [-81.729160, 12.507340],
      [-81.729281, 12.508388],
      [-81.729757, 12.509258],
      [-81.730050, 12.510116],
      [-81.729928, 12.511022],
      [-81.729842, 12.512107],
      [-81.729745, 12.513084],
      [-81.729684, 12.514264],
      [-81.729623, 12.515325],
      [-81.729476, 12.516302],
      [-81.729244, 12.517518],
      [-81.729024, 12.518305],
      [-81.729109, 12.519141],
      [-81.728742, 12.519987],
      [-81.728922, 12.521044],
      [-81.728788, 12.521949],
      [-81.728629, 12.522808],
      [-81.729171, 12.523988],
      [-81.728622, 12.524989],
      [-81.727730, 12.525513],
      [-81.727434, 12.526553],
      [-81.726775, 12.526863],
      [-81.725004, 12.527681],
      [-81.721987, 12.528843],
      [-81.720754, 12.528843],
      [-81.720059, 12.521658],
      [-81.722449, 12.506001],
      [-81.730086, 12.480487],  // cierre
    ]],
    center: [-81.730293, 12.505463],
    color: '#EF4444',
  }
};

const TaxiZonesMapbox: React.FC<TaxiZonesMapboxProps> = ({ selectedZoneId, onSelectZone }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<mapboxgl.Map | null>(null);
  const labelsRef      = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // activeZones: empieza con el fallback hardcoded, se reemplaza con datos del backend
  const [activeZones, setActiveZones] = useState<Record<string, ZonePolygon>>(ZONE_POLYGONS);
  const activeZonesRef = useRef<Record<string, ZonePolygon>>(ZONE_POLYGONS);

  // ── Inicializar mapa ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: SAN_ANDRES_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', async () => {
      // ── Intentar cargar zonas del servidor (Firestore) ──────────────────────
      let zonesToRender: Record<string, ZonePolygon> = ZONE_POLYGONS;
      try {
        const r = await fetch(`${API_BASE}/api/taxi-zones`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (data.success && data.data?.zones) {
          const raw = data.data.zones as Record<string, number[][]>;
          const converted: Record<string, ZonePolygon> = {};
          for (const [zid, pts] of Object.entries(raw)) {
            const poly = pointsToPolygon(pts);
            if (poly) converted[zid] = poly;
          }
          if (Object.keys(converted).length > 0) {
            zonesToRender = converted;
            console.log(`[TaxiZones] ✅ ${Object.keys(converted).length} zonas cargadas del servidor`);
          }
        }
      } catch (err) {
        console.warn('[TaxiZones] usando zonas hardcoded (fallback):', err);
      }

      // ── Inicializar fuentes, capas y labels con las zonas definitivas ────────
      Object.entries(zonesToRender).forEach(([zoneId, zone]) => {
        const color = ZONE_HEX[zoneId] || '#888';

        map.addSource(`zone-${zoneId}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { id: zoneId },
            geometry: { type: 'Polygon', coordinates: zone.coordinates },
          },
        });

        map.addLayer({
          id: `zone-fill-${zoneId}`,
          type: 'fill',
          source: `zone-${zoneId}`,
          paint: { 'fill-color': color, 'fill-opacity': 0.38 },
        });

        map.addLayer({
          id: `zone-border-${zoneId}`,
          type: 'line',
          source: `zone-${zoneId}`,
          paint: { 'line-color': color, 'line-width': 2, 'line-opacity': 0.9 },
        });

        map.on('click', `zone-fill-${zoneId}`, () => onSelectZone(zoneId));
        map.on('mouseenter', `zone-fill-${zoneId}`, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', `zone-fill-${zoneId}`, () => { map.getCanvas().style.cursor = ''; });
      });

      // Labels
      Object.entries(zonesToRender).forEach(([zoneId, zone]) => {
        const zoneInfo = TAXI_ZONES.find((z: { id: string }) => z.id === zoneId);
        if (!zoneInfo) return;
        const color     = ZONE_HEX[zoneId] || '#888';
        const shortName = zoneInfo.name.replace('Zona ', 'Z').split(' - ')[0];
        const el        = document.createElement('div');
        el.style.cssText = `
          background:rgba(255,255,255,0.92);padding:3px 8px;border-radius:8px;
          font-size:11px;font-weight:700;box-shadow:0 1px 6px rgba(0,0,0,.25);
          border:2px solid ${color};white-space:nowrap;pointer-events:none;color:#111;`;
        el.textContent = shortName;
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(zone.center)
          .addTo(map);
        labelsRef.current.push(marker);
      });

      setActiveZones(zonesToRender);
      activeZonesRef.current = zonesToRender;
      setMapLoaded(true);
    });

    mapRef.current = map;
    return () => {
      labelsRef.current.forEach((m: mapboxgl.Marker) => m.remove());
      labelsRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Resaltar zona seleccionada ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const zones = activeZonesRef.current;

    Object.keys(zones).forEach(zoneId => {
      const isSelected  = zoneId === selectedZoneId;
      const hasSelection = !!selectedZoneId;

      if (map.getLayer(`zone-fill-${zoneId}`)) {
        map.setPaintProperty(`zone-fill-${zoneId}`, 'fill-opacity',
          isSelected ? 0.65 : hasSelection ? 0.12 : 0.38);
      }
      if (map.getLayer(`zone-border-${zoneId}`)) {
        map.setPaintProperty(`zone-border-${zoneId}`, 'line-width', isSelected ? 4 : 2);
        map.setPaintProperty(`zone-border-${zoneId}`, 'line-color',
          isSelected ? '#ffffff' : (ZONE_HEX[zoneId] || '#888'));
      }
    });

    if (selectedZoneId && zones[selectedZoneId]) {
      map.flyTo({ center: zones[selectedZoneId].center, zoom: 12.5, duration: 700 });
    } else if (!selectedZoneId) {
      map.flyTo({ center: SAN_ANDRES_CENTER, zoom: DEFAULT_ZOOM, duration: 700 });
    }
  }, [selectedZoneId, mapLoaded, activeZones]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-[400px]" />

      {/* Leyenda inferior izquierda */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-lg">
        <p className="font-bold text-gray-500 text-[10px] mb-2 uppercase tracking-widest">Zonas</p>
        <div className="space-y-1.5">
          {TAXI_ZONES.map(zone => {
            const isSelected = zone.id === selectedZoneId;
            return (
              <button
                key={zone.id}
                onClick={() => onSelectZone(zone.id)}
                className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded-lg transition-all ${
                  isSelected ? 'bg-gray-100 ring-2 ring-gray-300' : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: ZONE_HEX[zone.id] }}
                />
                <span className={`text-xs ${isSelected ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                  {zone.name.split(' - ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner zona seleccionada */}
      {selectedZoneId && (() => {
        const z = TAXI_ZONES.find(z => z.id === selectedZoneId);
        if (!z) return null;
        return (
          <div className="absolute top-3 left-3 right-12">
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-200 shadow-lg">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: ZONE_HEX[z.id] }}
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{z.name}</p>
                  <p className="text-[11px] text-gray-500 leading-tight">{z.sectors}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TaxiZonesMapbox;
