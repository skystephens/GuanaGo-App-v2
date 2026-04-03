/**
 * pricing.ts — Utilidad centralizada de precios GuanaGO
 *
 * Los precios vienen 100% de Airtable (ServiciosTuristicos_SAI).
 * No se calcula ni suma ningún porcentaje en el frontend.
 * Si el campo no está configurado en Airtable → devuelve 0 → se muestra "Consultar precio".
 *
 * Campos en Airtable:
 *   Precio actualizado → precioB2C  (tarifa pública / cliente directo)
 *   Precio_Promotor    → precioPromotor
 *   Precio_OTA         → precioOTA
 *   Precio_Aliado      → precioAliado
 */

import { Tour } from '../types';

/** Precio público para cliente directo B2C */
export function getPrecioB2C(service: Tour): number {
  return service.precioB2C && service.precioB2C > 0 ? service.precioB2C : 0;
}

/** Precio canal promotor */
export function getPrecioPromotor(service: Tour): number {
  return service.precioPromotor && service.precioPromotor > 0 ? service.precioPromotor : 0;
}

/** Precio canal OTA / agencia */
export function getPrecioOTA(service: Tour): number {
  return service.precioOTA && service.precioOTA > 0 ? service.precioOTA : 0;
}

/** Precio canal aliado local */
export function getPrecioAliado(service: Tour): number {
  return service.precioAliado && service.precioAliado > 0 ? service.precioAliado : 0;
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
