# 🖼️ DIAGNÓSTICO Y SOLUCIÓN - Imágenes no se muestran en Producción

## ❌ Problema
En https://guana-go-app-v2.onrender.com/ (Render), las imágenes de tours no se muestran, pero sí aparecen nombres y precios.

## 🔍 Causa Posible
Las URLs de las imágenes en Airtable podrían ser:
1. **URLs privadas/internas** de Airtable que no son accesibles desde producción
2. **URLs quebradas** o campos de imagen vacíos
3. **Campos de imagen con estructura incorrecta**

## ✅ Solución Temporal (Ya Aplicada)
Se mejoraron los fallbacks en `airtableService.ts`:
- Si no hay imagen: muestra placeholder de Unsplash según categoría
- Hotel → imagen de hotel
- Restaurante → imagen de comida
- Taxi → imagen de transporte
- Otro → imagen genérica de turismo

## 🔧 Qué Verificar en Airtable

### Paso 1: Revisar Campo de Imagen
1. Ve a la tabla `ServiciosTuristicos_SAI`
2. Busca la columna **"Imagenurl"** (o variantes: `ImagenUrl`, `Imagen`, etc.)
3. **IMPORTANTE:** Este campo debe ser de tipo **"Attachment"** (no texto)

### Paso 2: Verificar URLs Públicas
4. Haz clic en una imagen
5. **Debe mostrar una URL pública** que comience con:
   ```
   https://dl.airtable.com/...
   ```
   O
   ```
   https://<nombre-base>.airtable.com/...
   ```

### Paso 3: Si las URLs NO son públicas
6. **Opción A (Recomendado):** Descarga las imágenes y súbelas a un **CDN públic**o:
   - Cloudinary (https://cloudinary.com) - GRATIS
   - Imgix (https://imgix.com)
   - AWS S3
   - Google Cloud Storage

7. **Opción B:** Copia la URL pública de Airtable en un campo de texto llamado **"Imagen URL Publica"** o similar

### Paso 4: Actualizar el Código (si cambias campo de imagen)
Si cambias el nombre del campo en Airtable, actualiza la línea 442 en `airtableService.ts`:

```typescript
const candidates = [
  f['Imagenurl'], f['ImagenUrl'], f['imagenurl'], f['imagenUrl'], // ← Nombre real del campo
  f['Imagen'], f['Imagen Principal'], ...
];
```

## 📝 Mapeo Actual de Campos de Imagen

El código busca imágenes en este orden:
```
1. Imagenurl / ImagenUrl / imagenurl / imagenUrl (Campo real)
2. Imagen / Imagen Principal / Imagen_Principal
3. Image / Images
4. Foto / Fotos
5. Galeria / Galería / Gallery
6. Attachments / Attachment
7. Media / media
8. Pictures / pictures / Photo / photo / Photos / photos
```

## 🚀 Próximos Pasos (Orden de Recomendación)

### Nivel 1 (5 min) - Quick Fix
- ✅ Ya hecho: Mejoramos los fallbacks de Unsplash
- Ahora: Verifica que al menos los placeholders se vean en producción

### Nivel 2 (15 min) - Verificar Airtable
- Revisar si el campo "Imagenurl" tiene URLs públicas
- Si no, copiar manualmente URLs públicas de Airtable

### Nivel 3 (30 min) - Usar CDN
- Crear cuenta en Cloudinary (gratis)
- Subir todas las imágenes
- Actualizar URLs en Airtable con enlaces de Cloudinary

### Nivel 4 (1 hora) - Automatización
- Crear Automation en Airtable o Zapier
- Cuando se cargue una imagen en Airtable, enviarla automáticamente a CDN
- Guardar URL del CDN en campo "Imagen URL Publica"

## 🔗 Recursos Útiles

| Recurso | URL |
|---------|-----|
| Cloudinary Free | https://cloudinary.com/users/register/free |
| Airtable API Attachments | https://airtable.com/api |
| Unsplash (Fallbacks) | https://unsplash.com |
| Render Docs | https://render.com/docs |

## 📊 Checklist de Diagnóstico

- [ ] ¿El campo de imagen en Airtable es tipo "Attachment"?
- [ ] ¿Las URLs comienzan con `https://dl.airtable.com/` o `https://<base>.airtable.com/`?
- [ ] ¿Se pueden abrir las URLs en una pestaña nueva?
- [ ] ¿El navegador no muestra errores 403/401 de permiso?
- [ ] ¿En producción (Render) aparecen al menos los placeholders?

## 🐛 Si Aún Hay Problemas

1. **Abre la consola del navegador** (F12)
2. Ve a la pestaña **Network**
3. Recarga la página
4. **Busca fallidas** (errores en rojo)
5. Haz screenshot y comparte el error exacto

Ej:
```
GET https://dl.airtable.com/xxx 
Status: 403 Forbidden
```

---

**Status:** 🟡 Parcialmente resuelto (fallbacks aplicados)  
**Acción:** Revisar URLs en Airtable  
**Prioridad:** Media  
**Última actualización:** 17 Enero 2026
