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

mapboxgl.accessToken = MAPBOX_TOKEN;

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
const ZONE_POLYGONS: Record<string, { coordinates: number[][][]; center: [number, number] }> = {
  z1: {
    // Norte: Centro, North End, Aeropuerto, Spratt Bight, El Cliff
    coordinates: [[
      [-81.7200, 12.5950],
      [-81.6780, 12.5950],
      [-81.6720, 12.5780],
      [-81.6800, 12.5680],
      [-81.6950, 12.5620],
      [-81.7100, 12.5620],
      [-81.7220, 12.5700],
      [-81.7250, 12.5820],
      [-81.7200, 12.5950],
    ]],
    center: [-81.6980, 12.5800],
  },
  z2: {
    // Este: San Luis, Sound Bay, Rocky Cay, Bahía Sonora
    coordinates: [[
      [-81.6800, 12.5680],
      [-81.6720, 12.5780],
      [-81.6680, 12.5600],
      [-81.6700, 12.5380],
      [-81.6780, 12.5280],
      [-81.6920, 12.5250],
      [-81.7000, 12.5350],
      [-81.6980, 12.5500],
      [-81.6950, 12.5620],
      [-81.6800, 12.5680],
    ]],
    center: [-81.6800, 12.5480],
  },
  z3: {
    // Centro-Oeste montañoso: La Loma, El Cove, Orange Hill, Brooks Hill
    coordinates: [[
      [-81.7100, 12.5620],
      [-81.6950, 12.5620],
      [-81.6980, 12.5500],
      [-81.7000, 12.5350],
      [-81.7080, 12.5280],
      [-81.7200, 12.5300],
      [-81.7300, 12.5400],
      [-81.7280, 12.5550],
      [-81.7220, 12.5700],
      [-81.7100, 12.5620],
    ]],
    center: [-81.7130, 12.5480],
  },
  z4: {
    // Sur: Punta Sur, Tom Hooker, El Acuario, South End
    coordinates: [[
      [-81.6920, 12.5250],
      [-81.6780, 12.5280],
      [-81.6750, 12.5100],
      [-81.6820, 12.4920],
      [-81.7000, 12.4850],
      [-81.7180, 12.4900],
      [-81.7280, 12.5050],
      [-81.7200, 12.5200],
      [-81.7080, 12.5280],
      [-81.6920, 12.5250],
    ]],
    center: [-81.7010, 12.5080],
  },
  z5: {
    // Oeste: West View, Cueva de Morgan, Big Pond
    coordinates: [[
      [-81.7220, 12.5700],
      [-81.7280, 12.5550],
      [-81.7300, 12.5400],
      [-81.7200, 12.5300],
      [-81.7280, 12.5050],
      [-81.7380, 12.5100],
      [-81.7450, 12.5300],
      [-81.7420, 12.5550],
      [-81.7350, 12.5720],
      [-81.7220, 12.5700],
    ]],
    center: [-81.7360, 12.5380],
  },
};

const TaxiZonesMapbox: React.FC<TaxiZonesMapboxProps> = ({ selectedZoneId, onSelectZone }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Inicializar mapa
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

    map.on('load', () => {
      setMapLoaded(true);

      Object.entries(ZONE_POLYGONS).forEach(([zoneId, zone]) => {
        const color = ZONE_HEX[zoneId] || '#888';

        map.addSource(`zone-${zoneId}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { id: zoneId },
            geometry: { type: 'Polygon', coordinates: zone.coordinates },
          },
        });

        // Relleno semi-transparente
        map.addLayer({
          id: `zone-fill-${zoneId}`,
          type: 'fill',
          source: `zone-${zoneId}`,
          paint: {
            'fill-color': color,
            'fill-opacity': 0.38,
          },
        });

        // Borde de zona
        map.addLayer({
          id: `zone-border-${zoneId}`,
          type: 'line',
          source: `zone-${zoneId}`,
          paint: {
            'line-color': color,
            'line-width': 2,
            'line-opacity': 0.9,
          },
        });

        // Click para seleccionar
        map.on('click', `zone-fill-${zoneId}`, () => {
          onSelectZone(zoneId);
        });

        map.on('mouseenter', `zone-fill-${zoneId}`, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `zone-fill-${zoneId}`, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      // Labels flotantes por zona
      Object.entries(ZONE_POLYGONS).forEach(([zoneId, zone]) => {
        const zoneInfo = TAXI_ZONES.find(z => z.id === zoneId);
        if (!zoneInfo) return;
        const color = ZONE_HEX[zoneId] || '#888';
        const shortName = zoneInfo.name.replace('Zona ', 'Z').split(' - ')[0];

        const el = document.createElement('div');
        el.style.cssText = `
          background: rgba(255,255,255,0.92);
          padding: 3px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 1px 6px rgba(0,0,0,0.25);
          border: 2px solid ${color};
          white-space: nowrap;
          pointer-events: none;
          color: #111;
        `;
        el.textContent = shortName;

        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(zone.center)
          .addTo(map);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Resaltar zona seleccionada
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    Object.entries(ZONE_POLYGONS).forEach(([zoneId]) => {
      const isSelected = zoneId === selectedZoneId;
      const hasSelection = !!selectedZoneId;

      if (map.getLayer(`zone-fill-${zoneId}`)) {
        map.setPaintProperty(
          `zone-fill-${zoneId}`,
          'fill-opacity',
          isSelected ? 0.65 : hasSelection ? 0.12 : 0.38
        );
      }

      if (map.getLayer(`zone-border-${zoneId}`)) {
        map.setPaintProperty(`zone-border-${zoneId}`, 'line-width', isSelected ? 4 : 2);
        map.setPaintProperty(
          `zone-border-${zoneId}`,
          'line-color',
          isSelected ? '#ffffff' : (ZONE_HEX[zoneId] || '#888')
        );
      }
    });

    if (selectedZoneId && ZONE_POLYGONS[selectedZoneId]) {
      map.flyTo({
        center: ZONE_POLYGONS[selectedZoneId].center,
        zoom: 12.5,
        duration: 700,
      });
    } else if (!selectedZoneId) {
      map.flyTo({ center: SAN_ANDRES_CENTER, zoom: DEFAULT_ZOOM, duration: 700 });
    }
  }, [selectedZoneId, mapLoaded]);

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
