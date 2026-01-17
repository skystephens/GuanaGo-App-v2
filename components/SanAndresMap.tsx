
import React from 'react';
import { TAXI_ZONES } from '../constants';

interface MapProps {
  selectedZoneId: string;
  onSelectZone: (id: string) => void;
}

// Coordenadas GPS reales de San Andrés
const ZONES_GPS = {
  z1: { // Centro/Norte
    points: [
      [12.593575, -81.705901], // Norte (Aeropuerto)
      [12.581476, -81.687821], // Este
      [12.571243, -81.708327], // Sur
      [12.579495, -81.721459], // Oeste
    ]
  },
  z2: { // San Luis - Este
    points: [
      [12.571655, -81.708720], // Norte
      [12.571217, -81.708150], // Este
      [12.541645, -81.708825], // Sur
      [12.541296, -81.707993], // Oeste
    ]
  },
  z3: { // La Loma - Centro
    points: [
      [12.580963, -81.720242], // Norte
      [12.572037, -81.708321], // Este
      [12.536670, -81.707706], // Sur
      [12.531116, -81.735398], // Oeste
    ]
  },
  z4: { // Punta Sur - Sur
    points: [
      [12.537253, -81.710696], // Norte
      [12.536772, -81.707837], // Este
      [12.480330, -81.729437], // Sur
      [12.480330, -81.729437], // Oeste
    ]
  },
  z5: { // West View - Oeste
    points: [
      [12.530449, -81.735515], // Norte
      [12.555292, -81.717696], // Este
      [12.480791, -81.730244], // Sur
      [12.480575, -81.729556], // Oeste
    ]
  }
};

// Función para convertir coordenadas GPS a SVG
const gpsToSvg = (lat: number, lng: number, svgWidth: number = 400, svgHeight: number = 600) => {
  // Límites aproximados de San Andrés
  const minLat = 12.480330;
  const maxLat = 12.593575;
  const minLng = -81.735515;
  const maxLng = -81.687821;

  // Normalizar a coordenadas SVG
  const x = ((lng - minLng) / (maxLng - minLng)) * svgWidth;
  const y = ((maxLat - lat) / (maxLat - minLat)) * svgHeight;

  return { x, y };
};

// Convertir todos los puntos a SVG
const getZonePath = (zoneId: keyof typeof ZONES_GPS): string => {
  const zone = ZONES_GPS[zoneId];
  if (!zone) return '';

  const svgPoints = zone.points.map(([lat, lng]) => {
    const { x, y } = gpsToSvg(lat, lng);
    return `${x},${y}`;
  }).join(' ');

  return `${svgPoints}`;
};

