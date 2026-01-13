import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Globe, 
  Zap,
  AlertTriangle,
  Clock,
  Users,
  MessageSquare,
  MapPin,
  Car,
  Calendar,
  Package
} from 'lucide-react';

interface EndpointStatus {
  name: string;
  path: string;
  status: 'checking' | 'online' | 'offline' | 'error';
  responseTime?: number;
  lastChecked?: string;
  data?: any;
  error?: string;
  icon: React.ReactNode;
}

const AdminBackend: React.FC = () => {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'Health Check', path: '/api/health', status: 'checking', icon: <Activity size={18} /> },
    { name: 'Auth / Webhook', path: '/api/auth/webhook', status: 'checking', icon: <Users size={18} /> },
    { name: 'Directory', path: '/api/directory', status: 'checking', icon: <MapPin size={18} /> },
    { name: 'Services', path: '/api/services', status: 'checking', icon: <Package size={18} /> },
    { name: 'Taxis', path: '/api/taxis', status: 'checking', icon: <Car size={18} /> },
    { name: 'Reservations', path: '/api/reservations', status: 'checking', icon: <Calendar size={18} /> },
    { name: 'Chatbot', path: '/api/chatbot', status: 'checking', icon: <MessageSquare size={18} /> },
  ]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<string | null>(null);

  const BASE_URL = window.location.origin;

  const checkEndpoint = async (endpoint: EndpointStatus): Promise<EndpointStatus> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.path.includes('webhook') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint.path.includes('webhook') 
          ? JSON.stringify({ test: true, source: 'admin-panel' })
          : undefined,
      });
      
      const responseTime = Date.now() - startTime;
      
      let data = null;
      try {
        data = await response.json();
      } catch {
        // Response might not be JSON
      }

      return {
        ...endpoint,
        status: response.ok ? 'online' : 'error',
        responseTime,
        lastChecked: new Date().toLocaleTimeString(),
        data,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        ...endpoint,
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toLocaleTimeString(),
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  };

  const checkAllEndpoints = async () => {
    setIsRefreshing(true);
    
    // Reset all to checking
    setEndpoints(prev => prev.map(ep => ({ ...ep, status: 'checking' as const })));
    
    // Check each endpoint
    const results = await Promise.all(endpoints.map(checkEndpoint));
    setEndpoints(results);
    setLastFullCheck(new Date().toLocaleString());
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkAllEndpoints();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkAllEndpoints, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'error': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-900/30 border-green-700';
      case 'offline': return 'bg-red-900/30 border-red-700';
      case 'error': return 'bg-yellow-900/30 border-yellow-700';
      default: return 'bg-gray-800 border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle size={18} className="text-green-500" />;
      case 'offline': return <XCircle size={18} className="text-red-500" />;
      case 'error': return <AlertTriangle size={18} className="text-yellow-500" />;
      default: return <RefreshCw size={18} className="text-gray-400 animate-spin" />;
    }
  };

  const onlineCount = endpoints.filter(ep => ep.status === 'online').length;
  const totalCount = endpoints.length;

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-gray-900">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Server size={24} className="text-purple-500" />
              Backend Monitor
            </h1>
            <p className="text-gray-400 text-sm mt-1">Estado de la API en tiempo real</p>
          </div>
          <button
            onClick={checkAllEndpoints}
            disabled={isRefreshing}
            className={`p-3 rounded-full transition-all ${
              isRefreshing 
                ? 'bg-gray-700 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* Server Info Card */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-700/50">
          <div className="flex items-center gap-4">
            <div className="bg-purple-600/30 p-4 rounded-xl">
              <Globe size={32} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">Servidor Backend</h3>
              <p className="text-purple-300 text-sm font-mono break-all">{BASE_URL}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-900/50 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${onlineCount === totalCount ? 'text-green-400' : 'text-yellow-400'}`}>
                {onlineCount}/{totalCount}
              </div>
              <p className="text-gray-400 text-xs mt-1">Endpoints Online</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {endpoints.filter(ep => ep.responseTime).reduce((sum, ep) => sum + (ep.responseTime || 0), 0) / 
                  Math.max(endpoints.filter(ep => ep.responseTime).length, 1) | 0}ms
              </div>
              <p className="text-gray-400 text-xs mt-1">Tiempo Promedio</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${onlineCount === totalCount ? 'text-green-400' : 'text-red-400'}`}>
                {onlineCount === totalCount ? '✓' : '!'}
              </div>
              <p className="text-gray-400 text-xs mt-1">{onlineCount === totalCount ? 'Healthy' : 'Issues'}</p>
            </div>
          </div>
        </div>

        {/* Last Check Info */}
        {lastFullCheck && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock size={14} />
            <span>Última verificación: {lastFullCheck}</span>
          </div>
        )}

        {/* Endpoints List */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Database size={18} className="text-blue-400" />
            Endpoints de API
          </h3>
          
          {endpoints.map((endpoint, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-4 border transition-all ${getStatusBg(endpoint.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-800 ${getStatusColor(endpoint.status)}`}>
                    {endpoint.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{endpoint.name}</h4>
                    <p className="text-gray-400 text-xs font-mono">{endpoint.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {endpoint.responseTime !== undefined && (
                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                      {endpoint.responseTime}ms
                    </span>
                  )}
                  {getStatusIcon(endpoint.status)}
                </div>
              </div>
              
              {/* Response Data */}
              {endpoint.status === 'online' && endpoint.data && (
                <div className="mt-3 bg-gray-900/50 rounded-lg p-3 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(endpoint.data, null, 2).substring(0, 200)}
                    {JSON.stringify(endpoint.data).length > 200 && '...'}
                  </pre>
                </div>
              )}
              
              {/* Error Message */}
              {(endpoint.status === 'offline' || endpoint.status === 'error') && endpoint.error && (
                <div className="mt-3 bg-red-900/30 rounded-lg p-3">
                  <p className="text-xs text-red-400">
                    <strong>Error:</strong> {endpoint.error}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Make Webhook Info */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={20} className="text-yellow-500" />
            <h3 className="font-bold">Webhook para Make (Escenario 1)</h3>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">URL del Webhook:</p>
            <code className="text-sm text-yellow-400 break-all">
              {BASE_URL}/api/auth/webhook
            </code>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-400">Método</p>
              <p className="text-sm font-bold text-blue-400">POST</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-400">Content-Type</p>
              <p className="text-sm font-bold text-blue-400">application/json</p>
            </div>
          </div>
          
          <div className="mt-4 bg-gray-900 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">Ejemplo de Payload:</p>
            <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
{`{
  "email": "usuario@ejemplo.com",
  "name": "Nombre Usuario",
  "source": "make-webhook"
}`}
            </pre>
          </div>
        </div>

        {/* Quick Test Button */}
        <button
          onClick={async () => {
            const testEndpoint = endpoints.find(ep => ep.path === '/api/auth/webhook');
            if (testEndpoint) {
              const result = await checkEndpoint(testEndpoint);
              setEndpoints(prev => prev.map(ep => 
                ep.path === '/api/auth/webhook' ? result : ep
              ));
              alert(result.status === 'online' 
                ? '✅ Webhook funcionando correctamente!' 
                : `❌ Error: ${result.error}`);
            }
          }}
          className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2"
        >
          <Zap size={20} />
          Probar Webhook Make
        </button>
      </div>
    </div>
  );
};

export default AdminBackend;
