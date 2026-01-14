# 🎵 GuanaGO x RIMM Cluster: Estrategia NFT & Artistas

> **Documento Estratégico** - Última actualización: Enero 2026

---

## 📋 Resumen Ejecutivo

**GuanaGO** es una super-app turística para San Andrés Isla que integra servicios de viaje, experiencias culturales y un ecosistema de recompensas blockchain. El **RIMM Cluster** (Red de Industrias Musicales y Creativas del Caribe) se integra como vertical de entretenimiento, permitiendo a artistas locales monetizar su trabajo a través de NFTs y experiencias exclusivas.

### Propuesta de Valor
- **Turistas**: Descubren artistas locales, compran NFTs coleccionables, acceden a experiencias VIP
- **Artistas**: Nueva fuente de ingresos, alcance global, royalties automáticos
- **GuanaGO**: Comisión del 15% en cada transacción, diferenciación competitiva
- **Clúster RIMM**: 15% para reinversión en el ecosistema musical local

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        GUANAGO APP                              │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript + Tailwind)                       │
│  ├── Home.tsx (Sección Caribbean Night)                         │
│  ├── RimmCluster.tsx (Eventos y Artistas)                       │
│  ├── ArtistDetail.tsx (Perfil público del artista)              │
│  └── AdminArtistas.tsx (Gestión y Onboarding)                   │
├─────────────────────────────────────────────────────────────────┤
│  Backend (Node.js + Express)                                    │
│  └── Airtable como base de datos                                │
├─────────────────────────────────────────────────────────────────┤
│  Blockchain Layer                                               │
│  ├── Hedera Hashgraph (NFTs + Tokens)                           │
│  └── IPFS (Almacenamiento descentralizado)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Modelo de Revenue Share

| Participante | Porcentaje | Descripción |
|-------------|-----------|-------------|
| **Artista** | 70% | Creador del contenido/experiencia |
| **GuanaGO** | 15% | Plataforma y tecnología |
| **Clúster RIMM** | 15% | Reinversión en el ecosistema |

### Ejemplo Práctico
Si un NFT se vende por **$100,000 COP**:
- Artista recibe: $70,000 COP
- GuanaGO recibe: $15,000 COP
- Clúster RIMM recibe: $15,000 COP

---

## 🎨 Tipos de Productos NFT

### Categoría: Digital
| Tipo | Descripción | Precio Sugerido |
|------|-------------|-----------------|
| `nft_musica` | Canción tokenizada con royalties | $50,000 - $500,000 COP |
| `nft_arte` | Obra visual digital | $100,000 - $2,000,000 COP |
| `nft_video` | Video musical exclusivo | $80,000 - $800,000 COP |
| `nft_coleccionable` | Edición limitada coleccionable | $30,000 - $300,000 COP |

### Categoría: Experiencias
| Tipo | Descripción | Precio Sugerido |
|------|-------------|-----------------|
| `cena_artista` | Cena privada con el artista | $500,000 - $2,000,000 COP |
| `clase_privada` | Masterclass 1:1 | $300,000 - $1,000,000 COP |
| `tour_privado` | Recorrido por lugares del artista | $200,000 - $800,000 COP |
| `backstage` | Acceso backstage en concierto | $150,000 - $500,000 COP |

### Categoría: Acceso
| Tipo | Descripción | Precio Sugerido |
|------|-------------|-----------------|
| `membresia` | Membresía fan club anual | $100,000 - $500,000 COP |
| `early_access` | Acceso anticipado a lanzamientos | $50,000 - $200,000 COP |
| `meet_greet` | Encuentro con el artista | $200,000 - $800,000 COP |

### Categoría: Físico
| Tipo | Descripción | Precio Sugerido |
|------|-------------|-----------------|
| `merchandise` | Productos físicos firmados | $80,000 - $300,000 COP |
| `vinilo` | Disco de vinilo edición limitada | $150,000 - $500,000 COP |
| `poster_firmado` | Póster autografiado | $50,000 - $150,000 COP |

---

## 🚀 Proceso de Onboarding de Artistas

