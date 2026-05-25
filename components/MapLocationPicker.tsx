/**
 * MapLocationPicker — Selector de ubicación en mapa satelital
 *
 * Uso: drag del marcador o clic en el mapa para seleccionar coordenadas.
 * Ideal para formularios de aliados, almacenes, o cualquier POI.
 *
 * Props:
 *   defaultLng / defaultLat — coordenada inicial del marcador (opcional)
 *   onChange(lng, lat)       — callback cuando el usuario mueve el pin
 *   height                   — alto del mapa (default '280px')
 *   label                    — texto del marcador (default 'Ubicación')
 *   readOnly                 — solo visualización, no permite mover el pin
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation } from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY || '';

// Centro por defecto: San Andrés isla
const SAI_CENTER: [number, number] = [-81.7050, 12.5300];

interface MapLocationPickerProps {
  defaultLng?:  number;
  defaultLat?:  number;
  onChange?:    (lng: number, lat: number) => void;
  height?:      string;
  label?:       string;
  readOnly?:    boolean;
  className?:   string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  defaultLng,
  defaultLat,
  onChange,
  height    = '280px',
  label     = 'Ubicación',
  readOnly  = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const markerRef    = useRef<mapboxgl.Marker | null>(null);

  const hasInitial = defaultLng != null && defaultLat != null;
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(
    hasInitial ? { lng: defaultLng!, lat: defaultLat! } : null
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = hasInitial
      ? [defaultLng!, defaultLat!]
      : SAI_CENTER;
    const initialZoom = hasInitial ? 14 : 12;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
      dragRotate: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    // Marcador personalizado
    const el = document.createElement('div');
    el.style.cssText = `
      width: 32px; height: 32px;
      background: #f97316;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      cursor: ${readOnly ? 'default' : 'grab'};
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    `;

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
      draggable: !readOnly,
    }).setLngLat(hasInitial ? [defaultLng!, defaultLat!] : SAI_CENTER);

    if (hasInitial) {
      marker.addTo(map);
    }

    if (!readOnly) {
      // Drag del marcador
      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        setCoords({ lng: pos.lng, lat: pos.lat });
        onChange?.(pos.lng, pos.lat);
      });

      // Clic en el mapa → mueve el marcador
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]).addTo(map);
        setCoords({ lng, lat });
        onChange?.(lng, lat);
      });

      map.on('mouseenter', () => { map.getCanvas().style.cursor = 'crosshair'; });
    }

    map.on('load', () => {
      map.resize();
      requestAnimationFrame(() => map.resize());
    });

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current!);

    mapRef.current  = map;
    markerRef.current = marker;

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current  = null;
      markerRef.current = null;
    };
  }, []);

  // Centrar en la ubicación actual del marcador
  const centerOnMarker = () => {
    if (!mapRef.current || !coords) return;
    mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 15, duration: 600 });
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      {/* Mapa */}
      <div ref={containerRef} style={{ height }} className="w-full" />

      {/* Instrucción (solo si no es readOnly) */}
      {!readOnly && (
        <div className="absolute top-2 left-2 right-12 pointer-events-none">
          <div className="bg-black/70 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 backdrop-blur-sm">
            <MapPin size={10} />
            {coords ? 'Arrastra el pin o haz clic para mover' : 'Haz clic en el mapa para fijar ubicación'}
          </div>
        </div>
      )}

      {/* Coordenadas actuales */}
      {coords && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <div className="bg-black/75 backdrop-blur-sm text-white text-[10px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="text-orange-400">📍</span>
            <span>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
          </div>
          <button
            onClick={centerOnMarker}
            className="bg-black/75 backdrop-blur-sm text-white p-1.5 rounded-lg hover:bg-black/90 transition-colors"
            title="Centrar en el pin"
          >
            <Navigation size={11} />
          </button>
        </div>
      )}

      {/* Label del pin */}
      {coords && (
        <div className="absolute bottom-2 right-2">
          <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow">
            {label}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;
