import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, Send, Trash2, Calendar, Users, DollarSign, Clock,
  CheckCircle2, AlertCircle, FileText, Search, Filter, User, Mail, Phone,
  Download, Eye, Loader2
} from 'lucide-react';
import { AppRoute, Cotizacion, CotizacionItem, Tour, QuoteStatus, QUOTE_STATUS_CONFIG } from '../../types';
import {
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  addCotizacionItem,
  updateCotizacion,
  deleteCotizacionItem,
  updateCotizacionItem,
  validateScheduleConflicts,
  validateCapacity,
  validateOperatingDay
} from '../../services/quotesService';
import { getServices } from '../../services/airtableService';
import { downloadQuotePDF, previewQuote } from '../../services/pdfService';

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
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  
  // Estados para edición de items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemData, setEditingItemData] = useState<Partial<CotizacionItem>>({});
  
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
    descuento: 0,
    notasInternas: ''
  });

  // Servicios disponibles filtrados
  const [searchService, setSearchService] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tour' | 'hotel' | 'taxi'>('all');

  useEffect(() => {
    loadCotizaciones();
    loadServices();
  }, []);

  // Recalcular el total cuando cambien los items
  useEffect(() => {
    if (selectedCotizacion && items.length > 0) {
      const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      console.log(`💰 Total recalculado desde items: $${calculatedTotal}`);
      if (selectedCotizacion.precioTotal !== calculatedTotal) {
        setSelectedCotizacion({
          ...selectedCotizacion,
          precioTotal: calculatedTotal
        });
      }
    }
  }, [items]);

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
    if (!selectedCotizacion) {
      alert('Por favor selecciona una cotización primero');
      return;
    }

    try {
      console.log('📋 Agregando servicio:', service.title, 'a cotización:', selectedCotizacion.id);

    // Extraer horarios del servicio
    const horarios = (service as any).schedule || (service as any).horario || '';
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

    // Validar día de operación - verificar si el servicio opera en ALGÚN día del rango
    // Por ahora, solo mostrar advertencia pero permitir agregar (el cliente seleccionará el día específico después)
    const diasOperacion = (service as any).operatingDays || (service as any).diasOperacion || '';
    if (diasOperacion && diasOperacion.length > 0) {
      // Verificar si el día específico está dentro del rango de fechas
      const startDate = new Date(selectedCotizacion.fechaInicio);
      const endDate = new Date(selectedCotizacion.fechaFin);
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      
      // Buscar si hay algún día en el rango donde el servicio opera
      let hasOperatingDayInRange = false;
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayName = dayNames[d.getDay()];
        if (diasOperacion.toLowerCase().includes(dayName.toLowerCase())) {
          hasOperatingDayInRange = true;
          break;
        }
      }
      
      if (!hasOperatingDayInRange) {
        const proceed = confirm(`⚠️ ${service.title} opera en: ${diasOperacion}\nNo hay coincidencia en el rango ${new Date(selectedCotizacion.fechaInicio).toLocaleDateString()} - ${new Date(selectedCotizacion.fechaFin).toLocaleDateString()}\n\n¿Agregar de todas formas?`);
        if (!proceed) return;
      }
    }

    const totalPersonas = formData.adultos + formData.ninos + formData.bebes;
    // Solo adultos y niños pagan; bebés no pagan
    const payingPeople = formData.adultos + formData.ninos;
    const precio = service.price || (service as any).precio || 0;
    
    // LÓGICA ESPECIAL PARA ALOJAMIENTOS
    let subtotal = 0;
    let fechaFin: string | undefined = undefined;
    
    const isHotel = (service.category || (service as any).tipo) === 'hotel';
    
    if (isHotel) {
      // Para hoteles: calcular número de noches
      const startDate = new Date(selectedCotizacion.fechaInicio);
      const endDate = new Date(selectedCotizacion.fechaFin);
      // Las noches son desde check-in hasta check-out (no incluye la noche de check-out)
      const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      // El precio del hotel NO se multiplica por pax (ya incluye el número de huéspedes)
      subtotal = precio * Math.max(1, nights);
      fechaFin = selectedCotizacion.fechaFin;
      
      console.log(`🏨 Hotel: ${nights} noches × $${precio} = $${subtotal}`);
    } else {
      // Para tours y otros servicios: multiplicar por personas
      subtotal = precio * payingPeople;
      console.log(`🎫 ${service.category || 'Servicio'}: ${payingPeople} pax × $${precio} = $${subtotal}`);
    }

    const newItem: Omit<CotizacionItem, 'id'> = {
      cotizacionId: selectedCotizacion.id,
      servicioId: service.id,
      servicioNombre: service.title || (service as any).nombre,
      servicioTipo: (service.category || (service as any).tipo) as 'tour' | 'hotel' | 'taxi' | 'package',
      fecha: selectedCotizacion.fechaInicio,
      fechaFin: fechaFin,
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

    console.log('📦 Enviando item a Airtable:', newItem);

    const created = await addCotizacionItem(newItem);
    if (created) {
      const updatedItems = [...items, created];
      setItems(updatedItems);
      
      // Actualizar precio total sumando todos los items
      const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      console.log(`💰 Nuevo total de cotización: $${newTotal}`);
      await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
      
      // Recargar cotización
      const updated = await getCotizacionById(selectedCotizacion.id);
      if (updated) {
        setSelectedCotizacion(updated);
        setItems(updated.items || []);
      }
      // Sin alerta - el servicio se visualiza automáticamente en la sección de servicios incluidos
    } else {
      alert('❌ Error al agregar el servicio');
    }
    } catch (error) {
      console.error('❌ Error en handleAddService:', error);
      alert('❌ Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const success = await deleteCotizacionItem(itemId);
    if (success) {
      const newItems = items.filter(i => i.id !== itemId);
      setItems(newItems);
      
      // Actualizar precio total sumando todos los items restantes
      if (selectedCotizacion) {
        const newTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        console.log(`💰 Nuevo total después de eliminar: $${newTotal}`);
        await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });
        
        const updated = await getCotizacionById(selectedCotizacion.id);
        if (updated) {
          setSelectedCotizacion(updated);
          setItems(updated.items || []);
        }
      }
    }
  };

  const handleStartEditItem = (item: CotizacionItem) => {
    setEditingItemId(item.id);
    setEditingItemData({
      ...item,
      precioEditado: item.precioEditado || item.precioUnitario
    });
  };

  const handleSaveEditItem = async (itemId: string) => {
    if (!editingItemData || !selectedCotizacion) return;

    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const currentItem = items[itemIndex];
    
    // Calcular nuevo subtotal basado en cambios
    let newSubtotal = currentItem.subtotal;
    
    if (currentItem.servicioTipo === 'hotel') {
      // Para hoteles: el precio se aplica una sola vez (no se multiplica por pax)
      const startDate = new Date(editingItemData.fecha || currentItem.fecha);
      const endDate = new Date(editingItemData.fechaFin || currentItem.fechaFin || currentItem.fecha);
      const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const price = editingItemData.precioEditado || editingItemData.precioUnitario || currentItem.precioUnitario;
      newSubtotal = price * Math.max(1, nights);
    } else {
      // Para tours y otros: precio × personas
      const payingPeople = (editingItemData.adultos || currentItem.adultos) + (editingItemData.ninos || currentItem.ninos);
      const price = editingItemData.precioEditado || editingItemData.precioUnitario || currentItem.precioUnitario;
      newSubtotal = price * payingPeople;
    }

    const updatedItem: CotizacionItem = {
      ...currentItem,
      ...editingItemData,
      precioUnitario: editingItemData.precioEditado ? currentItem.precioUnitario : editingItemData.precioUnitario || currentItem.precioUnitario,
      precioEditado: editingItemData.precioEditado,
      subtotal: newSubtotal
    };

    // Guardar en Airtable
    const saved = await updateCotizacionItem(itemId, updatedItem);
    if (!saved) {
      alert('❌ Error al guardar el item');
      return;
    }

    const updatedItems = [...items];
    updatedItems[itemIndex] = updatedItem;
    setItems(updatedItems);

    // Actualizar precio total
    const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    await updateCotizacion(selectedCotizacion.id, { precioTotal: newTotal });

    setEditingItemId(null);
    setEditingItemData({});
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemData({});
  };

  const handleSendQuote = async () => {
    if (!selectedCotizacion) return;
    
    await updateCotizacion(selectedCotizacion.id, { estado: 'enviada' });
    alert('✅ Cotización enviada al cliente');
    loadCotizaciones();
    setView('list');
  };

  const handleDownloadPDF = async () => {
    if (!selectedCotizacion) return;
    
    setGeneratingPDF(true);
    try {
      await downloadQuotePDF(selectedCotizacion, items);
      alert('✅ PDF descargado exitosamente');
    } catch (error) {
      alert('❌ Error generando PDF. Inténtalo de nuevo.');
      console.error(error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handlePreview = () => {
    if (!selectedCotizacion) return;
    previewQuote(selectedCotizacion, items);
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
                const statusConfig = QUOTE_STATUS_CONFIG[cot.estado] || QUOTE_STATUS_CONFIG['Draft'];
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
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium"
              >
                <Eye className="w-5 h-5" />
                Preview
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Descargar PDF
                  </>
                )}
              </button>
              <button
                onClick={handleSendQuote}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
              >
                <Send className="w-5 h-5" />
                Enviar
              </button>
            </div>
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
                        {editingItemId === item.id ? (
                          // MODO EDICIÓN
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-400 mb-2">Fecha Inicio</label>
                              <input
                                type="date"
                                value={editingItemData.fecha || ''}
                                onChange={(e) => setEditingItemData({ ...editingItemData, fecha: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                              />
                            </div>
                            
                            {item.servicioTipo === 'hotel' && (
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-2">Fecha Fin</label>
                                <input
                                  type="date"
                                  value={editingItemData.fechaFin || item.fechaFin || ''}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, fechaFin: e.target.value })}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Adultos</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingItemData.adultos || 0}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, adultos: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Niños</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingItemData.ninos || 0}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, ninos: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Bebés</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingItemData.bebes || 0}
                                  onChange={(e) => setEditingItemData({ ...editingItemData, bebes: parseInt(e.target.value) || 0 })}
                                  className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-400 mb-2">Precio (Editar si aplica descuento)</label>
                              <input
                                type="number"
                                value={editingItemData.precioEditado || editingItemData.precioUnitario || 0}
                                onChange={(e) => setEditingItemData({ ...editingItemData, precioEditado: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEditItem(item.id)}
                                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-semibold transition-colors"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={handleCancelEditItem}
                                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-semibold transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          // MODO VISUALIZACIÓN
                          <div className="flex items-start justify-between">
                            <div className="flex-1 cursor-pointer" onClick={() => handleStartEditItem(item)}>
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
                                  {item.servicioTipo === 'hotel' && item.fechaFin && (
                                    <>
                                      {' - '}
                                      {new Date(item.fechaFin).toLocaleDateString()}
                                    </>
                                  )}
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
                              <div className="mt-2 text-xs text-gray-500">Haz clic para editar fecha, pax o precio</div>
                            </div>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
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
                <div className="text-sm text-blue-100 mb-3">Resumen Financiero</div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-blue-100">Subtotal</span>
                    <span className="text-2xl font-bold text-white">${selectedCotizacion.precioTotal.toLocaleString('es-CO')}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-blue-400/30">
                    <label className="block text-xs text-blue-100 mb-2">Descuento (Opcional)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={selectedCotizacion.descuento || 0}
                        onChange={(e) => {
                          const newDescuento = parseFloat(e.target.value) || 0;
                          setSelectedCotizacion({
                            ...selectedCotizacion,
                            descuento: newDescuento
                          });
                        }}
                        onBlur={() => {
                          if (selectedCotizacion.descuento !== undefined) {
                            updateCotizacion(selectedCotizacion.id, { descuento: selectedCotizacion.descuento });
                          }
                        }}
                        placeholder="0"
                        className="flex-1 px-3 py-2 bg-blue-800/50 border border-blue-400 rounded text-white text-sm placeholder-blue-200"
                      />
                      <span className="flex items-center text-blue-100 text-sm">COP</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-blue-400/30">
                    <div className="flex justify-between items-baseline">
                      <span className="text-blue-100 font-semibold">Total Final</span>
                      <span className="text-3xl font-bold text-white">
                        ${(selectedCotizacion.precioTotal - (selectedCotizacion.descuento || 0)).toLocaleString('es-CO')}
                      </span>
                    </div>
                    {selectedCotizacion.descuento && selectedCotizacion.descuento > 0 && (
                      <div className="text-xs text-green-200 mt-1">
                        Descuento: ${selectedCotizacion.descuento.toLocaleString('es-CO')}
                      </div>
                    )}
                  </div>
                </div>
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
                  {(['all', 'tour', 'hotel', 'taxi'] as const).map(type => {
                    const labels: Record<string, string> = {
                      'all': 'Todos',
                      'tour': 'Tour',
                      'hotel': 'Alojamiento',
                      'taxi': 'Taxi'
                    };
                    return (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        filterType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {labels[type]}
                    </button>
                    );
                  })}
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
                          {service.tipoAlojamiento || service.category || service.tipo || 'Servicio'}
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