### Flujo Paso a Paso

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PROSPECTO   │───▶│ NEGOCIACIÓN  │───▶│   ACTIVO     │───▶│   MINTEO     │
│              │    │              │    │              │    │              │
│ - Contacto   │    │ - Contrato   │    │ - Onboarding │    │ - NFT Live   │
│ - Interés    │    │ - Términos   │    │ - Contenido  │    │ - Ventas     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### Checklist de Requisitos (Obligatorios *)

#### 📜 Legal
- [x] **Contrato de Colaboración*** - Acuerdo de distribución 70/15/15
- [x] **Cesión de Derechos Digitales*** - Autorización para NFTs
- [x] **Identificación Verificada*** - Cédula o pasaporte
- [x] **Declaración de Originalidad*** - Confirmar autoría

#### 🎨 Contenido
- [x] **Foto Profesional*** - Imagen de perfil HD
- [x] **Biografía Artística*** - Texto 100-300 palabras
- [x] **Archivo Musical (WAV/MP3)*** - Alta calidad
- [x] **Cover Art*** - Imagen 1000x1000 mínimo
- [ ] Video Promocional - Opcional

#### 💳 Financiero
- [x] **Datos Bancarios*** - Cuenta para pagos tradicionales
- [ ] RUT o Documento Fiscal - Si aplica

#### ⛓️ Blockchain
- [ ] Wallet Hedera Creada - Para royalties crypto
- [ ] KYC Verificado - Verificación blockchain

---

## 🗄️ Estructura de Base de Datos (Airtable)

### Tabla: `Artistas_Portafolio`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Artista_ID` | Link | Referencia a tabla Artistas principal |
| `Nombre_Artistico` | Text | Nombre de escenario |
| `Estado_Gestion` | Select | prospecto / en_negociacion / activo / pausado / terminado |
| `Porcentaje_Artista` | Number | Default: 70 |
| `Porcentaje_GuanaGO` | Number | Default: 15 |
| `Porcentaje_Cluster` | Number | Default: 15 |
| `Contrato_Firmado` | Checkbox | ¿Contrato vigente? |
| `Fecha_Contrato` | Date | Fecha de firma |
| `Wallet_Hedera` | Text | 0.0.XXXXX |
| `Productos_Activos` | Count | Productos publicados |
| `Ventas_Totales` | Rollup | Sum de ventas |

### Tabla: `Productos_Artista`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Producto_ID` | Autonumber | ID único |
| `Artista_ID` | Link | Referencia al artista |
| `Nombre` | Text | Nombre del producto |
| `Tipo` | Select | nft_musica, cena_artista, etc. |
| `Categoria` | Select | digital / fisico / experiencia / acceso |
| `Precio_COP` | Currency | Precio en pesos |
| `Precio_GUANA` | Number | Precio en GUANA Points (opcional) |
| `Stock` | Number | -1 = ilimitado |
| `IPFS_CID` | Text | Hash de archivo en IPFS |
| `Hedera_Token_ID` | Text | 0.0.XXXXX (si es NFT) |
| `Activo` | Checkbox | ¿Visible en marketplace? |

### Tabla: `Ventas_Artista`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ID_Venta` | Text | VNT-YYYYMMDD-XXXX |
| `Producto_ID` | Link | Producto vendido |
| `Comprador_ID` | Link | Usuario comprador |
| `Precio_Total` | Currency | Monto total |
| `Monto_Artista` | Currency | 70% del total |
| `Monto_GuanaGO` | Currency | 15% del total |
| `Monto_Cluster` | Currency | 15% del total |
| `Metodo_Pago` | Select | tarjeta / pse / crypto / guana_points |
| `Estado_Pago` | Select | pendiente / pagado / fallido |
| `Hedera_TX_ID` | Text | ID transacción blockchain |

---

## ⛓️ Integración Blockchain (Hedera Hashgraph)

### ¿Por qué Hedera?
- ✅ **Bajo costo**: ~$0.0001 USD por transacción
- ✅ **Alta velocidad**: 10,000+ TPS
- ✅ **Eco-friendly**: Carbon negative
- ✅ **Enterprise-grade**: Gobernado por Google, IBM, Boeing, etc.

### Flujo de Minteo NFT

```
1. Artista sube contenido
        ↓
2. Contenido se sube a IPFS (Pinata)
        ↓
3. Se genera metadata JSON con IPFS CID
        ↓
4. Se crea NFT en Hedera (HTS)
        ↓
5. Token ID se guarda en Airtable
        ↓
6. NFT aparece en marketplace
```

