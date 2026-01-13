/**
 * TaxiZonesMapbox - Mapa interactivo de zonas de taxi con Mapbox
 * Muestra las 5 zonas oficiales de San Andrés con polígonos reales
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TAXI_ZONES } from '../constants';

// Token de Mapbox
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY || 
  'pk.eyJ1Ijoic2t5c2s4aW5nIiwiYSI6ImNqbTc1M2VncDA0a2Iza25vN2x5M29obXcifQ.RoIq-SsDb9l32j8Ydw4d2w';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface TaxiZonesMapboxProps {
  selectedZoneId: string;
  onSelectZone: (id: string) => void;
}

// Coordenadas centrales de San Andrés
const SAN_ANDRES_CENTER: [number, number] = [-81.7050, 12.5550];
const DEFAULT_ZOOM = 11.5;

// Definición de zonas con polígonos GeoJSON reales de San Andrés
const ZONE_POLYGONS: Record<string, { coordinates: number[][][]; center: [number, number]; color: string }> = {
  z1: {
    // Zona 1: Centro / North End (Norte de la isla - Aeropuerto, Centro, Spratt Bight)
    coordinates: [[
      [-81.7150, 12.5950],
      [-81.6850, 12.5950],
      [-81.6850, 12.5750],
      [-81.7050, 12.5700],
      [-81.7150, 12.5750],
      [-81.7150, 12.5950]
    ]],
    center: [-81.7000, 12.5850],
    color: '#FACC15' // yellow-400
  },
  z2: {
    // Zona 2: San Luis (Este de la isla - Rocky Cay, Sound Bay)
    coordinates: [[
      [-81.6850, 12.5750],
      [-81.6750, 12.5750],
      [-81.6700, 12.5500],
      [-81.6750, 12.5300],
      [-81.6900, 12.5250],
      [-81.7050, 12.5400],
      [-81.7050, 12.5700],
      [-81.6850, 12.5750]
    ]],
    center: [-81.6850, 12.5550],
    color: '#22C55E' // green-500
  },
  z3: {
    // Zona 3: La Loma / El Cove (Centro-Oeste montañoso)
    coordinates: [[
      [-81.7150, 12.5750],
      [-81.7050, 12.5700],
      [-81.7050, 12.5400],
      [-81.7150, 12.5300],
      [-81.7250, 12.5400],
      [-81.7250, 12.5600],
      [-81.7150, 12.5750]
    ]],
    center: [-81.7150, 12.5500],
    color: '#EC4899' // pink-500
  },
  z4: {
    // Zona 4: Sur / Punta Sur (Extremo sur - Hoyo Soplador)
    coordinates: [[
      [-81.6900, 12.5250],
      [-81.6750, 12.5300],
      [-81.6800, 12.5100],
      [-81.7000, 12.5000],
      [-81.7200, 12.5050],
      [-81.7300, 12.5150],
      [-81.7150, 12.5300],
      [-81.6900, 12.5250]
    ]],
    center: [-81.7000, 12.5150],
    color: '#60A5FA' // blue-400
  },
  z5: {
    // Zona 5: West View / Cueva de Morgan (Oeste de la isla)
    coordinates: [[
      [-81.7250, 12.5600],
      [-81.7250, 12.5400],
      [-81.7150, 12.5300],
      [-81.7300, 12.5150],
      [-81.7400, 12.5200],
      [-81.7400, 12.5500],
      [-81.7350, 12.5650],
      [-81.7250, 12.5600]
    ]],
    center: [-81.7320, 12.5400],
    color: '#EF4444' // red-500
  }
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
      dragRotate: false
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      console.log('🗺️ Mapa de zonas de taxi cargado');
      setMapLoaded(true);

      // Agregar fuentes y capas para cada zona
      Object.entries(ZONE_POLYGONS).forEach(([zoneId, zone]) => {
        // Agregar fuente GeoJSON
        map.addSource(`zone-${zoneId}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { id: zoneId },
            geometry: {
              type: 'Polygon',
              coordinates: zone.coordinates
            }
          }
        });

        // Capa de relleno
        map.addLayer({
          id: `zone-fill-${zoneId}`,
          type: 'fill',
          source: `zone-${zoneId}`,
          paint: {
            'fill-color': zone.color,
            'fill-opacity': 0.4
          }
        });

        // Capa de borde
        map.addLayer({
          id: `zone-border-${zoneId}`,
          type: 'line',
          source: `zone-${zoneId}`,
          paint: {
            'line-color': zone.color,
            'line-width': 2
          }
        });

        // Evento click en la zona
        map.on('click', `zone-fill-${zoneId}`, () => {
          onSelectZone(zoneId);
        });

        // Cambiar cursor al hover
        map.on('mouseenter', `zone-fill-${zoneId}`, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', `zone-fill-${zoneId}`, () => {
          map.getCanvas().style.cursor = '';
        });
      });

      // Agregar marcadores de etiqueta para cada zona
      Object.entries(ZONE_POLYGONS).forEach(([zoneId, zone]) => {
        const zoneInfo = TAXI_ZONES.find(z => z.id === zoneId);
        if (!zoneInfo) return;

        const el = document.createElement('div');
        el.className = 'taxi-zone-label';
        el.innerHTML = `
          <div style="
            background: white;
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid ${zone.color};
            white-space: nowrap;
          ">
            ${zoneInfo.name.split(' - ')[0]}
          </div>
        `;

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

  // Actualizar estilos cuando cambia la zona seleccionada
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    Object.entries(ZONE_POLYGONS).forEach(([zoneId, zone]) => {
      const isSelected = zoneId === selectedZoneId;
      const hasSelection = !!selectedZoneId;

      // Actualizar opacidad
      if (map.getLayer(`zone-fill-${zoneId}`)) {
        map.setPaintProperty(`zone-fill-${zoneId}`, 'fill-opacity', 
          isSelected ? 0.7 : (hasSelection ? 0.15 : 0.4)
        );
      }

      // Actualizar borde
      if (map.getLayer(`zone-border-${zoneId}`)) {
        map.setPaintProperty(`zone-border-${zoneId}`, 'line-width', isSelected ? 4 : 2);
        map.setPaintProperty(`zone-border-${zoneId}`, 'line-color', isSelected ? '#ffffff' : zone.color);
      }
    });

    // Volar a la zona seleccionada
    if (selectedZoneId && ZONE_POLYGONS[selectedZoneId]) {
      map.flyTo({
        center: ZONE_POLYGONS[selectedZoneId].center,
        zoom: 13,
        duration: 800
      });
    } else if (!selectedZoneId) {
      map.flyTo({
        center: SAN_ANDRES_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: 800
      });
    }
  }, [selectedZoneId, mapLoaded]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Contenedor del mapa */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[350px]"
      />

      {/* Leyenda */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-gray-200 shadow-lg">
        <p className="font-bold text-gray-600 text-xs mb-2 uppercase tracking-wide">Zonas de Taxi</p>
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
                <div className={`w-3 h-3 rounded-full ${zone.color}`}></div>
                <span className={`text-xs ${isSelected ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                  {zone.name.split(' - ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Indicador de zona seleccionada */}
      {selectedZoneId && (
        <div className="absolute top-3 left-3 right-3">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${TAXI_ZONES.find(z => z.id === selectedZoneId)?.color}`}></div>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {TAXI_ZONES.find(z => z.id === selectedZoneId)?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {TAXI_ZONES.find(z => z.id === selectedZoneId)?.sectors}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxiZonesMapbox;
