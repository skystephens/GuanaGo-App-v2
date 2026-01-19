import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, Send, Trash2, Calendar, Users, DollarSign, Clock,
  CheckCircle2, AlertCircle, FileText, Search, Filter, User, Mail, Phone
} from 'lucide-react';
import { AppRoute, Cotizacion, CotizacionItem, Tour, QuoteStatus, QUOTE_STATUS_CONFIG } from '../../types';
import {
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  addCotizacionItem,
  updateCotizacion,
  deleteCotizacionItem,
  validateScheduleConflicts,
  validateCapacity,
  validateOperatingDay
} from '../../services/quotesService';
import { getServices } from '../../services/airtableService';

interface AdminQuotesProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const AdminQuotes: React.FC<AdminQuotesProps> = ({ onBack, onNavigate }) => {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [services, setServices] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  
  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fechaInicio: '',
    fechaFin: '',
    adultos: 2,
    ninos: 0,
    bebes: 0,
    notasInternas: ''
  });

  // Servicios disponibles filtrados
  const [searchService, setSearchService] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tour' | 'hotel' | 'taxi'>('all');

  useEffect(() => {
    loadCotizaciones();
    loadServices();
  }, []);

  const loadCotizaciones = async () => {
    setLoading(true);
    const data = await getCotizaciones();
    setCotizaciones(data);
    setLoading(false);
  };

  const loadServices = async () => {
    const data = await getServices();
    setServices(data);
  };

  const handleCreateCotizacion = async () => {
    if (!formData.nombre || !formData.fechaInicio || !formData.fechaFin) {
      alert('Completa todos los campos obligatorios');
      return;
    }

    const newCotizacion: Omit<Cotizacion, 'id'> = {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      adultos: formData.adultos,
      ninos: formData.ninos,
      bebes: formData.bebes,
      fechaCreacion: new Date().toISOString(),
      estado: 'draft',
      precioTotal: 0,
      notasInternas: formData.notasInternas
    };

    const created = await createCotizacion(newCotizacion);
    if (created) {
      setSelectedCotizacion(created);
      setView('detail');
      loadCotizaciones();
    }
  };

  const handleAddService = async (service: Tour) => {
    if (!selectedCotizacion) return;

    // Extraer horarios del servicio
    const horarios = service.schedule || service.horario || '';
    const horarioMatch = horarios.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    const horarioInicio = horarioMatch ? horarioMatch[1] : '';
    const horarioFin = horarioMatch ? horarioMatch[2] : '';

    // Validar horarios contra items existentes
    const validation = validateScheduleConflicts(
      {
        fecha: selectedCotizacion.fechaInicio,
        horarioInicio,
        horarioFin,
        servicioNombre: service.title
      } as Partial<CotizacionItem>,
      items
    );

    if (!validation.valid) {
      const proceed = confirm(`⚠️ Conflictos detectados:\n${validation.conflicts.join('\n')}\n\n¿Agregar de todas formas?`);
      if (!proceed) return;
    }

    // Validar capacidad
    const capacityCheck = validateCapacity(service, formData.adultos, formData.ninos, formData.bebes);
    if (!capacityCheck.valid) {
      alert(capacityCheck.message);
      return;
    }

    // Validar día de operación
    const dayCheck = validateOperatingDay(service, selectedCotizacion.fechaInicio);
    if (!dayCheck.valid) {
      alert(dayCheck.message);
      return;
    }

    const totalPersonas = formData.adultos + formData.ninos + formData.bebes;
    const precio = service.price || service.precio || 0;
    const subtotal = precio * totalPersonas;

    const newItem: Omit<CotizacionItem, 'id'> = {
      cotizacionId: selectedCotizacion.id,
      servicioId: service.id,
      servicioNombre: service.title || service.nombre,
      servicioTipo: (service.category || service.tipo) as 'tour' | 'hotel' | 'taxi' | 'package',
      fecha: selectedCotizacion.fechaInicio,
      horarioInicio,
      horarioFin,
      adultos: formData.adultos,
      ninos: formData.ninos,
      bebes: formData.bebes,
      precioUnitario: precio,
      subtotal,
      status: validation.valid ? 'disponible' : 'conflicto',
      conflictos: validation.conflicts
    };

    const created = await addCotizacionItem(newItem);
    if (created) {
      setItems([...items, created]);
      
      // Actualizar precio total
      const newTotal = items.reduce((sum, item) => sum + item.subtotal, 0) + subtotal;
      await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
      
      // Recargar cotización
      const updated = await getCotizacionById(selectedCotizacion.id);
      if (updated) {
        setSelectedCotizacion(updated);
        setItems(updated.items || []);
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Eliminar este servicio de la cotización?')) return;
    
    const success = await deleteCotizacionItem(itemId);
    if (success) {
      const newItems = items.filter(i => i.id !== itemId);
      setItems(newItems);
      
      // Actualizar precio total
      if (selectedCotizacion) {
        const newTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
        
        const updated = await getCotizacionById(selectedCotizacion.id);
        if (updated) setSelectedCotizacion(updated);
      }
    }
  };

  const handleSendQuote = async () => {
    if (!selectedCotizacion) return;
    
    await updateCotizacion(selectedCotizacion.id, { estado: 'enviada' });
    alert('✅ Cotización enviada al cliente');
    loadCotizaciones();
    setView('list');
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title?.toLowerCase().includes(searchService.toLowerCase()) ||
                         service.nombre?.toLowerCase().includes(searchService.toLowerCase());
    const matchesType = filterType === 'all' || service.category === filterType || service.tipo === filterType;
    return matchesSearch && matchesType;
  });

  // =========================================================
  // VISTA: LISTA DE COTIZACIONES
  // =========================================================
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">Cotizaciones</h1>
                <p className="text-gray-400">Gestiona cotizaciones para clientes</p>
              </div>
            </div>
            <button
              onClick={() => setView('create')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Nueva Cotización
            </button>
          </div>

          {/* Lista de cotizaciones */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-4">Cargando cotizaciones...</p>
              </div>
            ) : cotizaciones.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-xl">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay cotizaciones todavía</p>
                <button
                  onClick={() => setView('create')}
                  className="mt-4 text-blue-500 hover:text-blue-400"
                >
                  Crear primera cotización
                </button>
              </div>
            ) : (
              cotizaciones.map(cot => {
                const statusConfig = QUOTE_STATUS_CONFIG[cot.estado];
                return (
                  <div
                    key={cot.id}
                    onClick={async () => {
                      const full = await getCotizacionById(cot.id);
                      if (full) {
                        setSelectedCotizacion(full);
                        setItems(full.items || []);
                        setView('detail');
                      }
                    }}
                    className="bg-gray-900 p-6 rounded-xl cursor-pointer hover:bg-gray-800 transition-colors border border-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{cot.nombre}</h3>
                          <span className={`px-3 py-1 ${statusConfig.color} ${statusConfig.textColor} rounded-full text-sm font-medium`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(cot.fechaInicio).toLocaleDateString()} - {new Date(cot.fechaFin).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {cot.adultos + cot.ninos + cot.bebes} pax
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            ${cot.precioTotal.toLocaleString('es-CO')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VISTA: CREAR COTIZACIÓN
  // =========================================================
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('list')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Nueva Cotización</h1>
              <p className="text-gray-400">Información del cliente y fechas de viaje</p>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-gray-900 p-8 rounded-xl space-y-6">
            {/* Información del cliente */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Cliente
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Fechas de Viaje
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Fecha Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Fecha Fin *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pasajeros */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pasajeros
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Adultos (18-99 años)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.adultos}
                    onChange={(e) => setFormData({ ...formData, adultos: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Niños (4-18 años)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ninos}
                    onChange={(e) => setFormData({ ...formData, ninos: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Bebés (0-3 años)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bebes}
                    onChange={(e) => setFormData({ ...formData, bebes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Notas internas */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Notas Internas (opcional)
              </label>
              <textarea
                value={formData.notasInternas}
                onChange={(e) => setFormData({ ...formData, notasInternas: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Notas para referencia interna..."
              />
            </div>

            {/* Botón crear */}
            <button
              onClick={handleCreateCotizacion}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
            >
              Crear Cotización
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VISTA: DETALLE DE COTIZACIÓN
  // =========================================================
  if (view === 'detail' && selectedCotizacion) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">{selectedCotizacion.nombre}</h1>
                <p className="text-gray-400">
                  {new Date(selectedCotizacion.fechaInicio).toLocaleDateString()} - {new Date(selectedCotizacion.fechaFin).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleSendQuote}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              <Send className="w-5 h-5" />
              Enviar Cotización
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Info + Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información del cliente */}
              <div className="bg-gray-900 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Información del Cliente</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{selectedCotizacion.nombre}</span>
                  </div>
                  {selectedCotizacion.email && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{selectedCotizacion.email}</span>
                    </div>
                  )}
                  {selectedCotizacion.telefono && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{selectedCotizacion.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>
                      {selectedCotizacion.adultos} adultos, {selectedCotizacion.ninos} niños, {selectedCotizacion.bebes} bebés
                    </span>
                  </div>
                </div>
              </div>

              {/* Items de la cotización */}
              <div className="bg-gray-900 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Servicios Incluidos ({items.length})</h3>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                    <p>No hay servicios agregados</p>
                    <p className="text-sm">Agrega servicios desde el panel derecho</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border ${
                          item.status === 'conflicto' ? 'border-orange-600 bg-orange-950/20' : 'border-gray-800 bg-gray-950'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.servicioNombre}</h4>
                              <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs uppercase">
                                {item.servicioTipo}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(item.fecha).toLocaleDateString()}
                              </div>
                              {item.horarioInicio && item.horarioFin && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {item.horarioInicio} - {item.horarioFin}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {item.adultos + item.ninos + item.bebes} pax
                              </div>
                              <div className="flex items-center gap-1 font-semibold text-green-400">
                                <DollarSign className="w-4 h-4" />
                                ${item.subtotal.toLocaleString('es-CO')}
                              </div>
                            </div>
                            {item.conflictos && item.conflictos.length > 0 && (
                              <div className="mt-2 text-sm text-orange-400 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{item.conflictos[0]}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notas internas */}
              {selectedCotizacion.notasInternas && (
                <div className="bg-gray-900 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold mb-2">Notas Internas</h3>
                  <p className="text-gray-400">{selectedCotizacion.notasInternas}</p>
                </div>
              )}
            </div>

            {/* Columna derecha: Agregar servicios */}
            <div className="space-y-6">
              {/* Total */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl">
                <div className="text-sm text-blue-100 mb-1">Precio Total</div>
                <div className="text-4xl font-bold">${selectedCotizacion.precioTotal.toLocaleString('es-CO')}</div>
              </div>

              {/* Buscador de servicios */}
              <div className="bg-gray-900 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Agregar Servicios</h3>
                
                {/* Búsqueda */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchService}
                      onChange={(e) => setSearchService(e.target.value)}
                      placeholder="Buscar servicios..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex gap-2 mb-4">
                  {(['all', 'tour', 'hotel', 'taxi'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        filterType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {type === 'all' ? 'Todos' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Lista de servicios */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredServices.map(service => (
                    <div
                      key={service.id}
                      onClick={() => handleAddService(service)}
                      className="p-3 bg-gray-800 hover:bg-gray-750 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="font-medium text-sm">{service.title || service.nombre}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          {service.category || service.tipo}
                        </span>
                        <span className="text-sm font-semibold text-green-400">
                          ${(service.price || service.precio || 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredServices.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No se encontraron servicios
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AdminQuotes;
