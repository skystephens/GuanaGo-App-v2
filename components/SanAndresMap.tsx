
import React from 'react';
import { TAXI_ZONES } from '../constants';

interface MapProps {
  selectedZoneId: string;
  onSelectZone: (id: string) => void;
}

// Mapa estático de referencia usando la imagen proporcionada
const SanAndresMap: React.FC<MapProps> = ({ selectedZoneId, onSelectZone }) => {
  // Props preservados por compatibilidad, aunque el mapa es estático
  void selectedZoneId;
  void onSelectZone;

  return (
    <div className="w-full my-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 w-full">
            <div className="w-full rounded-xl overflow-hidden border border-gray-100 bg-white">
              <img
                src="https://guiasanandresislas.com/wp-content/uploads/2026/01/Mapa-traslados-taxi.png"
                alt="Mapa de traslados en San Andrés"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          </div>

          <div className="w-full md:w-72 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Zonas de Taxi</p>
            <div className="space-y-2">
              {TAXI_ZONES.map((zone) => {
                const zoneNumber = zone.id.replace('z', '');
                const zoneLabel = zone.name.split(' - ')[0] || zone.name;
                return (
                  <div key={zone.id} className="flex items-start gap-2">
                    <div className={`w-3 h-3 mt-1 rounded-full border border-gray-300 ${zone.color}`}></div>
                    <div className="text-xs text-gray-700 leading-tight">
                      <span className="font-bold mr-1">Zona {zoneNumber}</span>
                      <span>{zoneLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SanAndresMap;
