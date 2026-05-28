// pages/admin/AdminTraduccion.tsx
// Centro de gestión de traducciones — ES → EN / PT
// Conectado a /api/translate (backend) que usa Claude Haiku para traducir.

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, RefreshCw, Languages, CheckCircle2, Clock,
  Loader2, AlertCircle, Edit3, Save, X, ChevronDown, ChevronUp,
  Play, Globe, Zap,
} from 'lucide-react';
import { AppRoute } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

interface TranslateStatus {
  total: number;
  EN: { translated: number; pending: number; pct: number };
  PT: { translated: number; pending: number; pct: number };
}

interface TranslateRecord {
  id: string;
  nombre_ES: string;
  desc_ES: string;
  nombre_EN: string;
  desc_EN: string;
  nombre_PT: string;
  desc_PT: string;
  hasEN: boolean;
  hasPT: boolean;
  publicado: boolean;
}

type LangTab = 'EN' | 'PT';

export default function AdminTraduccion({ onBack }: Props) {
  const [status, setStatus]         = useState<TranslateStatus | null>(null);
  const [records, setRecords]       = useState<TranslateRecord[]>([]);
  const [loadingStatus, setLS]      = useState(true);
  const [loadingRecords, setLR]     = useState(false);
  const [translating, setTrans]     = useState(false);
  const [transProgress, setTP]      = useState<string>('');
  const [lang, setLang]             = useState<LangTab>('EN');
  const [filter, setFilter]         = useState<'all' | 'pending' | 'done'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing]       = useState<{ id: string; lang: LangTab } | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDesc, setEditDesc]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [batchLimit, setBatchLimit] = useState(10);

  // ── Cargar status ────────────────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    setLS(true);
    try {
      const r = await fetch('/api/translate/status');
      const d = await r.json();
      setStatus(d);
    } catch { /* ignore */ }
    finally { setLS(false); }
  }, []);

  // ── Cargar registros ─────────────────────────────────────────────────────────
  const loadRecords = useCallback(async () => {
    setLR(true);
    try {
      const r = await fetch('/api/translate/records');
      const d = await r.json();
      setRecords(d.records || []);
    } finally { setLR(false); }
  }, []);

  useEffect(() => {
    loadStatus();
    loadRecords();
  }, [loadStatus, loadRecords]);

  // ── Traducir por lotes ────────────────────────────────────────────────────────
  const handleBatch = async (targetLang: 'EN' | 'PT' | 'ALL', force = false) => {
    setTrans(true);
    setTP(`Traduciendo con Claude Haiku... (lote de ${batchLimit})`);
    try {
      const r = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: targetLang, limit: batchLimit, force }),
      });
      const d = await r.json();
      setTP(`✅ ${d.ok} traducidos — ${d.errors} errores`);
      await loadStatus();
      await loadRecords();
    } catch (e: any) {
      setTP(`❌ Error: ${e.message}`);
    } finally {
      setTrans(false);
    }
  };

  // ── Edición manual ────────────────────────────────────────────────────────────
  const startEdit = (record: TranslateRecord, l: LangTab) => {
    setEditing({ id: record.id, lang: l });
    setEditNombre(l === 'EN' ? record.nombre_EN : record.nombre_PT);
    setEditDesc(l === 'EN' ? record.desc_EN : record.desc_PT);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const body = editing.lang === 'EN'
        ? { nombre_EN: editNombre, desc_EN: editDesc }
        : { nombre_PT: editNombre, desc_PT: editDesc };
      await fetch(`/api/translate/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setRecords(prev => prev.map(r => {
        if (r.id !== editing.id) return r;
        return editing.lang === 'EN'
          ? { ...r, nombre_EN: editNombre, desc_EN: editDesc, hasEN: true }
          : { ...r, nombre_PT: editNombre, desc_PT: editDesc, hasPT: true };
      }));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filtered = records.filter(r => {
    const hasCurrent = lang === 'EN' ? r.hasEN : r.hasPT;
    if (filter === 'pending') return !hasCurrent;
    if (filter === 'done')    return hasCurrent;
    return true;
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold">Centro de Traducciones</h1>
          <p className="text-[10px] text-gray-500">ServiciosTuristicos_SAI · Claude Haiku</p>
        </div>
        <button onClick={() => { loadStatus(); loadRecords(); }} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white">
          <RefreshCw size={13} />
        </button>
      </header>

      <div className="px-4 py-4 space-y-4 pb-10">

        {/* KPIs */}
        {loadingStatus ? (
          <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
            <Loader2 size={16} className="animate-spin mr-2" /> Cargando...
          </div>
        ) : status && (
          <div className="grid grid-cols-2 gap-3">
            {(['EN', 'PT'] as LangTab[]).map(l => {
              const s = status[l];
              return (
                <div key={l} className={`bg-gray-800/60 border rounded-xl p-3 ${l === lang ? 'border-blue-600' : 'border-gray-700'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={13} className={l === 'EN' ? 'text-blue-400' : 'text-green-400'} />
                    <span className="text-xs font-bold">{l === 'EN' ? '🇬🇧 English' : '🇧🇷 Português'}</span>
                    <span className="ml-auto text-xs font-bold text-gray-300">{s.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${l === 'EN' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${s.pct}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-500">{s.translated}/{status.total} traducidos · {s.pending} pendientes</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Panel de acción: traducir por lotes */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
            <Zap size={12} className="text-yellow-400" /> Traducción automática con Claude
          </div>

          <div className="flex gap-2 flex-wrap mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              Lote de
              <select value={batchLimit} onChange={e => setBatchLimit(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-xs focus:outline-none">
                {[5, 10, 20, 30, 50, 75].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              registros
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleBatch('EN')} disabled={translating}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-xs font-semibold transition-colors">
              {translating ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
              Traducir EN pendientes
            </button>
            <button onClick={() => handleBatch('PT')} disabled={translating}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-lg text-xs font-semibold transition-colors">
              {translating ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
              Traducir PT pendientes
            </button>
            <button onClick={() => handleBatch('ALL')} disabled={translating}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 rounded-lg text-xs font-semibold transition-colors">
              {translating ? <Loader2 size={11} className="animate-spin" /> : <Languages size={11} />}
              EN + PT
            </button>
          </div>

          {transProgress && (
            <p className="mt-3 text-xs text-gray-400 border-t border-gray-700 pt-2">{transProgress}</p>
          )}
        </div>

        {/* Tabs idioma + filtros */}
        <div className="flex gap-2">
          {(['EN', 'PT'] as LangTab[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${lang === l ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {l === 'EN' ? '🇬🇧 English' : '🇧🇷 Português'}
            </button>
          ))}
          <div className="ml-auto flex gap-1">
            {(['all', 'pending', 'done'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filter === f ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Listos'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de registros */}
        {loadingRecords ? (
          <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
            <Loader2 size={16} className="animate-spin mr-2" /> Cargando registros...
          </div>
        ) : (
          <div className="text-[11px] text-gray-500 mb-2">{filtered.length} registros</div>
        )}

        <div className="space-y-2">
          {filtered.map(record => {
            const hasCurrent = lang === 'EN' ? record.hasEN : record.hasPT;
            const nombreTrad = lang === 'EN' ? record.nombre_EN : record.nombre_PT;
            const descTrad   = lang === 'EN' ? record.desc_EN   : record.desc_PT;
            const isExpanded = expandedId === record.id;
            const isEditing  = editing?.id === record.id && editing.lang === lang;

            return (
              <div key={record.id} className={`bg-gray-900/80 border rounded-xl overflow-hidden ${hasCurrent ? 'border-gray-700' : 'border-orange-800/50'}`}>
                {/* Row header */}
                <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : record.id)}>
                  {hasCurrent
                    ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                    : <Clock size={13} className="text-orange-400 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-100 truncate">{record.nombre_ES}</div>
                    {nombreTrad && <div className="text-[10px] text-gray-500 truncate">{nombreTrad}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!record.publicado && <span className="text-[9px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">borrador</span>}
                    <button onClick={e => { e.stopPropagation(); startEdit(record, lang); }}
                      className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-white">
                      <Edit3 size={11} />
                    </button>
                    {isExpanded ? <ChevronUp size={12} className="text-gray-600" /> : <ChevronDown size={12} className="text-gray-600" />}
                  </div>
                </div>

                {/* Expanded: ver ES vs traducción */}
                {isExpanded && (
                  <div className="border-t border-gray-800 px-3 pb-3 pt-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase mb-1 block">Nombre {lang}</label>
                          <input value={editNombre} onChange={e => setEditNombre(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-600" />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 uppercase mb-1 block">Descripción {lang}</label>
                          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={6}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-blue-600" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} disabled={saving}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50">
                            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Guardar
                          </button>
                          <button onClick={() => setEditing(null)} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1 font-semibold">🇨🇴 Español</div>
                          <div className="text-xs text-gray-300 leading-relaxed max-h-32 overflow-y-auto">{record.desc_ES || '—'}</div>
                        </div>
                        <div>
                          <div className={`text-[10px] uppercase mb-1 font-semibold ${lang === 'EN' ? 'text-blue-400' : 'text-green-400'}`}>
                            {lang === 'EN' ? '🇬🇧 English' : '🇧🇷 Português'}
                          </div>
                          {descTrad
                            ? <div className="text-xs text-gray-300 leading-relaxed max-h-32 overflow-y-auto">{descTrad}</div>
                            : <div className="text-xs text-orange-400 flex items-center gap-1"><AlertCircle size={11} /> Sin traducción</div>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
