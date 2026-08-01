/**
 * AdminFinanzas — Cuentas por cobrar (clientes) y por pagar (proveedores)
 * GuanaGO Super Admin
 *
 * Tablas: Reservas_grupo, Pago_proveedores, Pagos (reusada para abonos de cliente)
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, Loader2, Plus, X, ChevronDown, ChevronUp, Wallet, Building2,
  TrendingUp, TrendingDown, Users, Bed, Pencil, Trash2, ArrowUpDown, UserCheck,
} from 'lucide-react';
import { AppRoute } from '../../types';
import {
  getFinanzas, createReservaGrupo, updateReservaGrupo, deleteReservaGrupo,
  createPagoProveedor, updatePagoProveedor, deletePagoProveedor,
  createAbonoCliente, updateAbonoCliente, deleteAbonoCliente,
  getComisionesReferidos, createComisionReferido, updateComisionReferido, deleteComisionReferido,
  ReservaGrupo, AbonoClienteItem, PagoProveedorItem, ComisionReferido,
} from '../../services/financeService';

const fmtCOP = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;
const fmtFecha = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

type OrdenTipo = 'fecha' | 'alfabetico' | 'saldoCliente' | 'saldoOperador';
type TabTipo = 'reservas' | 'comisiones';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

export default function AdminFinanzas({ onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [reservas, setReservas] = useState<ReservaGrupo[]>([]);
  const [abonos, setAbonos] = useState<AbonoClienteItem[]>([]);
  const [pagosProv, setPagosProv] = useState<PagoProveedorItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orden, setOrden] = useState<OrdenTipo>('fecha');
  const [modalNueva, setModalNueva] = useState(false);
  const [modalEditar, setModalEditar] = useState<ReservaGrupo | null>(null);
  const [modalAbono, setModalAbono] = useState<ReservaGrupo | null>(null);
  const [modalPagoProv, setModalPagoProv] = useState<ReservaGrupo | null>(null);

  const [tab, setTab] = useState<TabTipo>('reservas');
  const [comisiones, setComisiones] = useState<ComisionReferido[]>([]);
  const [filtroOrganizador, setFiltroOrganizador] = useState<string>('todos');
  const [modalComision, setModalComision] = useState<ComisionReferido | 'nueva' | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [data, comisionesData] = await Promise.all([getFinanzas(), getComisionesReferidos()]);
      setReservas(data.reservas);
      setAbonos(data.abonosClientes);
      setPagosProv(data.pagosProveedores);
      setComisiones(comisionesData);
    } catch (e) {
      console.error('[AdminFinanzas] Error cargando:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const reservasOrdenadas = useMemo(() => {
    const copia = [...reservas];
    switch (orden) {
      case 'alfabetico': return copia.sort((a, b) => (a.cliente || '').localeCompare(b.cliente || ''));
      case 'saldoCliente': return copia.sort((a, b) => b.saldoCliente - a.saldoCliente);
      case 'saldoOperador': return copia.sort((a, b) => b.saldoOperador - a.saldoOperador);
      case 'fecha':
      default: return copia.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    }
  }, [reservas, orden]);

  const handleEliminarReserva = async (r: ReservaGrupo) => {
    if (!confirm(`¿Eliminar la reserva de ${r.cliente} — ${r.hotel}? Esto no borra los abonos/pagos ya registrados, solo la reserva.`)) return;
    try { await deleteReservaGrupo(r.id); setModalEditar(null); cargar(); } catch (e) { alert('Error: ' + e); }
  };

  const handleEliminarAbono = async (a: AbonoClienteItem) => {
    if (!confirm(`¿Eliminar este abono de ${fmtCOP(a.monto)}?`)) return;
    try { await deleteAbonoCliente(a.id); cargar(); } catch (e) { alert('Error: ' + e); }
  };

  const handleEliminarPagoProv = async (p: PagoProveedorItem) => {
    if (!confirm(`¿Eliminar este pago de ${fmtCOP(p.montoPagado)}?`)) return;
    try { await deletePagoProveedor(p.id); cargar(); } catch (e) { alert('Error: ' + e); }
  };

  const handleEditarMontoAbono = async (a: AbonoClienteItem) => {
    const nuevo = prompt('Nuevo monto del abono:', String(a.monto));
    if (nuevo === null) return;
    const monto = parseFloat(nuevo);
    if (!monto || monto <= 0) { alert('Monto inválido'); return; }
    try { await updateAbonoCliente(a.id, { monto }); cargar(); } catch (e) { alert('Error: ' + e); }
  };

  const handleEditarMontoPagoProv = async (p: PagoProveedorItem) => {
    const nuevo = prompt('Nuevo monto del pago:', String(p.montoPagado));
    if (nuevo === null) return;
    const monto = parseFloat(nuevo);
    if (!monto || monto <= 0) { alert('Monto inválido'); return; }
    try { await updatePagoProveedor(p.id, { montoPagado: monto }); cargar(); } catch (e) { alert('Error: ' + e); }
  };

  const totalPorCobrar = reservas.reduce((s, r) => s + Math.max(0, r.saldoCliente), 0);
  const totalPorPagar = reservas.reduce((s, r) => s + Math.max(0, r.saldoOperador), 0);
  const totalMargen = reservas.reduce((s, r) => s + (r.comisionGuia || (r.totalReservaFinal - r.totalOperador)), 0);

  const organizadores = useMemo(() => {
    const set = new Set(comisiones.map(c => c.organizador).filter(Boolean));
    return Array.from(set);
  }, [comisiones]);

  const comisionesFiltradas = useMemo(() => {
    return filtroOrganizador === 'todos' ? comisiones : comisiones.filter(c => c.organizador === filtroOrganizador);
  }, [comisiones, filtroOrganizador]);

  const totalComisionesReferidos = comisionesFiltradas.reduce((s, c) => s + c.montoComision, 0);

  const handleEliminarComision = async (c: ComisionReferido) => {
    if (!confirm(`¿Eliminar la comisión de ${c.clienteReferido}?`)) return;
    try { await deleteComisionReferido(c.id); setModalComision(null); cargar(); } catch (e) { alert('Error: ' + e); }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2"><Wallet size={18} className="text-emerald-400" /> Finanzas</h1>
            <p className="text-[11px] text-gray-500">Cuentas por cobrar y por pagar</p>
          </div>
        </div>
        <button
          onClick={() => tab === 'reservas' ? setModalNueva(true) : setModalComision('nueva')}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-xl text-xs font-bold"
        >
          <Plus size={14} /> {tab === 'reservas' ? 'Reserva' : 'Comisión'}
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 mx-4 mt-3 bg-gray-900 p-1 rounded-xl border border-gray-800">
        <button
          onClick={() => setTab('reservas')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'reservas' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}
        >
          Reservas
        </button>
        <button
          onClick={() => setTab('comisiones')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${tab === 'comisiones' ? 'bg-emerald-600 text-white' : 'text-gray-400'}`}
        >
          <UserCheck size={13} /> Comisiones de Referidos
        </button>
      </div>

      {tab === 'reservas' ? (
      <>
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1"><TrendingUp size={12} className="text-cyan-400" /> Por cobrar</div>
          <p className="text-sm font-bold text-cyan-400">{fmtCOP(totalPorCobrar)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1"><TrendingDown size={12} className="text-red-400" /> Por pagar</div>
          <p className="text-sm font-bold text-red-400">{fmtCOP(totalPorPagar)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1"><Wallet size={12} className="text-emerald-400" /> Margen total</div>
          <p className="text-sm font-bold text-emerald-400">{fmtCOP(totalMargen)}</p>
        </div>
      </div>

      {/* Orden */}
      <div className="px-4 pt-4 flex items-center gap-2">
        <ArrowUpDown size={13} className="text-gray-500" />
        <span className="text-[11px] text-gray-500">Ordenar:</span>
        <div className="flex gap-1.5 flex-wrap">
          {([
            ['fecha', 'Fecha'], ['alfabetico', 'A-Z'],
            ['saldoCliente', 'Saldo cliente'], ['saldoOperador', 'Saldo operador'],
          ] as [OrdenTipo, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setOrden(val)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                orden === val ? 'bg-emerald-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de reservas */}
      <div className="px-4 pt-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-600" size={28} /></div>
        ) : reservasOrdenadas.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm">No hay reservas de grupo todavía.</div>
        ) : reservasOrdenadas.map(r => {
          const abonosReserva = abonos.filter(a => a.referencia === r.clienteHotel);
          const pagosReserva = pagosProv.filter(p => p.reservaGrupo === r.clienteHotel);
          return (
          <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="w-full text-left px-4 py-3 flex items-center justify-between gap-3">
              <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="flex-1 min-w-0 text-left flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{r.cliente || r.clienteHotel}</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-2">
                    <Building2 size={11} /> {r.hotel}
                    {r.totalPax > 0 && <><Users size={11} /> {r.totalPax} pax</>}
                    {r.fecha && <span className="text-gray-600">· {fmtFecha(r.fecha)}</span>}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className={`text-xs font-bold ${r.saldoCliente > 0 ? 'text-cyan-400' : 'text-gray-600'}`}>{fmtCOP(r.saldoCliente)}</p>
                  <p className="text-[9px] text-gray-600">saldo cliente</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${r.saldoOperador > 0 ? 'text-red-400' : 'text-gray-600'}`}>{fmtCOP(r.saldoOperador)}</p>
                  <p className="text-[9px] text-gray-600">saldo operador</p>
                </div>
                <button onClick={() => setModalEditar(r)} className="p-1.5 text-gray-500 hover:text-white" title="Editar reserva">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                  {expandedId === r.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </button>
              </div>
            </div>

            {expandedId === r.id && (
              <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
                {r.habitaciones && r.habitaciones.length > 0 && (
                  <p className="text-[11px] text-gray-400 flex items-start gap-1.5"><Bed size={12} className="mt-0.5 shrink-0" /> {r.habitaciones.join(', ')}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-950/60 rounded-lg p-2.5">
                    <p className="text-[10px] text-gray-500 mb-1.5 font-bold uppercase">Cliente</p>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-gray-500">Total reserva</span><span>{fmtCOP(r.totalReservaFinal)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Abonado</span><span className="text-emerald-400">{fmtCOP(r.abonadoCliente)}</span></div>
                      {r.comisionExtra > 0 && (
                        <div className="flex justify-between"><span className="text-gray-500">Descuento cliente frecuente</span><span className="text-emerald-400">{fmtCOP(r.comisionExtra)}</span></div>
                      )}
                      <div className="flex justify-between font-bold"><span>Saldo</span><span className={r.saldoCliente > 0 ? 'text-cyan-400' : 'text-gray-600'}>{fmtCOP(r.saldoCliente)}</span></div>
                    </div>

                    {abonosReserva.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-gray-800 pt-2">
                        {abonosReserva.map(a => (
                          <div key={a.id} className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>{fmtFecha(a.fechaPago)} · {a.metodoPago || 'Sin método'}</span>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleEditarMontoAbono(a)} className="hover:text-white font-bold">{fmtCOP(a.monto)}</button>
                              <button onClick={() => handleEliminarAbono(a)} className="text-red-500/70 hover:text-red-400"><Trash2 size={11} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setModalAbono(r)}
                      className="w-full mt-2 py-1.5 bg-cyan-900/40 hover:bg-cyan-900/70 border border-cyan-800 rounded-lg text-[10px] font-bold text-cyan-300"
                    >
                      + Registrar abono
                    </button>
                  </div>

                  <div className="bg-gray-950/60 rounded-lg p-2.5">
                    <p className="text-[10px] text-gray-500 mb-1.5 font-bold uppercase">Operador ({r.hotel})</p>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-gray-500">Total operador</span><span>{fmtCOP(r.totalOperador)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Pagado</span><span className="text-emerald-400">{fmtCOP(r.pagadoOperador)}</span></div>
                      <div className="flex justify-between font-bold"><span>Saldo</span><span className={r.saldoOperador > 0 ? 'text-red-400' : 'text-gray-600'}>{fmtCOP(r.saldoOperador)}</span></div>
                    </div>

                    {pagosReserva.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-gray-800 pt-2">
                        {pagosReserva.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>{fmtFecha(p.fechaPago)}</span>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleEditarMontoPagoProv(p)} className="hover:text-white font-bold">{fmtCOP(p.montoPagado)}</button>
                              <button onClick={() => handleEliminarPagoProv(p)} className="text-red-500/70 hover:text-red-400"><Trash2 size={11} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setModalPagoProv(r)}
                      className="w-full mt-2 py-1.5 bg-red-900/30 hover:bg-red-900/60 border border-red-900 rounded-lg text-[10px] font-bold text-red-300"
                    >
                      + Registrar pago
                    </button>
                  </div>
                </div>

                {r.comisionGuia > 0 && (
                  <p className="text-[11px] text-gray-500">Comisión guía: <span className="text-emerald-400 font-bold">{fmtCOP(r.comisionGuia)}</span></p>
                )}
                {r.notas && <p className="text-[11px] text-gray-500 italic">{r.notas}</p>}
              </div>
            )}
          </div>
          );
        })}
      </div>
      </>
      ) : (
      <>
      {/* Resumen comisiones */}
      <div className="px-4 pt-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1"><UserCheck size={12} className="text-amber-400" /> Total comisiones {filtroOrganizador !== 'todos' ? `— ${filtroOrganizador}` : ''}</div>
          <p className="text-lg font-bold text-amber-400">{fmtCOP(totalComisionesReferidos)}</p>
        </div>

        {organizadores.length > 1 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            <button
              onClick={() => setFiltroOrganizador('todos')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${filtroOrganizador === 'todos' ? 'bg-amber-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400'}`}
            >
              Todos
            </button>
            {organizadores.map(org => (
              <button
                key={org}
                onClick={() => setFiltroOrganizador(org)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${filtroOrganizador === org ? 'bg-amber-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400'}`}
              >
                {org}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-600" size={28} /></div>
        ) : comisionesFiltradas.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm">Sin comisiones registradas todavía.</div>
        ) : comisionesFiltradas.map(c => (
          <button
            key={c.id}
            onClick={() => setModalComision(c)}
            className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{c.clienteReferido}</p>
              <p className="text-[11px] text-gray-500 truncate">
                {c.organizador} {c.cotizacionNombre && `· ${c.cotizacionNombre}`}
              </p>
              <p className={`text-[10px] mt-0.5 inline-block px-1.5 py-0.5 rounded-full ${
                c.estado === 'Pagado' ? 'bg-emerald-900/40 text-emerald-400' :
                c.estado === 'Confirmado' ? 'bg-cyan-900/40 text-cyan-400' :
                'bg-gray-800 text-gray-400'
              }`}>{c.estado || 'Sin estado'}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-amber-400">{fmtCOP(c.montoComision)}</p>
              <p className="text-[9px] text-gray-600">{c.porcentaje}% de {fmtCOP(c.valorReserva)}</p>
            </div>
          </button>
        ))}
      </div>
      </>
      )}
      {modalNueva && <ModalNuevaReserva onClose={() => setModalNueva(false)} onSaved={() => { setModalNueva(false); cargar(); }} />}
      {modalComision && (
        <ModalComision
          comision={modalComision === 'nueva' ? undefined : modalComision}
          organizadorSugerido={filtroOrganizador !== 'todos' ? filtroOrganizador : (organizadores[0] || '')}
          onClose={() => setModalComision(null)}
          onSaved={() => { setModalComision(null); cargar(); }}
          onDelete={modalComision !== 'nueva' ? () => handleEliminarComision(modalComision) : undefined}
        />
      )}
      {modalEditar && (
        <ModalNuevaReserva
          reserva={modalEditar}
          onClose={() => setModalEditar(null)}
          onSaved={() => { setModalEditar(null); cargar(); }}
          onDelete={() => handleEliminarReserva(modalEditar)}
        />
      )}
      {modalAbono && <ModalAbono reserva={modalAbono} onClose={() => setModalAbono(null)} onSaved={() => { setModalAbono(null); cargar(); }} />}
      {modalPagoProv && <ModalPagoProveedor reserva={modalPagoProv} onClose={() => setModalPagoProv(null)} onSaved={() => { setModalPagoProv(null); cargar(); }} />}
    </div>
  );
}

// ─── Modal: Nueva reserva de grupo ─────────────────────────────────────────────

function ModalNuevaReserva({ reserva, onClose, onSaved, onDelete }: { reserva?: ReservaGrupo; onClose: () => void; onSaved: () => void; onDelete?: () => void }) {
  const esEdicion = !!reserva;
  const [form, setForm] = useState({
    cliente: reserva?.cliente || '',
    hotel: reserva?.hotel || '',
    habitaciones: reserva?.habitaciones?.join(', ') || '',
    totalPax: reserva ? String(reserva.totalPax) : '',
    fecha: reserva?.fecha || '',
    totalReservaInicial: reserva ? String(reserva.totalReservaInicial) : '',
    nochesAdicionales: reserva ? String(reserva.nochesAdicionales) : '0',
    costoNocheAdicional: reserva ? String(reserva.costoNocheAdicional) : '0',
    comisionExtra: reserva ? String(reserva.comisionExtra) : '0',
    totalOperador: reserva ? String(reserva.totalOperador) : '',
    comisionGuia: reserva ? String(reserva.comisionGuia) : '',
    notas: reserva?.notas || '',
  });
  const [saving, setSaving] = useState(false);

  const totalReservaFinal = (parseFloat(form.totalReservaInicial) || 0) + (parseFloat(form.costoNocheAdicional) || 0);

  const handleSave = async () => {
    if (!form.cliente.trim() || !form.hotel.trim()) { alert('Cliente y Hotel son obligatorios'); return; }
    setSaving(true);
    try {
      const payload = {
        cliente: form.cliente.trim(),
        hotel: form.hotel.trim(),
        habitaciones: form.habitaciones.split(',').map(h => h.trim()).filter(Boolean),
        totalPax: parseInt(form.totalPax) || 0,
        fecha: form.fecha,
        totalReservaInicial: parseFloat(form.totalReservaInicial) || 0,
        nochesAdicionales: parseFloat(form.nochesAdicionales) || 0,
        costoNocheAdicional: parseFloat(form.costoNocheAdicional) || 0,
        comisionExtra: parseFloat(form.comisionExtra) || 0,
        totalReservaFinal,
        totalOperador: parseFloat(form.totalOperador) || 0,
        comisionGuia: parseFloat(form.comisionGuia) || 0,
        notas: form.notas,
      };
      if (esEdicion && reserva) {
        await updateReservaGrupo(reserva.id, payload);
      } else {
        await createReservaGrupo(payload);
      }
      onSaved();
    } catch (e) {
      alert('Error guardando: ' + e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm max-h-[90dvh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0 gap-2">
          <h2 className="font-bold text-white">{esEdicion ? 'Editar Reserva' : 'Nueva Reserva de Grupo'}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} {esEdicion ? 'Guardar' : 'Crear'}
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700"><X size={13} /></button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          <Campo label="Cliente *"><input value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} placeholder="FERNANDO ESPINOSA" className="input" /></Campo>
          <Campo label="Hotel *"><input value={form.hotel} onChange={e => setForm({ ...form, hotel: e.target.value })} placeholder="LIMSOR B" className="input" /></Campo>
          <Campo label="Habitaciones (separadas por coma)"><input value={form.habitaciones} onChange={e => setForm({ ...form, habitaciones: e.target.value })} placeholder="APT209 x9, APT214 x6" className="input" /></Campo>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Total Pax"><input type="number" value={form.totalPax} onChange={e => setForm({ ...form, totalPax: e.target.value })} className="input" /></Campo>
            <Campo label="Fecha"><input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="input" /></Campo>
          </div>
          <Campo label="Total Reserva Inicial (lo que paga el cliente)"><input type="number" value={form.totalReservaInicial} onChange={e => setForm({ ...form, totalReservaInicial: e.target.value })} className="input" /></Campo>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Pax que tomaron noche extra (informativo)"><input type="number" value={form.nochesAdicionales} onChange={e => setForm({ ...form, nochesAdicionales: e.target.value })} className="input" /></Campo>
            <Campo label="Costo noche extra (monto TOTAL, no por persona)"><input type="number" value={form.costoNocheAdicional} onChange={e => setForm({ ...form, costoNocheAdicional: e.target.value })} className="input" /></Campo>
          </div>
          <Campo label="Comisión extra (descuento a cliente recurrente)"><input type="number" value={form.comisionExtra} onChange={e => setForm({ ...form, comisionExtra: e.target.value })} className="input" /></Campo>
          {totalReservaFinal > 0 && <p className="text-[11px] text-emerald-400">Total reserva final: {fmtCOP(totalReservaFinal)}</p>}
          <Campo label="Total Operador (lo que se le debe al hotel)"><input type="number" value={form.totalOperador} onChange={e => setForm({ ...form, totalOperador: e.target.value })} className="input" /></Campo>
          <Campo label="Comisión guía (tu margen)"><input type="number" value={form.comisionGuia} onChange={e => setForm({ ...form, comisionGuia: e.target.value })} className="input" /></Campo>
          <Campo label="Notas"><textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} className="input" /></Campo>

          {esEdicion && onDelete && (
            <button
              onClick={onDelete}
              className="w-full py-2 mt-2 border border-red-900 text-red-400 hover:bg-red-950/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Trash2 size={13} /> Eliminar esta reserva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Registrar abono de cliente ─────────────────────────────────────────

function ModalAbono({ reserva, onClose, onSaved }: { reserva: ReservaGrupo; onClose: () => void; onSaved: () => void }) {
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('Bre-B');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!parseFloat(monto)) { alert('Ingresa un monto'); return; }
    setSaving(true);
    try {
      await createAbonoCliente({ referencia: reserva.clienteHotel, monto: parseFloat(monto), metodoPago: metodo, fechaPago: fecha });
      onSaved();
    } catch (e) {
      alert('Error: ' + e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm max-h-[90dvh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0 gap-2">
          <div className="min-w-0">
            <h2 className="font-bold text-white truncate">Abono — {reserva.cliente}</h2>
            <p className="text-[11px] text-gray-500">Saldo actual: {fmtCOP(reserva.saldoCliente)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Guardar
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700"><X size={13} /></button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          <Campo label="Monto"><input type="number" value={monto} onChange={e => setMonto(e.target.value)} autoFocus className="input" /></Campo>
          <Campo label="Método de pago">
            <select value={metodo} onChange={e => setMetodo(e.target.value)} className="input">
              <option>Bre-B</option><option>Wompi</option><option>Efectivo</option><option>Transferencia</option><option>Otro</option>
            </select>
          </Campo>
          <Campo label="Fecha"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input" /></Campo>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Registrar pago a proveedor ─────────────────────────────────────────

function ModalPagoProveedor({ reserva, onClose, onSaved }: { reserva: ReservaGrupo; onClose: () => void; onSaved: () => void }) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!parseFloat(monto)) { alert('Ingresa un monto'); return; }
    setSaving(true);
    try {
      await createPagoProveedor({ proveedor: reserva.hotel, reservaGrupo: reserva.clienteHotel, fechaPago: fecha, montoPagado: parseFloat(monto), notas });
      onSaved();
    } catch (e) {
      alert('Error: ' + e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm max-h-[90dvh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0 gap-2">
          <div className="min-w-0">
            <h2 className="font-bold text-white truncate">Pago a {reserva.hotel}</h2>
            <p className="text-[11px] text-gray-500">Saldo actual: {fmtCOP(reserva.saldoOperador)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Guardar
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700"><X size={13} /></button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          <Campo label="Monto"><input type="number" value={monto} onChange={e => setMonto(e.target.value)} autoFocus className="input" /></Campo>
          <Campo label="Fecha"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input" /></Campo>
          <Campo label="Notas"><textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} className="input" /></Campo>
        </div>
      </div>
    </div>
  );
}

// ─── Helper de formulario ───────────────────────────────────────────────────────

// ─── Modal: Comisión de referido ───────────────────────────────────────────────

function ModalComision({ comision, organizadorSugerido, onClose, onSaved, onDelete }: {
  comision?: ComisionReferido; organizadorSugerido?: string; onClose: () => void; onSaved: () => void; onDelete?: () => void;
}) {
  const esEdicion = !!comision;
  const [form, setForm] = useState({
    organizador: comision?.organizador || organizadorSugerido || '',
    clienteReferido: comision?.clienteReferido || '',
    cotizacionNombre: comision?.cotizacionNombre || '',
    valorReserva: comision ? String(comision.valorReserva) : '',
    porcentaje: comision ? String(comision.porcentaje) : '5',
    estado: comision?.estado || 'Pendiente confirmar opcion',
    notas: comision?.notas || '',
  });
  const [saving, setSaving] = useState(false);

  const montoComision = (parseFloat(form.valorReserva) || 0) * (parseFloat(form.porcentaje) || 0) / 100;

  const handleSave = async () => {
    if (!form.organizador.trim() || !form.clienteReferido.trim()) { alert('Organizador y Cliente referido son obligatorios'); return; }
    setSaving(true);
    try {
      const payload = {
        organizador: form.organizador.trim(),
        clienteReferido: form.clienteReferido.trim(),
        cotizacionNombre: form.cotizacionNombre.trim(),
        valorReserva: parseFloat(form.valorReserva) || 0,
        porcentaje: parseFloat(form.porcentaje) || 0,
        estado: form.estado,
        notas: form.notas,
      };
      if (esEdicion && comision) {
        await updateComisionReferido(comision.id, payload);
      } else {
        await createComisionReferido(payload);
      }
      onSaved();
    } catch (e) {
      alert('Error guardando: ' + e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm max-h-[90dvh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0 gap-2">
          <h2 className="font-bold text-white">{esEdicion ? 'Editar Comisión' : 'Nueva Comisión de Referido'}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} {esEdicion ? 'Guardar' : 'Crear'}
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700"><X size={13} /></button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          <Campo label="Organizador (quién refiere) *"><input value={form.organizador} onChange={e => setForm({ ...form, organizador: e.target.value })} placeholder="FERNANDO ESPINOSA" className="input" /></Campo>
          <Campo label="Cliente referido *"><input value={form.clienteReferido} onChange={e => setForm({ ...form, clienteReferido: e.target.value })} placeholder="Golden Voley" className="input" /></Campo>
          <Campo label="Nombre exacto de la cotización (CotizacionesGG)"><input value={form.cotizacionNombre} onChange={e => setForm({ ...form, cotizacionNombre: e.target.value })} placeholder="Golden Voley C.D Opcion 3" className="input" /></Campo>
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Valor de la reserva"><input type="number" value={form.valorReserva} onChange={e => setForm({ ...form, valorReserva: e.target.value })} className="input" /></Campo>
            <Campo label="% comisión"><input type="number" value={form.porcentaje} onChange={e => setForm({ ...form, porcentaje: e.target.value })} className="input" /></Campo>
          </div>
          {montoComision > 0 && <p className="text-[11px] text-amber-400">Comisión: {fmtCOP(montoComision)}</p>}
          <Campo label="Estado">
            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="input">
              <option value="Pendiente confirmar opcion">Pendiente confirmar opción</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Pagado">Pagado</option>
            </select>
          </Campo>
          <Campo label="Notas"><textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} className="input" /></Campo>

          {esEdicion && onDelete && (
            <button
              onClick={onDelete}
              className="w-full py-2 mt-2 border border-red-900 text-red-400 hover:bg-red-950/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Trash2 size={13} /> Eliminar esta comisión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">{label}</label>
      {children}
      <style>{`.input { width: 100%; padding: 0.55rem 0.75rem; background: #111827; border: 1px solid #374151; border-radius: 0.5rem; color: white; font-size: 0.8rem; } .input:focus { outline: none; border-color: #10b981; }`}</style>
    </div>
  );
}
