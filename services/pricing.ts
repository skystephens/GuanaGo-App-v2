/**
 * pricing.ts — Utilidad centralizada de precios GuanaGO
 *
 * Lee los campos de precio por canal desde ServiciosTuristicos_SAI.
 * Si el campo no está configurado en Airtable, aplica el fallback
 * calculado sobre la tarifa_base (campo Precio).
 *
 * Campos en Airtable:
 *   Precio         → tarifa_base (siempre requerido)
 *   Precio_B2C     → cliente directo (+15% concierge + logística)
 *   Precio_Promotor→ canal promotor (+8% comisión incluida)
 *   Precio_OTA     → agencia/OTA (tarifa neta, sin markup)
 *   Precio_Aliado  → aliado local (-20%, comisión mensual)
 *
 * Uso:
 *   import { getPrecioB2C, getPrecioPromotor } from '../services/pricing';
 *   const precio = getPrecioB2C(service);
 */

import { Tour } from '../types';

// Markups de fallback (solo se usan si el campo no está en Airtable)
const FALLBACK_MARKUP_B2C       = 0.15;   // +15%
const FALLBACK_MARKUP_PROMOTOR  = 0.08;   // +8%
const FALLBACK_MARKUP_OTA       = 0.00;   // tarifa neta = sin markup
const FALLBACK_MARKUP_ALIADO    = -0.20;  // -20%

/** Precio para canal B2C cliente directo */
export function getPrecioB2C(service: Tour): number {
  if (service.precioB2C && service.precioB2C > 0) return service.precioB2C;
  if (!service.price || service.price <= 0) return 0;
  return Math.ceil(service.price * (1 + FALLBACK_MARKUP_B2C));
}

/** Precio para canal promotor (comisión incluida en el precio al cliente) */
export function getPrecioPromotor(service: Tour): number {
  if (service.precioPromotor && service.precioPromotor > 0) return service.precioPromotor;
  if (!service.price || service.price <= 0) return 0;
  return Math.ceil(service.price * (1 + FALLBACK_MARKUP_PROMOTOR));
}

/** Precio para canal OTA / agencia (tarifa neta) */
export function getPrecioOTA(service: Tour): number {
  if (service.precioOTA && service.precioOTA > 0) return service.precioOTA;
  if (!service.price || service.price <= 0) return 0;
  return Math.ceil(service.price * (1 + FALLBACK_MARKUP_OTA));
}

/** Precio para canal aliado local */
export function getPrecioAliado(service: Tour): number {
  if (service.precioAliado && service.precioAliado > 0) return service.precioAliado;
  if (!service.price || service.price <= 0) return 0;
  return Math.ceil(service.price * (1 + FALLBACK_MARKUP_ALIADO));
}

/** Formatea un precio con separadores de miles */
export function formatPrecio(precio: number, moneda: 'COP' | 'USD' = 'COP'): string {
  if (!precio || precio <= 0) return 'Consultar precio';
  return `$${precio.toLocaleString('es-CO')} ${moneda}`;
}

/** Unidad de precio según categoría */
export function getUnidad(category: string): string {
  return category === 'hotel' ? '/ noche' : '/ persona';
}