### Estructura de Metadata NFT
```json
{
  "name": "Reggae Sunrise - Edición Coleccionista",
  "description": "Canción original de Jah Melody, grabada en San Andrés",
  "image": "ipfs://Qm...",
  "animation_url": "ipfs://Qm...",
  "attributes": [
    { "trait_type": "Artista", "value": "Jah Melody" },
    { "trait_type": "Género", "value": "Reggae" },
    { "trait_type": "Año", "value": "2026" },
    { "trait_type": "Edición", "value": "1 de 100" }
  ],
  "properties": {
    "artist_wallet": "0.0.123456",
    "royalty_percentage": 10,
    "guanago_product_id": "PROD-001"
  }
}
```

---

## 📱 Páginas de la App

### Para Turistas
| Página | Ruta | Descripción |
|--------|------|-------------|
| Home | `HOME` | Sección Caribbean Night visible |
| RIMM Cluster | `RIMM_CLUSTER` | Eventos y artistas del clúster |
| Detalle Artista | `ARTIST_DETAIL` | Perfil, productos, NFTs |
| Detalle Evento | `MUSIC_EVENT_DETAIL` | Evento con lineup |

### Para Administradores
| Página | Ruta | Descripción |
|--------|------|-------------|
| Admin Dashboard | `ADMIN_DASHBOARD` | Panel general (botón Artistas) |
| Caribbean Night | `ADMIN_CARIBBEAN_NIGHT` | Reservas y eventos |
| **Gestión Artistas** | `ADMIN_ARTISTAS` | Portafolio, productos, ventas, onboarding |

---

## 🎯 Roadmap de Implementación

### Fase 1: Fundamentos (Completado ✅)
- [x] Estructura de datos en Airtable
- [x] Interfaces TypeScript
- [x] Funciones CRUD en airtableService.ts
- [x] Página AdminArtistas con tabs
- [x] Checklist de onboarding

### Fase 2: Contenido (En Progreso 🔄)
- [ ] Crear tablas en Airtable manualmente
- [ ] Agregar primeros 3-5 artistas de prueba
- [ ] Subir contenido demo a IPFS
- [ ] Diseñar landing pages de artistas

### Fase 3: Blockchain (Próximo 📅)
- [ ] Configurar cuenta Hedera Testnet
- [ ] Integrar Hedera SDK
- [ ] Crear primer NFT de prueba
- [ ] Implementar compra con wallet

### Fase 4: Monetización (Futuro 🚀)
- [ ] Integrar pasarela de pagos (Wompi/ePayco)
- [ ] Activar compras con GUANA Points
- [ ] Dashboard de analytics para artistas
- [ ] Sistema de royalties automáticos

---

## 💡 Casos de Uso Ejemplo

### Caso 1: Turista compra NFT musical
1. Turista visita sección Caribbean Night
2. Descubre artista "Jah Melody"
3. Ve NFT "Reggae Sunrise" por $150,000 COP
4. Compra con tarjeta de crédito
5. Recibe NFT en su wallet GuanaGO
6. Puede revender, coleccionar o usar como acceso VIP

### Caso 2: Turista reserva cena con artista
1. Turista ve experiencia "Cena con Jah Melody" por $800,000 COP
2. Selecciona fecha disponible
3. Paga y recibe confirmación
4. NFT de acceso se genera automáticamente
5. El día del evento, muestra NFT como ticket

### Caso 3: Artista recibe pago
1. Venta registrada en sistema
2. 70% se transfiere a cuenta bancaria del artista
3. 15% queda en cuenta GuanaGO
4. 15% se deposita en fondo RIMM
5. Si hay wallet Hedera, opción de recibir en crypto

---

## 📞 Contacto y Soporte

- **Email**: admin@guanago.co
- **WhatsApp**: +57 XXX XXX XXXX
- **Documentación técnica**: [ARCHITECTURE_MAP.md](./ARCHITECTURE_MAP.md)
- **Guía de inicio**: [GUIA_INICIO_BACKEND.md](./GUIA_INICIO_BACKEND.md)

---

*Este documento es confidencial y propiedad de GuanaGO. Actualizado enero 2026.*
