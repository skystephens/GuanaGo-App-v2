import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X, MapPin } from 'lucide-react';
import type { QuoteItemStatus } from '../../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY || '';

// Colors for up to 5 distinct accommodations
const INDEX_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#14b8a6'];

const STATUS_OVERRIDES: Partial<Record<QuoteItemStatus, string>> = {
  conflicto: '#eab308',
  no_disponible: '#ef4444',
};

function getCircleColor(status: QuoteItemStatus | undefined, index: number): string {
  if (status && STATUS_OVERRIDES[status]) return STATUS_OVERRIDES[status]!;
  return INDEX_COLORS[index % INDEX_COLORS.length];
}

// Generates a GeoJSON polygon approximating a circle on a sphere
function buildCirclePolygon(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  points = 64
): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dy = radiusKm * Math.sin(angle);
    const dx = radiusKm * Math.cos(angle);
    const lat = centerLat + dy / 111.32;
    const lng = centerLng + dx / (111.32 * Math.cos((centerLat * Math.PI) / 180));
    coords.push([lng, lat]);
  }
  return coords;
}

export interface MapAccommodation {
  id: string;
  title: string;
  latLon: string;
  status?: QuoteItemStatus;
}

interface QuotationMapViewProps {
  accommodations: MapAccommodation[];
  onClose: () => void;
}

const SAN_ANDRES_CENTER: [number, number] = [-81.7006, 12.5847];

const QuotationMapView: React.FC<QuotationMapViewProps> = ({ accommodations, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const valid = accommodations.filter((a) => {
    if (!a.latLon) return false;
    const parts = a.latLon.split(',').map((s) => s.trim());
    if (parts.length !== 2) return false;
    return !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
  });

  const noCoords = accommodations.length > 0 && valid.length === 0;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: SAN_ANDRES_CENTER,
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      const bounds = new mapboxgl.LngLatBounds();

      valid.forEach((acc, index) => {
        const [latStr, lonStr] = acc.latLon.split(',').map((s) => s.trim());
        const lat = parseFloat(latStr);
        const lng = parseFloat(lonStr);
        const color = getCircleColor(acc.status, index);

        // Small privacy offset (≈ 50–130 m) so the circle doesn't reveal the exact point
        const offsetLat = (Math.random() - 0.5) * 0.0012;
        const offsetLng = (Math.random() - 0.5) * 0.0012;
        const centerLat = lat + offsetLat;
        const centerLng = lng + offsetLng;

        const circleCoords = buildCirclePolygon(centerLng, centerLat, 0.11); // ~110 m radius

        const sourceId = `alo-${acc.id}`;
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { title: acc.title },
            geometry: { type: 'Polygon', coordinates: [circleCoords] },
          },
        });

        map.addLayer({
          id: `${sourceId}-fill`,
          type: 'fill',
          source: sourceId,
          paint: { 'fill-color': color, 'fill-opacity': 0.25 },
        });

        map.addLayer({
          id: `${sourceId}-stroke`,
          type: 'line',
          source: sourceId,
          paint: { 'line-color': color, 'line-width': 2.5, 'line-opacity': 0.85 },
        });

        // Label marker at the approximate center
        const el = document.createElement('div');
        const label = acc.title.length > 22 ? acc.title.slice(0, 20) + '…' : acc.title;
        el.innerHTML = `<span>${label}</span>`;
        el.style.cssText = [
          `background:${color}`,
          'color:white',
          'padding:3px 9px',
          'border-radius:10px',
          'font-size:11px',
          'font-weight:700',
          'white-space:nowrap',
          'box-shadow:0 2px 8px rgba(0,0,0,0.35)',
          'font-family:Poppins,sans-serif',
          'pointer-events:none',
        ].join(';');

        new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([centerLng, centerLat])
          .addTo(map);

        bounds.extend([lng, lat]);
      });

      if (valid.length > 0) {
        map.fitBounds(bounds, { padding: 90, maxZoom: 15, duration: 800 });
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-gray-900 rounded-2xl overflow-hidden w-full max-w-4xl flex flex-col"
        style={{ height: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-white font-bold text-sm">Ubicaciones de Alojamientos</h2>
              <p className="text-gray-500 text-[11px]">
                {valid.length === 0
                  ? 'San Andrés Isla, Colombia'
                  : `${valid.length} de ${accommodations.length} con ubicación · áreas aproximadas`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        {valid.length > 0 && (
          <div className="px-5 py-2 border-b border-gray-800 flex flex-wrap gap-x-4 gap-y-1.5 flex-shrink-0">
            {valid.map((acc, index) => {
              const color = getCircleColor(acc.status, index);
              return (
                <div key={acc.id} className="flex items-center gap-1.5">
                  <div
                    style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
                  />
                  <span className="text-[11px] text-gray-300 font-medium truncate max-w-[160px]">
                    {acc.title}
                  </span>
                  {acc.status === 'conflicto' && (
                    <span className="text-[9px] text-amber-400 font-bold">CONFLICTO</span>
                  )}
                  {acc.status === 'no_disponible' && (
                    <span className="text-[9px] text-red-400 font-bold">NO DISP.</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Map — siempre visible, centrado en San Andrés aunque no haya coordenadas */}
        <div className="flex-1 relative min-h-0">
          <div ref={mapContainerRef} className="w-full h-full" />
          {noCoords && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center max-w-xs">
              <p className="text-xs text-gray-400">San Andrés Isla, Colombia</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Ubica los servicios de tu cotización en la isla</p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-5 py-2.5 bg-gray-950 flex-shrink-0">
          <p className="text-[10px] text-gray-600">
            Las áreas mostradas son aproximadas. La ubicación exacta se comparte al confirmar la reserva.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuotationMapView;
