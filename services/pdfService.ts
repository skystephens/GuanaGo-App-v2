/**
 * PDF Service - Generación de cotizaciones en PDF
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Cotizacion, CotizacionItem, Tour } from '../types';

/** Convierte una fecha YYYY-MM-DD o Date a Date local (sin offset UTC) */
function safeDate(d: string | Date | undefined | null): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  const parsed = new Date(d + 'T12:00:00');
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Logo GuanaGO (data URI - reemplaza con tu logo real)
const GUANAGO_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Generar HTML de la cotización para preview
 */
export function generateQuoteHTML(
  cotizacion: Cotizacion,
  items: CotizacionItem[],
  services?: Tour[]
): string {
  const totalPersonas = cotizacion.adultos + cotizacion.ninos + cotizacion.bebes;

  /** Fallback de imagen por categoría cuando Airtable no tiene foto */
  const categoryFallback: Record<string, string> = {
    hotel:    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    tour:     'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    taxi:     'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
    transfer: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
    package:  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    tiquete:  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
    seguro:   'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    otro:     'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  };

  /** Busca imágenes y descripción desde el catálogo; fallback por nombre, luego por categoría */
  const getServiceMeta = (item: CotizacionItem) => {
    // 1. Lookup por ID (caso normal: servicio del catálogo)
    let svc = services?.find(s => s.id === item.servicioId);

    // 2. Fallback por nombre normalizado (para ítems libres o IDs de tabla antigua)
    if (!svc && item.servicioNombre && services?.length) {
      const needle = item.servicioNombre.toLowerCase().trim();
      svc = services.find(s =>
        (s.title || (s as any).nombre || '').toLowerCase().trim() === needle
      );
    }

    const realImages: string[] = (svc as any)?.gallery || (svc as any)?.images || (svc?.image ? [svc.image] : []);
    return {
      images: realImages,  // real catalog images only, NO fallback — caller decides
      description: svc?.description || (svc as any)?.descripcion || '',
    };
  };
  
  return `
    <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: #1a1a1a;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #FF6600; padding-bottom: 20px;">
        <h1 style="color: #FF6600; font-size: 36px; margin: 0 0 4px 0; font-weight: 800;">GuíaSAI</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0;">San Andrés Isla · Especialistas en Turismo</p>
      </div>

      <!-- Título Cotización -->
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <h2 style="color: white; margin: 0 0 5px 0; font-size: 24px;">Cotización de Viaje</h2>
        <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">
          ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <!-- Información del Cliente -->
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #334155; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Información del Cliente</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;">Nombre:</td>
            <td style="padding: 8px 0; color: #1e293b; font-weight: 500; font-size: 14px;">${cotizacion.nombre}</td>
          </tr>
          ${cotizacion.email ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${cotizacion.email}</td>
          </tr>` : ''}
          ${cotizacion.telefono ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Teléfono:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${cotizacion.telefono}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Fechas:</td>
            <td style="padding: 8px 0; color: #1e293b; font-weight: 500; font-size: 14px;">
              ${safeDate(cotizacion.fechaInicio)?.toLocaleDateString('es-CO') ?? 'Por confirmar'} -
              ${safeDate(cotizacion.fechaFin)?.toLocaleDateString('es-CO') ?? 'Por confirmar'}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Pasajeros:</td>
            <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">
              ${totalPersonas} personas 
              (${cotizacion.adultos} adultos 18+, ${cotizacion.ninos} niños 4-17 años, ${cotizacion.bebes} bebés 0-3 años)
            </td>
          </tr>
        </table>
      </div>

      <!-- Servicios Incluidos -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #334155; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Servicios Incluidos</h3>
        
        ${items.map((item, index) => {
          // ── Tiquete aéreo: card especial sin fotos ──────────────────────────
          const isTiquete = item.servicioNombre?.startsWith('✈️') || item.servicioTipo === 'tiquete';
          if (isTiquete) {
            const escH = (s: string) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            const nombre   = item.servicioNombre || '';
            // Same parsing as backend renderFlightCard:
            // "✈️ LATAM · CLO→ADZ · Ida y vuelta | Vuelo de ida..."
            const parts    = nombre.replace(/^✈️\s*/, '').split('·').map((s: string) => s.trim());
            const aerolinea = parts[0] || 'Vuelo';
            const ruta      = parts[1] || '';
            const tipoVuelo = parts[2] ? parts[2].split('|')[0].trim() : '';
            const notas     = nombre.includes('|')
              ? nombre.split('|').slice(1).map((s: string) => s.trim()).join(' · ')
              : '';
            const [orig, dest] = ruta.includes('→') ? ruta.split('→').map((s: string) => s.trim()) : [ruta, ''];
            const fmtP = (n: number) => `$${n.toLocaleString('es-CO')}`;
            const pax = item.personas || 1;

            return `
            <!-- ── Tiquete aéreo ${index + 1} ── -->
            <div style="background:white;border:2px solid #bfdbfe;border-radius:12px;overflow:hidden;margin-bottom:16px;">
              <!-- header azul -->
              <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:14px 18px;display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:22px;">✈️</span>
                  <div>
                    <div style="color:white;font-weight:700;font-size:15px;">${escH(aerolinea)}</div>
                    ${tipoVuelo ? `<div style="color:rgba(255,255,255,.8);font-size:11px;">${escH(tipoVuelo)}</div>` : ''}
                  </div>
                </div>
                <div style="color:#10b981;font-size:18px;font-weight:700;background:white;padding:4px 12px;border-radius:20px;">
                  ${fmtP(item.subtotal)}
                </div>
              </div>
              <!-- ruta -->
              <div style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px dashed #e2e8f0;">
                <div style="text-align:center;">
                  <div style="font-size:26px;font-weight:800;color:#1e293b;">${escH(orig)}</div>
                  <div style="font-size:11px;color:#64748b;">Origen</div>
                </div>
                <div style="color:#94a3b8;font-size:20px;flex:1;text-align:center;">→</div>
                <div style="text-align:center;">
                  <div style="font-size:26px;font-weight:800;color:#1e293b;">${escH(dest || 'ADZ')}</div>
                  <div style="font-size:11px;color:#64748b;">Destino</div>
                </div>
              </div>
              <!-- detalles pasajeros -->
              <div style="padding:10px 18px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#64748b;flex-wrap:wrap;gap:6px;border-bottom:${notas ? '1px dashed #e2e8f0' : 'none'};">
                <div>👥 ${pax} pasajero${pax !== 1 ? 's' : ''}</div>
                <div>${fmtP(item.valorUnitario)}/pax${item.cantidad > 1 ? ` × ${item.cantidad}` : ''}</div>
              </div>
              ${notas ? `
              <div style="padding:12px 18px;background:#f8fafc;">
                <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">ℹ️ Detalles del vuelo</div>
                <div style="font-size:13px;color:#334155;line-height:1.7;white-space:pre-line;">${escH(notas).replace(/ · /g, '\n')}</div>
              </div>` : ''}
            </div>`;
          }

          // ── Servicios con foto-grid (tours, hoteles, etc.) ──────────────────
          const { images: catalogImages, description } = getServiceMeta(item);
          const fallbackUrl = categoryFallback[item.servicioTipo] || categoryFallback['tour'];
          // Items libres (esPersonalizado=true) nunca muestran fotos
          const showPhotoGrid = !item.esPersonalizado && catalogImages.length > 0;
          // gridImages: 4 slots rellenos con la última imagen real disponible
          const gridImages: string[] = [...catalogImages];
          while (gridImages.length < 4) gridImages.push(gridImages[gridImages.length - 1] || fallbackUrl);
          const images = gridImages;
          const allImages = catalogImages.length > 0 ? catalogImages : [fallbackUrl];
          const fechaDisplay = safeDate(item.fecha)?.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) ?? 'Por confirmar';
          const fechaFinDisplay = item.fechaFin ? safeDate(item.fechaFin)?.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) ?? '' : '';
          const itemPax = (item.personas || (item.adultos + item.ninos + item.bebes)) || totalPersonas;
          const cardId = `svc-${index}`;
          const modalId = `modal-${index}`;

          // Grid de fotos pequeñas (4 slots siempre)
          const photoGrid = images.map((url, i) => `
            <div style="width: calc(25% - 3px); aspect-ratio: 1/1; overflow: hidden; border-radius: 6px; cursor: pointer; flex-shrink: 0;"
                 onclick="openModal('${modalId}', ${i})">
              <img src="${url}" style="width:100%; height:100%; object-fit:cover; display:block; transition:opacity .2s;"
                   onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'"
                   onerror="this.src='${fallbackUrl}'" loading="lazy">
            </div>
          `).join('');

          // Lightbox con TODAS las fotos disponibles
          const lightboxThumbs = allImages.map((url, i) => `
            <img src="${url}" id="${modalId}-thumb-${i}"
                 style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer;opacity:.6;border:2px solid transparent;"
                 onclick="setModalImg('${modalId}',${i})"
                 onerror="this.src='${fallbackUrl}'">
          `).join('');

          return `
          <!-- ── Tarjeta servicio ${index + 1} ── -->
          <div style="background:white;border:2px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px;">

            ${showPhotoGrid ? `<!-- Grid fotos -->
            <div style="display:flex;gap:4px;padding:10px 10px 0;">
              ${photoGrid}
            </div>` : ''}

            <!-- Info principal -->
            <div style="padding:14px 16px 16px;">
              <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
                <div style="flex:1;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="background:#0ea5e9;color:white;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${index + 1}</span>
                    <h4 style="margin:0;color:#1e293b;font-size:15px;font-weight:700;">${item.servicioNombre}</h4>
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:#64748b;">
                    <span>📅 ${fechaDisplay}${fechaFinDisplay ? ` → ${fechaFinDisplay}` : ''}</span>
                    ${item.horarioInicio && item.horarioFin ? `<span>🕐 ${item.horarioInicio}–${item.horarioFin}</span>` : ''}
                    <span>👥 ${itemPax} persona${itemPax !== 1 ? 's' : ''}</span>
                    <span style="text-transform:uppercase;background:#f1f5f9;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;">${item.servicioTipo}</span>
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:16px;">
                  <div style="color:#10b981;font-size:17px;font-weight:700;">$${item.subtotal.toLocaleString('es-CO')}</div>
                  <div style="color:#94a3b8;font-size:11px;">$${item.valorUnitario.toLocaleString('es-CO')} × ${item.personas || itemPax}${item.cantidad > 1 ? ` × ${item.cantidad}u` : ''}</div>
                </div>
              </div>

              ${description ? `
              <!-- Descripción truncada -->
              <div id="${cardId}-short" style="font-size:13px;color:#64748b;line-height:1.55;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">
                ${description}
              </div>
              ${showPhotoGrid ? `<button onclick="openModal('${modalId}', 0)"
                style="margin-top:6px;background:none;border:none;color:#0ea5e9;font-size:12px;font-weight:600;cursor:pointer;padding:0;">
                Ver más info e imágenes ▼
              </button>` : ''}` : ''}
            </div>
          </div>

          ${showPhotoGrid ? `<!-- ── Lightbox / Modal ── -->
          <div id="${modalId}" onclick="if(event.target===this)closeModal('${modalId}')"
            style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;align-items:center;justify-content:center;padding:20px;">
            <div style="background:white;border-radius:14px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;position:relative;">
              <button onclick="closeModal('${modalId}')"
                style="position:sticky;top:10px;float:right;margin:10px 12px 0 0;background:#1e293b;color:white;border:none;border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;z-index:10;">✕</button>
              <!-- Imagen principal -->
              <div style="padding:16px 16px 0;">
                <img id="${modalId}-main" src="${allImages[0]}" alt="${item.servicioNombre}"
                  style="width:100%;height:280px;object-fit:cover;border-radius:10px;display:block;"
                  onerror="this.src='${fallbackUrl}'">
              </div>
              <!-- Miniaturas (todas las disponibles) -->
              ${allImages.length > 1 ? `
              <div style="display:flex;gap:8px;padding:10px 16px 0;flex-wrap:wrap;">
                ${lightboxThumbs}
              </div>` : ''}
              <!-- Nombre + datos -->
              <div style="padding:14px 16px;">
                <h3 style="margin:0 0 8px;color:#1e293b;font-size:17px;">${item.servicioNombre}</h3>
                <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:13px;color:#64748b;margin-bottom:12px;">
                  <span>📅 ${fechaDisplay}${fechaFinDisplay ? ` → ${fechaFinDisplay}` : ''}</span>
                  ${item.horarioInicio && item.horarioFin ? `<span>🕐 ${item.horarioInicio}–${item.horarioFin}</span>` : ''}
                  <span>👥 ${itemPax} persona${itemPax !== 1 ? 's' : ''}</span>
                  <span style="text-transform:uppercase;background:#f1f5f9;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;">${item.servicioTipo}</span>
                </div>
                ${description ? `<p style="margin:0;font-size:14px;color:#475569;line-height:1.65;">${description}</p>` : ''}
                <div style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-size:13px;color:#64748b;">Subtotal</span>
                  <span style="color:#10b981;font-size:20px;font-weight:700;">$${item.subtotal.toLocaleString('es-CO')} COP</span>
                </div>
              </div>
            </div>
          </div>` : ''}
        `}).join('')}
      </div>

      <!-- Total -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 12px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 5px;">PRECIO TOTAL</div>
            <div style="color: white; font-size: 36px; font-weight: 700; line-height: 1;">
              $${cotizacion.precioTotal.toLocaleString('es-CO')}
            </div>
            <div style="color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 5px;">
              COP - Pesos Colombianos
            </div>
          </div>
          <div style="text-align: right; color: rgba(255,255,255,0.9); font-size: 13px;">
            <div>${items.length} servicio${items.length !== 1 ? 's' : ''}</div>
            <div>${totalPersonas} pasajero${totalPersonas !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      <!-- Información Adicional -->
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 30px;">
        <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
          ℹ️ Información Importante
        </h4>
        <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.6;">
          <li>Esta cotización es válida por 7 días desde su emisión</li>
          <li>Los precios están sujetos a disponibilidad al momento de la reserva</li>
          <li>Se requiere confirmación previa para todos los servicios</li>
          <li>Tarifas: Adultos (18+) y Niños (4-17) pagan tarifa completa. Bebés (0-3) gratis.</li>
          <li>Los bebés no cuentan como huésped en alojamientos</li>
        </ul>
      </div>

      ${cotizacion.notasInternas ? `
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 30px;">
        <h4 style="color: #475569; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
          📝 Notas Adicionales
        </h4>
        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
          ${cotizacion.notasInternas}
        </p>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; padding-top: 30px; border-top: 2px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
          ¿Listo para tu aventura en San Andrés? 🌴
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 15px 0;">
          Contáctanos para confirmar tu reserva o hacer ajustes
        </p>
        <div style="color: #0ea5e9; font-size: 13px; font-weight: 600;">
          📱 WhatsApp: +57 315 383 6043<br/>
          📧 Email: comercial@guiasai.com<br/>
          🌐 Web: guiasanandresislas.com
        </div>
        <p style="color: #cbd5e1; font-size: 11px; margin: 20px 0 0 0;">
          GuíaSAI © ${new Date().getFullYear()} · San Andrés Isla, Colombia
        </p>
      </div>
    </div>
  `;
}

/**
 * Generar y descargar PDF de cotización
 */
export async function downloadQuotePDF(
  cotizacion: Cotizacion,
  items: CotizacionItem[],
  services?: Tour[]
): Promise<void> {
  try {
    // Crear elemento temporal con el HTML
    const container = document.createElement('div');
    container.innerHTML = generateQuoteHTML(cotizacion, items, services);
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // Esperar un momento para que se renderice
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capturar como imagen
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Remover elemento temporal
    document.body.removeChild(container);

    // Crear PDF
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Si la imagen es más alta que una página, dividir en múltiples páginas
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    // Descargar
    const fileName = `Cotizacion_${cotizacion.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    console.log('✅ PDF generado:', fileName);
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    throw error;
  }
}

/**
 * Abrir preview de cotización en nueva ventana
 */
export function previewQuote(
  cotizacion: Cotizacion,
  items: CotizacionItem[],
  services?: Tour[]
): void {
  const html = generateQuoteHTML(cotizacion, items, services);
  
  const previewWindow = window.open('', '_blank', 'width=900,height=700');
  
  if (previewWindow) {
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cotización ${cotizacion.nombre} - GuíaSAI</title>
          <style>
            body { margin:0; padding:20px; background:#f1f5f9; font-family:Arial,sans-serif; }
            @media print { body { background:white; padding:0; } .no-print { display:none !important; } }
          </style>
          <script>
            function openModal(id, imgIndex) {
              var m = document.getElementById(id);
              if (!m) return;
              m.style.display = 'flex';
              document.body.style.overflow = 'hidden';
              setModalImg(id, imgIndex);
            }
            function closeModal(id) {
              var m = document.getElementById(id);
              if (m) m.style.display = 'none';
              document.body.style.overflow = '';
            }
            function setModalImg(modalId, idx) {
              var main = document.getElementById(modalId + '-main');
              var thumbs = document.querySelectorAll('[id^="' + modalId + '-thumb-"]');
              thumbs.forEach(function(t, i) {
                if (main && i === idx) {
                  main.src = t.src;
                  main.style.display = 'block';
                }
                t.style.opacity = i === idx ? '1' : '0.5';
                t.style.borderColor = i === idx ? '#0ea5e9' : 'transparent';
              });
            }
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                document.querySelectorAll('[id^="modal-"]').forEach(function(m) {
                  m.style.display = 'none';
                });
                document.body.style.overflow = '';
              }
            });
          </script>
        </head>
        <body>
          ${html}
          <div class="no-print" style="text-align:center;margin-top:30px;">
            <button onclick="window.print()"
              style="background:#0ea5e9;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-right:10px;">
              🖨️ Imprimir
            </button>
            <button onclick="window.close()"
              style="background:#64748b;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
              Cerrar
            </button>
          </div>
        </body>
      </html>
    `);
    previewWindow.document.close();
  } else {
    alert('Por favor permite ventanas emergentes para ver el preview');
  }
}

export default {
  generateQuoteHTML,
  downloadQuotePDF,
  previewQuote
};
