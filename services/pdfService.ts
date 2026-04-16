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

  /** Busca imagen y descripción desde el catálogo de servicios en memoria */
  const getServiceMeta = (item: CotizacionItem) => {
    if (!services) return { image: '', description: '' };
    const svc = services.find(s => s.id === item.servicioId);
    return { image: svc?.image || '', description: svc?.description || '' };
  };
  
  return `
    <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: #1a1a1a;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px;">
        <h1 style="color: #0ea5e9; font-size: 36px; margin: 0 0 10px 0;">GuanaGO</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0;">San Andrés Isla · Turismo Experiencial</p>
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
          const { image, description } = getServiceMeta(item);
          const fechaDisplay = safeDate(item.fecha)?.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) ?? 'Por confirmar';
          const fechaFinDisplay = item.fechaFin ? safeDate(item.fechaFin)?.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) ?? '' : '';
          const itemPax = (item.personas || (item.adultos + item.ninos + item.bebes)) || totalPersonas;
          return `
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 14px;">
            ${image ? `<img src="${image}" alt="${item.servicioNombre}" style="width: 100%; height: 160px; object-fit: cover; display: block;" onerror="this.style.display='none'">` : ''}
            <div style="padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="background: #0ea5e9; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">
                      ${index + 1}
                    </span>
                    <h4 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600;">${item.servicioNombre}</h4>
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px; color: #64748b;">
                    <span>📅 ${fechaDisplay}${fechaFinDisplay ? ` → ${fechaFinDisplay}` : ''}</span>
                    ${item.horarioInicio && item.horarioFin ? `<span>🕐 ${item.horarioInicio} - ${item.horarioFin}</span>` : ''}
                    <span>👥 ${itemPax} persona${itemPax !== 1 ? 's' : ''}</span>
                    <span style="text-transform: uppercase; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                      ${item.servicioTipo}
                    </span>
                  </div>
                </div>
                <div style="text-align: right; flex-shrink: 0; margin-left: 16px;">
                  <div style="color: #10b981; font-size: 18px; font-weight: 700;">
                    $${item.subtotal.toLocaleString('es-CO')}
                  </div>
                  <div style="color: #94a3b8; font-size: 11px;">
                    $${item.valorUnitario.toLocaleString('es-CO')} × ${item.personas || itemPax}${item.cantidad > 1 ? ` × ${item.cantidad}u` : ''}
                  </div>
                </div>
              </div>
              ${description ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">${description}</p>` : ''}
            </div>
          </div>
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
          📱 WhatsApp: +57 XXX XXX XXXX<br/>
          📧 Email: contacto@guanago.com<br/>
          🌐 Web: www.guanago.com
        </div>
        <p style="color: #cbd5e1; font-size: 11px; margin: 20px 0 0 0;">
          GuanaGO © ${new Date().getFullYear()} · San Andrés Isla, Colombia
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
          <title>Cotización ${cotizacion.nombre} - GuanaGO</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #f1f5f9;
              font-family: Arial, sans-serif;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${html}
          <div style="text-align: center; margin-top: 30px;">
            <button 
              onclick="window.print()" 
              style="background: #0ea5e9; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-right: 10px;"
            >
              🖨️ Imprimir
            </button>
            <button 
              onclick="window.close()" 
              style="background: #64748b; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;"
            >
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
