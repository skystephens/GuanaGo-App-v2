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

// ─── Colecciones GuanaGO ──────────────────────────────────────────────────────
const COLECCION_COLORS: Record<string, string> = {
  'Island Room':    '#16a37a',
  'Posada Raizal':  '#d9930a',
  'Come Noh':       '#D32F2F',
  'Seaflower Hotel':'#7a3fb0',
};

/**
 * Generar HTML de la cotización para preview — diseño GuanaGO
 */
export function generateQuoteHTML(
  cotizacion: Cotizacion,
  items: CotizacionItem[],
  services?: Tour[]
): string {
  const totalPersonas = cotizacion.adultos + cotizacion.ninos + cotizacion.bebes;
  const guanaPoints   = Math.round(cotizacion.precioTotal / 1000);

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
    <div style="font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:0 auto;background:#f4f7f5;color:#15201c;padding:20px 16px;">

      <!-- Header GuanaGO -->
      <div style="background:linear-gradient(135deg,#16a37a,#0d8a66);color:white;padding:24px 28px;border-radius:16px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div>
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1;">GuanaGO</div>
            <div style="font-size:12px;opacity:.85;margin-top:3px;">San Andrés Isla · Tu experiencia caribeña</div>
          </div>
          <div style="text-align:right;font-size:11px;opacity:.8;">
            <div>Cotización</div>
            <div style="font-weight:700;">${new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}</div>
          </div>
        </div>
        <div style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.25);">
          <div style="font-size:11px;opacity:.75;letter-spacing:.05em;text-transform:uppercase;margin-bottom:2px;">Preparada para</div>
          <div style="font-size:20px;font-weight:800;">${cotizacion.nombre}</div>
          ${cotizacion.telefono ? `<div style="font-size:12px;opacity:.85;margin-top:2px;">📱 ${cotizacion.telefono}</div>` : ''}
        </div>
      </div>

      <!-- Info strip: fechas + pax -->
      <div style="background:white;border:1px solid #e6ece9;border-radius:12px;padding:16px 20px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;">
        <div>
          <div style="font-size:10px;font-weight:700;color:#6b7b74;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Fechas</div>
          <div style="font-size:15px;font-weight:800;color:#15201c;">
            ${safeDate(cotizacion.fechaInicio)?.toLocaleDateString('es-CO', { day:'2-digit', month:'short' }) ?? '—'}
            &nbsp;→&nbsp;
            ${safeDate(cotizacion.fechaFin)?.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) ?? '—'}
          </div>
        </div>
        <div style="width:1px;height:32px;background:#e6ece9;"></div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#6b7b74;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Pasajeros</div>
          <div style="font-size:15px;font-weight:800;color:#15201c;">${totalPersonas} persona${totalPersonas !== 1 ? 's' : ''}</div>
          <div style="font-size:11px;color:#6b7b74;margin-top:1px;">
            ${cotizacion.adultos} adulto${cotizacion.adultos !== 1 ? 's' : ''}${cotizacion.ninos > 0 ? ` · ${cotizacion.ninos} niño${cotizacion.ninos !== 1 ? 's' : ''}` : ''}${cotizacion.bebes > 0 ? ` · ${cotizacion.bebes} bebé${cotizacion.bebes !== 1 ? 's' : ''}` : ''}
          </div>
        </div>
        ${cotizacion.email ? `<div style="width:1px;height:32px;background:#e6ece9;"></div><div>
          <div style="font-size:10px;font-weight:700;color:#6b7b74;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">Email</div>
          <div style="font-size:13px;color:#15201c;">${cotizacion.email}</div>
        </div>` : ''}
      </div>

      <!-- Sección servicios -->
      <div style="font-size:10px;font-weight:700;color:#6b7b74;text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px 4px;">
        Servicios incluidos · ${items.length}
      </div>

      ${items.map((item, index) => {
        // ── Tiquete aéreo ──────────────────────────────────────────────────────
        const isTiquete = item.servicioNombre?.startsWith('✈️') || item.servicioTipo === 'tiquete';
        if (isTiquete) {
          const escH = (s: string) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          const nombre    = item.servicioNombre || '';
          const parts     = nombre.replace(/^✈️\s*/, '').split('·').map((s: string) => s.trim());
          const aerolinea = parts[0] || 'Vuelo';
          const ruta      = parts[1] || '';
          const tipoVuelo = parts[2] ? parts[2].split('|')[0].trim() : '';
          const notas     = nombre.includes('|') ? nombre.split('|').slice(1).map((s: string) => s.trim()).join(' · ') : '';
          const [orig, dest] = ruta.includes('→') ? ruta.split('→').map((s: string) => s.trim()) : [ruta, ''];
          const fmtP = (n: number) => `$${n.toLocaleString('es-CO')}`;
          const pax = item.personas || 1;
          return `
          <div class="service-card" style="background:white;border:1px solid #e6ece9;border-radius:14px;overflow:hidden;margin-bottom:12px;">
            <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:14px 18px;display:flex;justify-content:space-between;align-items:center;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:22px;">✈️</span>
                <div>
                  <div style="color:white;font-weight:800;font-size:15px;">${escH(aerolinea)}</div>
                  ${tipoVuelo ? `<div style="color:rgba(255,255,255,.75);font-size:11px;">${escH(tipoVuelo)}</div>` : ''}
                </div>
              </div>
              <div style="color:#16a37a;font-size:18px;font-weight:800;background:white;padding:4px 12px;border-radius:20px;">
                ${fmtP(item.subtotal)}
              </div>
            </div>
            <div style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px dashed #e6ece9;">
              <div style="text-align:center;">
                <div style="font-size:26px;font-weight:800;color:#15201c;">${escH(orig)}</div>
                <div style="font-size:11px;color:#6b7b74;">Origen</div>
              </div>
              <div style="color:#6b7b74;font-size:20px;flex:1;text-align:center;">→</div>
              <div style="text-align:center;">
                <div style="font-size:26px;font-weight:800;color:#15201c;">${escH(dest || 'ADZ')}</div>
                <div style="font-size:11px;color:#6b7b74;">Destino</div>
              </div>
            </div>
            <div style="padding:10px 18px;display:flex;justify-content:space-between;font-size:12px;color:#6b7b74;flex-wrap:wrap;gap:6px;border-bottom:${notas ? '1px dashed #e6ece9' : 'none'};">
              <div>👥 ${pax} pasajero${pax !== 1 ? 's' : ''}</div>
              <div>${fmtP(item.valorUnitario)}/pax${item.cantidad > 1 ? ` × ${item.cantidad}` : ''}</div>
            </div>
            ${notas ? `<div style="padding:12px 18px;background:#f0faf6;">
              <div style="font-size:11px;font-weight:700;color:#0b6b50;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">ℹ️ Detalles del vuelo</div>
              <div style="font-size:13px;color:#15201c;line-height:1.7;white-space:pre-line;">${escH(notas).replace(/ · /g, '\n')}</div>
            </div>` : ''}
          </div>`;
        }

        // ── Servicios regulares (tours, hoteles, traslados…) ───────────────────
        const { images: catalogImages, description } = getServiceMeta(item);
        const freeItemImages: string[] = item.images && item.images.length > 0 ? item.images : [];
        const activeImages  = item.esPersonalizado ? freeItemImages : catalogImages;
        const fallbackUrl   = categoryFallback[item.servicioTipo] || categoryFallback['tour'];
        const showPhotoGrid = activeImages.length > 0;
        const allImages     = catalogImages.length > 0 ? catalogImages : [fallbackUrl];

        const fechaDisplay    = safeDate(item.fecha)?.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) ?? 'Por confirmar';
        const fechaFinDisplay = item.fechaFin ? safeDate(item.fechaFin)?.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) ?? '' : '';
        const itemPax = (item.personas || (item.adultos + item.ninos + item.bebes)) || totalPersonas;
        const modalId = `modal-${index}`;

        // Badge de Colección para alojamientos
        const coleccion     = (item as any).coleccion || '';
        const colColor      = COLECCION_COLORS[coleccion] || '';
        const colBadge      = coleccion && colColor
          ? `<span style="font-size:10px;font-weight:800;color:white;background:${colColor};border-radius:5px;padding:2px 7px;flex-shrink:0;">${coleccion}</span>`
          : '';

        const tipoLabel: Record<string, string> = {
          hotel: '🏨 Alojamiento', tour: '⛵ Tour/Actividad', taxi: '🚗 Traslado',
          transfer: '🚌 Transfer', package: '📦 Paquete', tiquete: '✈️ Tiquete',
          seguro: '🛡️ Seguro', otro: '➕ Adicional',
        };

        // Grid fotos
        const realCount = activeImages.length;
        const slotW = realCount === 1 ? '100%' : realCount === 2 ? 'calc(50% - 2px)' : realCount === 3 ? 'calc(33.33% - 3px)' : 'calc(25% - 3px)';
        const photoGrid = activeImages.map((url: string, i: number) => `
          <div style="width:${slotW};aspect-ratio:${realCount === 1 ? '16/7' : '1/1'};overflow:hidden;border-radius:6px;cursor:pointer;flex-shrink:0;"
               onclick="openModal('${modalId}',${i})">
            <img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block;"
                 onerror="this.src='${fallbackUrl}'" loading="lazy">
          </div>`).join('');

        const lightboxThumbs = allImages.map((url: string, i: number) => `
          <img src="${url}" id="${modalId}-thumb-${i}"
               style="width:60px;height:60px;object-fit:cover;border-radius:4px;cursor:pointer;opacity:.6;border:2px solid transparent;"
               onclick="setModalImg('${modalId}',${i})"
               onerror="this.src='${fallbackUrl}'">`).join('');

        return `
        <div class="service-card" style="background:white;border:1px solid #e6ece9;border-radius:14px;overflow:hidden;margin-bottom:12px;">

          ${showPhotoGrid ? `<div style="display:flex;gap:4px;padding:10px 10px 0;">${photoGrid}</div>` : ''}

          <div style="padding:14px 16px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:12px;">
              <div style="flex:1;min-width:0;">
                <!-- Número + colección + nombre -->
                <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:7px;">
                  <span style="background:#16a37a;color:white;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;">${index + 1}</span>
                  ${colBadge}
                  <span style="background:#e7f5ef;color:#0b6b50;font-size:10px;font-weight:700;border-radius:5px;padding:2px 7px;">${tipoLabel[item.servicioTipo] || item.servicioTipo}</span>
                </div>
                <h4 style="margin:0 0 7px;color:#15201c;font-size:15px;font-weight:700;line-height:1.2;">${item.servicioNombre}</h4>
                <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11.5px;color:#6b7b74;">
                  <span>📅 ${fechaDisplay}${fechaFinDisplay ? ` → ${fechaFinDisplay}` : ''}</span>
                  ${item.horarioInicio && item.horarioFin ? `<span>🕐 ${item.horarioInicio}–${item.horarioFin}</span>` : ''}
                  <span>👥 ${itemPax} persona${itemPax !== 1 ? 's' : ''}</span>
                </div>
                ${description ? `<div style="margin-top:8px;font-size:12.5px;color:#6b7b74;line-height:1.55;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">${description}</div>` : ''}
              </div>
              <!-- Precio -->
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:17px;font-weight:800;color:#0d8a66;">$${item.subtotal.toLocaleString('es-CO')}</div>
                <div style="font-size:10.5px;color:#6b7b74;margin-top:2px;">$${item.valorUnitario.toLocaleString('es-CO')} × ${item.personas || itemPax}${item.cantidad > 1 ? ` × ${item.cantidad}` : ''}</div>
              </div>
            </div>
            ${showPhotoGrid ? `<button onclick="openModal('${modalId}',0)" style="margin-top:8px;background:none;border:none;color:#16a37a;font-size:12px;font-weight:600;cursor:pointer;padding:0;">Ver fotos ▼</button>` : ''}
          </div>
        </div>

        ${showPhotoGrid ? `<div id="${modalId}" onclick="if(event.target===this)closeModal('${modalId}')"
          style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;align-items:center;justify-content:center;padding:20px;">
          <div style="background:white;border-radius:16px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;position:relative;">
            <button onclick="closeModal('${modalId}')" style="position:sticky;top:10px;float:right;margin:10px 12px 0 0;background:#15201c;color:white;border:none;border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;z-index:10;">✕</button>
            <div style="padding:16px 16px 0;">
              <img id="${modalId}-main" src="${allImages[0]}" style="width:100%;height:280px;object-fit:cover;border-radius:10px;display:block;" onerror="this.src='${fallbackUrl}'">
            </div>
            ${allImages.length > 1 ? `<div style="display:flex;gap:8px;padding:10px 16px 0;flex-wrap:wrap;">${lightboxThumbs}</div>` : ''}
            <div style="padding:14px 16px;">
              <h3 style="margin:0 0 8px;color:#15201c;font-size:17px;font-weight:700;">${item.servicioNombre}</h3>
              <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:13px;color:#6b7b74;margin-bottom:12px;">
                <span>📅 ${fechaDisplay}${fechaFinDisplay ? ` → ${fechaFinDisplay}` : ''}</span>
                ${item.horarioInicio && item.horarioFin ? `<span>🕐 ${item.horarioInicio}–${item.horarioFin}</span>` : ''}
                <span>👥 ${itemPax} persona${itemPax !== 1 ? 's' : ''}</span>
              </div>
              ${description ? `<p style="margin:0;font-size:14px;color:#6b7b74;line-height:1.65;">${description}</p>` : ''}
              <div style="margin-top:14px;padding-top:14px;border-top:1px solid #e6ece9;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:13px;color:#6b7b74;">Subtotal</span>
                <span style="color:#0d8a66;font-size:20px;font-weight:800;">$${item.subtotal.toLocaleString('es-CO')} COP</span>
              </div>
            </div>
          </div>
        </div>` : ''}`;
      }).join('')}

      <!-- Total GuanaGO -->
      <div style="background:linear-gradient(135deg,#16a37a,#0d8a66);border-radius:14px;padding:20px 24px;margin-bottom:14px;color:white;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:10px;opacity:.8;letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px;">Total estimado</div>
            <div style="font-size:34px;font-weight:800;line-height:1;">$${cotizacion.precioTotal.toLocaleString('es-CO')}</div>
            <div style="font-size:11px;opacity:.8;margin-top:4px;">COP · ${items.length} servicio${items.length !== 1 ? 's' : ''} · ${totalPersonas} pasajero${totalPersonas !== 1 ? 's' : ''}</div>
          </div>
          ${guanaPoints > 0 ? `<div style="background:rgba(0,0,0,.2);border-radius:12px;padding:14px 18px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#F9A825;">${guanaPoints.toLocaleString('es-CO')}</div>
            <div style="font-size:10px;opacity:.85;margin-top:2px;">GuanaPoints</div>
          </div>` : ''}
        </div>
      </div>

      <!-- Info importante -->
      <div style="background:#f0faf6;border:1px solid #c7ebdd;border-radius:12px;padding:14px 16px;margin-bottom:14px;">
        <div style="font-size:11.5px;font-weight:700;color:#0b6b50;margin-bottom:8px;">ℹ️ Información importante</div>
        <ul style="margin:0;padding-left:18px;color:#0b6b50;font-size:12px;line-height:1.7;">
          <li>Cotización válida por <strong>7 días</strong> desde su emisión</li>
          <li>Precios sujetos a disponibilidad al momento de confirmar</li>
          <li>Adultos (18+) y Niños (4-17) pagan tarifa completa · Bebés (0-3) gratis</li>
          <li>El nombre del alojamiento se confirma tras el pago</li>
        </ul>
      </div>

      ${cotizacion.notasInternas ? `
      <div style="background:white;border:1px solid #e6ece9;border-radius:12px;padding:14px 16px;margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:#6b7b74;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">📝 Notas adicionales</div>
        <p style="margin:0;color:#15201c;font-size:13px;line-height:1.6;">${cotizacion.notasInternas}</p>
      </div>` : ''}

      <!-- Footer -->
      <div style="text-align:center;padding:20px 0 8px;border-top:1px solid #e6ece9;margin-top:8px;">
        <div style="font-size:13px;font-weight:700;color:#15201c;margin-bottom:4px;">¿Listo para tu aventura en San Andrés? 🌴</div>
        <div style="font-size:12px;color:#6b7b74;margin-bottom:12px;">Confirma tu reserva o ajusta los servicios con tu asesor GuanaGO</div>
        <div style="font-size:13px;font-weight:600;color:#16a37a;">
          📱 WhatsApp: +57 320 662 0695&nbsp;&nbsp;·&nbsp;&nbsp;🌐 app.guiasanandresislas.com
        </div>
        <div style="font-size:10px;color:#6b7b74;margin-top:12px;">GuanaGO © ${new Date().getFullYear()} · San Andrés Isla, Colombia · RNT 48674</div>
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
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    document.body.appendChild(container);
    container.innerHTML = generateQuoteHTML(cotizacion, items, services);

    // Redirigir todas las imágenes externas al proxy del backend (/api/proxy-image).
    // El proxy devuelve la imagen desde el servidor (sin restricciones CORS), así que
    // html2canvas puede capturarlas como imágenes same-origin sin tainting de canvas.
    const proxyUrl = (src: string) =>
      !src || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')
        ? src
        : `/api/proxy-image?url=${encodeURIComponent(src)}`;

    const allImgs = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
    allImgs.forEach(img => {
      const src = img.getAttribute('src') || '';
      if (src) {
        img.loading = 'eager';          // cancela lazy antes del nuevo src
        const proxied = proxyUrl(src);
        // Si el proxy también falla, volver a la URL original directamente
        img.setAttribute('onerror', `this.onerror=null;this.src='${src}'`);
        img.src = proxied;
      }
    });

    // Esperar a que todas las imágenes proxeadas carguen (o fallen) antes de capturar
    await Promise.allSettled(
      allImgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>(resolve => {
          const timer = setTimeout(resolve, 10000);
          img.addEventListener('load',  () => { clearTimeout(timer); resolve(); }, { once: true });
          img.addEventListener('error', () => { clearTimeout(timer); resolve(); }, { once: true });
        });
      })
    );

    // Obtener posición de cada tarjeta ANTES de remover el contenedor
    const CANVAS_SCALE   = 2;
    const containerRect  = container.getBoundingClientRect();
    const cardBounds = Array.from(container.querySelectorAll<HTMLElement>('.service-card'))
      .map(el => {
        const r = el.getBoundingClientRect();
        return {
          topPx:    Math.round((r.top    - containerRect.top)  * CANVAS_SCALE),
          bottomPx: Math.round((r.bottom - containerRect.top)  * CANVAS_SCALE),
        };
      });

    // Capturar como imagen
    const canvas = await html2canvas(container, {
      scale: CANVAS_SCALE,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remover elemento temporal
    document.body.removeChild(container);

    // Dimensiones
    const imgWidth   = 210;                                  // mm — ancho A4
    const PAGE_H_MM  = 297;                                  // mm — alto A4
    const pxToMm     = imgWidth / canvas.width;              // factor de conversión
    const pageHeightPx = Math.round(PAGE_H_MM / pxToMm);    // píxeles que caben en una página

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // ── Algoritmo de corte inteligente ─────────────────────────────────────────
    // Construye puntos de corte evitando partir una tarjeta por la mitad.
    const breakPoints: number[] = [0];
    while (true) {
      const lastBreak = breakPoints[breakPoints.length - 1];
      let nextCut = lastBreak + pageHeightPx;
      if (nextCut >= canvas.height) break;

      // ¿El corte cae dentro de alguna tarjeta?
      const splitCard = cardBounds.find(c => c.topPx < nextCut && c.bottomPx > nextCut);
      if (splitCard) {
        // Retroceder hasta el borde superior de esa tarjeta
        const safeBreak = splitCard.topPx;
        // Si la tarjeta es más alta que la página completa, cortar igual (evitar loop infinito)
        nextCut = safeBreak > lastBreak ? safeBreak : lastBreak + pageHeightPx;
      }
      breakPoints.push(nextCut);
    }

    // ── Generar páginas a partir de los cortes ────────────────────────────────
    for (let i = 0; i < breakPoints.length; i++) {
      if (i > 0) pdf.addPage();

      const startY        = breakPoints[i];
      const endY          = i < breakPoints.length - 1 ? breakPoints[i + 1] : canvas.height;
      const sliceHeightPx = endY - startY;
      const sliceHeightMm = sliceHeightPx * pxToMm;

      // Cortar el canvas en un sub-canvas de esa franja
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width  = canvas.width;
      pageCanvas.height = sliceHeightPx;
      const ctx = pageCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, startY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgWidth, sliceHeightMm);
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
          <title>Cotización ${cotizacion.nombre} - GuanaGO</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { margin:0; padding:20px; background:#f4f7f5; font-family:'Plus Jakarta Sans',-apple-system,sans-serif; }
            @media print {
              body { background:white; padding:0; }
              .no-print { display:none !important; }
              .service-card { break-inside: avoid; page-break-inside: avoid; }
            }
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
