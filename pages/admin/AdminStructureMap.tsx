import React, { useState } from 'react';
import { ArrowLeft, Server, FolderTree, FileText, RefreshCw } from 'lucide-react';
import { AppRoute } from '../../types';
import { api } from '../../services/api';

interface AdminStructureMapProps {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const TreeView: React.FC<{ data: any; level?: number }> = ({ data, level = 0 }) => {
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data);
  return (
    <div className="pl-3 border-l border-gray-800">
      {entries.map(([key, value]) => (
        <div key={key} className="mb-1">
          <div className="flex items-center gap-2 text-xs">
            {typeof value === 'string' ? (
              <FileText size={12} className="text-gray-500" />
            ) : (
              <FolderTree size={12} className="text-gray-400" />
            )}
            <span className="font-medium text-gray-300">{key}</span>
          </div>
          {typeof value !== 'string' && <TreeView data={value} level={level + 1} />}
        </div>
      ))}
    </div>
  );
};

const AdminStructureMap: React.FC<AdminStructureMapProps> = ({ onBack }) => {
  const [structure, setStructure] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    try {
      setLoading(true);
      const res = await api.system.getStructure();
      if (res?.success) {
        setStructure(res.structure);
        setSummary(res.summary);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white pb-24 font-sans">
      <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-gray-900 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-900 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server size={24} className="text-purple-500" />
            Mapa de la Estructura (Backend)
          </h1>
          <p className="text-sm text-gray-400 mt-1">Rutas, controladores, servicios y middleware</p>
        </div>
        <button onClick={analyze} disabled={loading} className="p-2 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="px-6 pt-6 space-y-6">
        {!structure ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Server size={32} className="text-purple-500" />
              </div>
              <p className="text-gray-300 font-bold text-lg mb-2">Análisis del Backend</p>
              <p className="text-gray-400 text-sm mb-6">Descubre la estructura completa de rutas, controladores, servicios y middleware</p>
            </div>
            <button 
              onClick={analyze}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors inline-flex items-center gap-2"
            >
              <Server size={16} />
              {loading ? 'Analizando...' : 'Iniciar Análisis'}
            </button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['routes','controllers','services','middleware','utils'].map((key) => (
                <div key={key} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{key}</div>
                  <div className="text-xl font-bold mt-1">{summary?.[key]?.length || 0}</div>
                  <div className="text-xs text-gray-500 mt-2">{summary?.[key]?.join(', ') || '—'}</div>
                </div>
              ))}
            </div>

            {/* Tree */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 max-h-96 overflow-auto">
              <TreeView data={structure} />
            </div>

            {/* Retry Button */}
            <button 
              onClick={analyze}
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              {loading ? '⏳ Analizando...' : '🔄 Actualizar Análisis'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminStructureMap;
