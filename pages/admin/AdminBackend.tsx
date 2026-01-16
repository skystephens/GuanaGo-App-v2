/**
 * AdminBackend - Panel de Sincronización con Airtable
 * Muestra estado de conexión, última sincronización y permite forzar actualización
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  Download,
  AlertTriangle,
  Loader2,
  MapPin,
  Package,
  Music,
  Users,
  FileText,
  Wifi,
  WifiOff,
  HardDrive,
  Zap,
  Server,
  DollarSign,
  Calendar,
  Star,
  ShoppingBag
} from 'lucide-react';
import { airtableService } from '../../services/airtableService';
import { clearAllCache } from '../../services/cachedApi';

interface TableStatus {
  name: string;
  airtableTable: string;
  icon: React.ReactNode;
  status: 'idle' | 'syncing' | 'success' | 'error';
  recordCount: number;
  lastSync: string | null;
  error?: string;
}

const AdminBackend: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    // Si no está autenticado, mostrar pantalla de login
    if (!isAuthenticated) {
      const AdminPinLogin = require('../AdminPinLogin').default;
      return <AdminPinLogin onLoginSuccess={(user) => { setIsAuthenticated(true); setAdminUser(user); }} />;
    }
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [tables, setTables] = useState<TableStatus[]>([
    { name: 'Servicios Turísticos', airtableTable: 'ServiciosTuristicos_SAI', icon: <Package size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Directorio / Mapa', airtableTable: 'Directorio_Mapa', icon: <MapPin size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Artistas RIMM', airtableTable: 'Rimm_musicos', icon: <Music size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Leads', airtableTable: 'Leads', icon: <Users size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Usuarios Admins', airtableTable: 'Usuarios_Admins', icon: <FileText size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Pagos', airtableTable: 'Pagos', icon: <DollarSign size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Reservas', airtableTable: 'Reservas', icon: <Calendar size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'GUANA Transacciones', airtableTable: 'GUANA_Transacciones', icon: <Zap size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Retos GUANA', airtableTable: 'Retos_GUANA', icon: <Star size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Productos Artista', airtableTable: 'Productos_Artista', icon: <Music size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Ventas Artista', airtableTable: 'Ventas_Artista', icon: <ShoppingBag size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Procedimientos RAG', airtableTable: 'procedimientos_RAG', icon: <FileText size={20} />, status: 'idle', recordCount: 0, lastSync: null },
    { name: 'Logs Trazabilidad', airtableTable: 'Logs_Trazabilidad', icon: <AlertTriangle size={20} />, status: 'idle', recordCount: 0, lastSync: null },
  ]);
  
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({ size: 0, items: 0 });
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(null);

  // Verificar conexión con Airtable al cargar
  useEffect(() => {
    checkConnection();
    loadCacheInfo();
    loadLastSyncTimes();
  }, []);

  const checkConnection = async () => {
    setIsConnected(null);
    try {
      if (!airtableService.isConfigured()) {
        setIsConnected(false);
        return;
      }
      
      // Probar conexión con una petición pequeña
      const testData = await airtableService.fetchTable('ServiciosTuristicos_SAI', { maxRecords: 1 });
      setIsConnected(testData !== null && testData.length > 0);
    } catch {
      setIsConnected(false);
    }
  };

  const loadCacheInfo = () => {
    let totalSize = 0;
    let itemCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('guanago_')) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // Aproximado en bytes (UTF-16)
          itemCount++;
        }
      }
    }
    
    setCacheInfo({ size: Math.round(totalSize / 1024), items: itemCount });
  };

  const loadLastSyncTimes = () => {
    // Cargar tiempos de última sincronización desde localStorage
    const metadata = localStorage.getItem('guanago_cache_metadata');
    if (metadata) {
      try {
        const data = JSON.parse(metadata);
        if (data.lastSync) {
          setLastGlobalSync(new Date(data.lastSync).toLocaleString());
        }
      } catch {}
    }
  };

  const syncTable = async (index: number) => {
    const table = tables[index];
    
    // Actualizar estado a "syncing"
    setTables(prev => prev.map((t, i) => 
      i === index ? { ...t, status: 'syncing' as const, error: undefined } : t
    ));

    try {
      let data: any[] = [];
      
      switch (table.airtableTable) {
        case 'ServiciosTuristicos_SAI':
          data = await airtableService.getServices();
          break;
        case 'Directorio_Mapa':
          data = await airtableService.getDirectoryPoints();
          break;
        case 'Rimm_musicos':
          data = await airtableService.getArtists();
          break;
        case 'Leads':
          data = await airtableService.fetchTable('Leads');
          break;
      }

      const now = new Date().toLocaleString();
      
      setTables(prev => prev.map((t, i) => 
        i === index ? { 
          ...t, 
          status: 'success' as const,
          recordCount: data.length,
          lastSync: now
        } : t
      ));

    } catch (error) {
      setTables(prev => prev.map((t, i) => 
        i === index ? { 
          ...t, 
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Error de sincronización'
        } : t
      ));
    }
  };

  const syncAllTables = async () => {
    setIsSyncingAll(true);
    
    for (let i = 0; i < tables.length; i++) {
      await syncTable(i);
      // Pequeña pausa entre peticiones para no saturar
      await new Promise(r => setTimeout(r, 300));
    }
    
    setLastGlobalSync(new Date().toLocaleString());
    
    // Guardar timestamp en metadata
    const metadata = { lastSync: Date.now(), appVersion: '2.0.0' };
    localStorage.setItem('guanago_cache_metadata', JSON.stringify(metadata));
    
    setIsSyncingAll(false);
    loadCacheInfo();
  };

  const handleClearCache = () => {
    if (confirm('¿Estás seguro de limpiar toda la caché local? Los datos se recargarán desde Airtable.')) {
      clearAllCache();
      loadCacheInfo();
      setTables(prev => prev.map(t => ({ ...t, status: 'idle' as const, recordCount: 0, lastSync: null })));
    }
  };

  const getStatusIcon = (status: TableStatus['status']) => {
    switch (status) {
      case 'syncing': return <Loader2 size={18} className="animate-spin text-blue-500" />;
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'error': return <XCircle size={18} className="text-red-500" />;
      default: return <Clock size={18} className="text-gray-400" />;
    }
  };

  const totalRecords = tables.reduce((sum, t) => sum + t.recordCount, 0);
  const successCount = tables.filter(t => t.status === 'success').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 pt-14 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database size={28} />
          <h1 className="text-2xl font-black">Panel de Datos</h1>
        </div>
        <p className="text-indigo-100 text-sm">Sincronización directa con Airtable</p>
      </header>

      <div className="px-4 -mt-4 space-y-4">
        
        {/* Estado de Conexión */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected === null ? (
                <Loader2 size={24} className="animate-spin text-gray-400" />
              ) : isConnected ? (
                <Wifi size={24} className="text-green-500" />
              ) : (
                <WifiOff size={24} className="text-red-500" />
              )}
              <div>
                <h3 className="font-bold text-gray-800">Conexión Airtable</h3>
                <p className="text-xs text-gray-500">
                  {isConnected === null ? 'Verificando...' : 
                   isConnected ? '✅ Conectado correctamente' : 
                   '❌ Sin conexión - Verifica credenciales'}
                </p>
              </div>
            </div>
            <button 
              onClick={checkConnection}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <RefreshCw size={20} className="text-gray-500" />
            </button>
          </div>
          
          {!airtableService.isConfigured() && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Credenciales no configuradas</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Agrega VITE_AIRTABLE_API_KEY y VITE_AIRTABLE_BASE_ID en .env
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100 text-center">
            <p className="text-2xl font-black text-indigo-600">{tables.length}</p>
            <p className="text-xs text-gray-500">Tablas</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100 text-center">
            <p className="text-2xl font-black text-emerald-600">{totalRecords}</p>
            <p className="text-xs text-gray-500">Registros</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100 text-center">
            <p className="text-2xl font-black text-purple-600">{successCount}/{tables.length}</p>
            <p className="text-xs text-gray-500">Sincronizadas</p>
          </div>
        </div>

        {/* Botón Sincronizar Todo */}
        <button
          onClick={syncAllTables}
          disabled={isSyncingAll || !isConnected}
          className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3 shadow-lg transition ${
            isSyncingAll || !isConnected 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
          }`}
        >
          {isSyncingAll ? (
            <>
              <Loader2 size={22} className="animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Download size={22} />
              Sincronizar Todas las Tablas
            </>
          )}
        </button>

        {lastGlobalSync && (
          <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
            <Clock size={12} />
            Última sincronización: {lastGlobalSync}
          </p>
        )}

        {/* Lista de Tablas */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FileText size={18} />
              Tablas de Airtable
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {tables.map((table, index) => (
              <div 
                key={table.airtableTable}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    table.status === 'success' ? 'bg-green-100 text-green-600' :
                    table.status === 'error' ? 'bg-red-100 text-red-600' :
                    table.status === 'syncing' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {table.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{table.name}</h4>
                    <p className="text-xs text-gray-400 font-mono">{table.airtableTable}</p>
                    {table.lastSync && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                        <CheckCircle size={12} />
                        {table.lastSync} • <strong>{table.recordCount}</strong> registros
                      </p>
                    )}
                    {table.error && (
                      <p className="text-xs text-red-500 mt-1">{table.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(table.status)}
                  <button
                    onClick={() => syncTable(index)}
                    disabled={table.status === 'syncing' || !isConnected}
                    className={`p-2 rounded-xl transition ${
                      table.status === 'syncing' || !isConnected
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-indigo-500 hover:bg-indigo-50'
                    }`}
                  >
                    <RefreshCw size={18} className={table.status === 'syncing' ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información de Caché */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <HardDrive size={22} className="text-gray-500" />
              <div>
                <h3 className="font-bold text-gray-800">Caché Local</h3>
                <p className="text-xs text-gray-500">Datos guardados en el navegador</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gray-800">{cacheInfo.items}</p>
              <p className="text-xs text-gray-500">Items guardados</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gray-800">{cacheInfo.size} KB</p>
              <p className="text-xs text-gray-500">Tamaño aprox.</p>
            </div>
          </div>
          
          <button
            onClick={handleClearCache}
            className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition"
          >
            <Trash2 size={18} />
            Limpiar Caché Local
          </button>
        </div>

        {/* Información de Configuración */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-5 text-white">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Server size={18} />
            Configuración Actual
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Base ID:</span>
              <span className="font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                {import.meta.env.VITE_AIRTABLE_BASE_ID 
                  ? `${String(import.meta.env.VITE_AIRTABLE_BASE_ID).slice(0, 10)}...` 
                  : '❌ No configurado'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">API Key:</span>
              <span className="font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                {import.meta.env.VITE_AIRTABLE_API_KEY 
                  ? `${String(import.meta.env.VITE_AIRTABLE_API_KEY).slice(0, 12)}...` 
                  : '❌ No configurado'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Tablas:</span>
              <span className="text-emerald-400 font-bold">{Object.keys(airtableService.tables).length} configuradas</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Fuente de datos:</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap size={14} />
                Airtable Directo
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminBackend;