const SanAndresMap: React.FC<MapProps> = ({ selectedZoneId, onSelectZone }) => {
  // Helper to get color style
  const getZoneStyle = (zoneId: string, defaultColorClass: string) => {
    const isSelected = selectedZoneId === zoneId;
    const isAnySelected = !!selectedZoneId;
    
    // Color Mapping
    const colorMap: Record<string, string> = {
       'bg-yellow-400': '#FACC15', // Zona 1
       'bg-green-500': '#22C55E',  // Zona 2
       'bg-pink-500': '#EC4899',   // Zona 3
       'bg-blue-400': '#60A5FA',   // Zona 4
       'bg-red-500': '#EF4444',    // Zona 5
    };

    const baseColor = colorMap[defaultColorClass] || '#cbd5e1';

    return {
       fill: baseColor,
       fillOpacity: isSelected ? 0.6 : (isAnySelected ? 0.1 : 0.3),
       stroke: isSelected ? '#ffffff' : baseColor,
       strokeWidth: isSelected ? 3 : 1.5,
       cursor: 'pointer',
       transition: 'all 0.3s ease',
       filter: isSelected ? 'drop-shadow(0px 0px 8px rgba(0,0,0,0.3))' : 'none'
    };
  };

  const getZone = (id: string) => TAXI_ZONES.find(z => z.id === id);

  return (
    <div className="w-full flex justify-center my-4 relative rounded-2xl overflow-hidden border border-gray-200 bg-blue-50">
      
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 400 600" 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto max-h-[600px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fondo gradiente del océano */}
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#E0F2FE', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#BAE6FD', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        <rect width="400" height="600" fill="url(#oceanGradient)" />

        {/* ZONA 1: Centro/Norte (Amarillo) */}
        <polygon 
          points={getZonePath('z1')}
          style={getZoneStyle('z1', getZone('z1')?.color || '')}
          onClick={() => onSelectZone('z1')}
        />

        {/* ZONA 2: San Luis - Este (Verde) */}
        <polygon 
          points={getZonePath('z2')}
          style={getZoneStyle('z2', getZone('z2')?.color || '')}
          onClick={() => onSelectZone('z2')}
        />

        {/* ZONA 3: La Loma - Centro (Rosado) */}
        <polygon 
          points={getZonePath('z3')}
          style={getZoneStyle('z3', getZone('z3')?.color || '')}
          onClick={() => onSelectZone('z3')}
        />

        {/* ZONA 4: Punta Sur - Sur (Azul) */}
        <polygon 
          points={getZonePath('z4')}
          style={getZoneStyle('z4', getZone('z4')?.color || '')}
          onClick={() => onSelectZone('z4')}
        />

        {/* ZONA 5: West View - Oeste (Rojo) */}
        <polygon 
          points={getZonePath('z5')}
          style={getZoneStyle('z5', getZone('z5')?.color || '')}
          onClick={() => onSelectZone('z5')}
        />

        {/* Etiquetas de zonas */}
        {/* Z1 */}
        <g pointerEvents="none" opacity={selectedZoneId === 'z1' || !selectedZoneId ? 1 : 0.5}>
           <rect x="170" y="80" width="60" height="20" rx="4" fill="white" fillOpacity="0.9" />
           <text x="200" y="94" fontSize="11" fontWeight="bold" fill="black" textAnchor="middle">ZONA 1</text>
        </g>

        {/* Z2 */}
        <g pointerEvents="none" opacity={selectedZoneId === 'z2' || !selectedZoneId ? 1 : 0.5}>
           <rect x="295" y="280" width="60" height="20" rx="4" fill="white" fillOpacity="0.9" />
           <text x="325" y="294" fontSize="11" fontWeight="bold" fill="black" textAnchor="middle">ZONA 2</text>
        </g>

        {/* Z3 */}
        <g pointerEvents="none" opacity={selectedZoneId === 'z3' || !selectedZoneId ? 1 : 0.5}>
           <rect x="140" y="320" width="60" height="20" rx="4" fill="white" fillOpacity="0.9" />
           <text x="170" y="334" fontSize="11" fontWeight="bold" fill="black" textAnchor="middle">ZONA 3</text>
        </g>

        {/* Z4 */}
        <g pointerEvents="none" opacity={selectedZoneId === 'z4' || !selectedZoneId ? 1 : 0.5}>
           <rect x="220" y="480" width="60" height="20" rx="4" fill="white" fillOpacity="0.9" />
           <text x="250" y="494" fontSize="11" fontWeight="bold" fill="black" textAnchor="middle">ZONA 4</text>
        </g>

        {/* Z5 */}
        <g pointerEvents="none" opacity={selectedZoneId === 'z5' || !selectedZoneId ? 1 : 0.5}>
           <rect x="50" y="400" width="60" height="20" rx="4" fill="white" fillOpacity="0.9" />
           <text x="80" y="414" fontSize="11" fontWeight="bold" fill="black" textAnchor="middle">ZONA 5</text>
        </g>

        {/* Marcador de Aeropuerto */}
        <circle cx={gpsToSvg(12.593575, -81.705901).x} cy={gpsToSvg(12.593575, -81.705901).y} r="5" fill="white" stroke="#333" strokeWidth="2" />
        <text x={gpsToSvg(12.593575, -81.705901).x} y={gpsToSvg(12.593575, -81.705901).y - 10} fontSize="14" textAnchor="middle">✈️</text>

      </svg>

      {/* Leyenda Flotante */}
      <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-md text-[10px]">
         <p className="font-bold text-gray-600 mb-2">Zonas de Taxi</p>
         <div className="flex items-center gap-1.5 mb-1"><div className="w-3 h-3 rounded-full bg-yellow-400 border border-gray-300"></div> <span>Z1 Centro</span></div>
         <div className="flex items-center gap-1.5 mb-1"><div className="w-3 h-3 rounded-full bg-green-500 border border-gray-300"></div> <span>Z2 San Luis</span></div>
         <div className="flex items-center gap-1.5 mb-1"><div className="w-3 h-3 rounded-full bg-pink-500 border border-gray-300"></div> <span>Z3 La Loma</span></div>
         <div className="flex items-center gap-1.5 mb-1"><div className="w-3 h-3 rounded-full bg-blue-400 border border-gray-300"></div> <span>Z4 Punta Sur</span></div>
         <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500 border border-gray-300"></div> <span>Z5 West View</span></div>
      </div>
    </div>
  );
};

export default SanAndresMap;
