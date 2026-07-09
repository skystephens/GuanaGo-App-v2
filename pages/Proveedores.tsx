import React, { useState } from 'react';
import { ChevronLeft, BedDouble, Ship, MessageCircle, CheckCircle2, ClipboardList } from 'lucide-react';
import { GUANA_LOGO } from '../constants';

/**
 * PROVEEDORES — GuiaSAI
 * Página pública para dueños de alojamientos y tours.
 * Los formularios escriben en tablas STAGING de Airtable (nunca en las productivas).
 * Sky revisa cada solicitud y la aprueba hacia AlojamientosTuristicos_SAI / ServiciosTuristicos_SAI.
 *
 * Acceso directo compartible: https://guanago.travel/?p=proveedores
 */

// ── Formularios Airtable (staging) ──────────────────────────────────
const FORM_ALOJAMIENTOS = 'https://airtable.com/embed/shrcjhdCLdSNlg6rX';
// TODO: crear form view en tabla Servicios_Solicitudes y pegar el shr aquí
const FORM_TOURS: string | null = null;

const WHATSAPP_GUIASAI = 'https://wa.me/573000000000'; // TODO Sky: número real

type Tab = 'alojamientos' | 'tours';

interface ProveedoresProps {
  onBack?: () => void;
}

const Proveedores: React.FC<ProveedoresProps> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('alojamientos');

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 md:px-8 pt-10 pb-5">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
          )}
          <div className="bg-teal-50 w-12 h-12 rounded-2xl flex items-center justify-center p-1 border border-teal-100 shadow-sm shrink-0">
            <img src={GUANA_LOGO} alt="GuiaSAI" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">GuiaSAI · RNT 48674</p>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">Proveedores</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 md:px-8 pt-6">
        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h2 className="font-black text-gray-800 text-base mb-2">Trabaja con GuiaSAI</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Si tienes un alojamiento o un tour en San Andrés, Providencia o Santa Catalina,
            regístralo aquí para que haga parte de nuestro catálogo. Nuestro equipo revisa
            cada solicitud y te contacta para confirmar los detalles antes de publicarla.
          </p>
          <div className="flex flex-col gap-1.5 mt-3">
            {[
              'Diligencia el formulario con los datos de tu servicio',
              'Verificamos la información (RNT, precios, fotos)',
              'Tu servicio queda publicado en el catálogo GuiaSAI',
            ].map((paso, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 size={16} className="text-teal-500 mt-0.5 shrink-0" />
                <span>{paso}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('alojamientos')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
              tab === 'alojamientos'
                ? 'bg-teal-500 border-teal-500 text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-500 hover:border-teal-200'
            }`}
          >
            <BedDouble size={16} /> Alojamientos
          </button>
          <button
            onClick={() => setTab('tours')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
              tab === 'tours'
                ? 'bg-teal-500 border-teal-500 text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-500 hover:border-teal-200'
            }`}
          >
            <Ship size={16} /> Tours y servicios
          </button>
        </div>

        {/* Formulario Alojamientos */}
        {tab === 'alojamientos' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <ClipboardList size={16} className="text-teal-600" />
              <h3 className="font-bold text-sm text-gray-800">Registrar mi alojamiento</h3>
            </div>
            <iframe
              className="airtable-embed w-full"
              src={FORM_ALOJAMIENTOS}
              frameBorder="0"
              width="100%"
              height="1200"
              style={{ background: 'transparent' }}
              title="Formulario de registro de alojamientos GuiaSAI"
            />
          </div>
        )}

        {/* Formulario Tours */}
        {tab === 'tours' && (
          FORM_TOURS ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <ClipboardList size={16} className="text-teal-600" />
                <h3 className="font-bold text-sm text-gray-800">Registrar mi tour o servicio</h3>
              </div>
              <iframe
                className="airtable-embed w-full"
                src={FORM_TOURS}
                frameBorder="0"
                width="100%"
                height="1200"
                style={{ background: 'transparent' }}
                title="Formulario de registro de tours GuiaSAI"
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <Ship size={32} className="text-teal-400 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">Registro de tours muy pronto</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Estamos habilitando el formulario para tours y servicios turísticos.
                Mientras tanto, escríbenos por WhatsApp y registramos tu servicio directamente.
              </p>
              <a
                href={WHATSAPP_GUIASAI}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                <MessageCircle size={16} /> Escribir por WhatsApp
              </a>
            </div>
          )
        )}

        {/* Nota de actualización de datos */}
        <div className="mt-5 bg-teal-50 border border-teal-100 rounded-2xl p-4 text-sm text-teal-900 leading-relaxed">
          <strong>¿Ya estás en el catálogo y necesitas actualizar precios, fotos o datos de contacto?</strong>{' '}
          Escríbenos por{' '}
          <a href={WHATSAPP_GUIASAI} target="_blank" rel="noopener noreferrer" className="underline font-bold">
            WhatsApp
          </a>{' '}
          indicando el nombre de tu negocio y el cambio que necesitas. Nuestro equipo lo aplica el mismo día.
        </div>
      </main>
    </div>
  );
};

export default Proveedores;
