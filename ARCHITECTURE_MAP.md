
# 🗺️ Guana Go: Arquitectura Técnica Pro (V3.0)


Instalamos viual studio con la funcion de github Copilot.
con este servicio  y un diseño previo en google stitch + AI Studio de google + la ayuda de un Gem de gemini logre conetar y probar tanto en render como en mi sitio web de wordpress con divi builder ademas de escenarios de make con ias como Groq, Chatgpt, Gemini hacer consultas para crear un bot que pudiera hacer las distintas operaciones del Cerebro.

app / pwa / pagina web responsive. 

[NÚCLEO CENTRAL: EL "BRAIN" (Airtable + Make)]

Memoria: Airtable (Tours, Procedimientos RAG, Logs de Trazabilidad).
Procesamiento: Escenarios de Make conectando con Groq (velocidad) y Gemini (análisis profundo).
Salida: JSON estandarizado hacia la PWA.

[FRONTEND: LA CARA (VS Code + GitHub)]
PWA: React/Vite (lo que estás subiendo a Render).
Componentes: Mapbox (Mapa interactivo), Wallet (Hedera), Directory (Aliados).
Integración: Llamadas API hacia los webhooks de Make.

[CANALES DE DISTRIBUCIÓN]
B2C: WordPress/Divi (Informativo, atrae tráfico). Turista y Residente
Operación: PWA GuanaGo (Reserva real, validación QR, $GUANA).
B2B: Dashboard para el Secretario de Turismo y Aliados (Locales).

## 🧠 1. El Cerebro (Data Flow - Proxy Security)
Para garantizar la integridad y seguridad, la App no se conecta directamente a Airtable.
1. **App**: Envía peticiones firmadas con un `actionID` a **Make.com**.
2. **Make.com (Proxy)**: 
   - Inyecta las API Keys de forma segura.  (confirmar con Agente Ia que elementos de make les suministro o si creo un escenario para facilitar dicha carga usando un webhook u otra de las funciones.)
   - Realiza cálculos de agregación Basado en la lista de servicios que tenemos en make se crea una base de datos D1 que tiene la tarifa y confirma cupo o disponibilidad, ya sea en tiempo real o con una alerta de confirmacion que luego se envia al aliado operardor (ej: sumar cupos ocupados).
   - Registra transacciones en el Ledger de Hedera.
3. **Tablas Reales (Airtable SAI)**:
   - `ServiciosTuristicos SAI`: Maestro de tours, precios y capacidad.
   - `Directorio SAI`: Comercios y restaurantes para el buscador.
   - `Taxis SAI`: Tarifas oficiales por zona.
   - `Procedimientos Rag`: Base de conocimiento para el asistente IA.

## 📦 2. Sistema de Inventario y Cupos
El inventario es dinámico y se calcula en el servidor (Make) bajo esta lógica:
- **Disponibilidad** = `Capacidad_Diaria` - `Cupos_Ocupados`.
- **Validación Preventiva**: El DatePicker bloquea fechas donde `Disponibilidad <= 0`.
- **Atomicidad**: Al confirmar pago, el flujo Make suma `personas_reservadas` al campo `Cupos_Ocupados` inmediatamente.

## 🤖 3. Inteligencia Artificial (RAG Logístico)
El Chatbot "Guana" utiliza **Retrieval-Augmented Generation**:
- **Query**: El mensaje del usuario se envía a Make.
- **Contexto**: Make busca en la tabla `Procedimientos Rag` palabras clave (cancelación, seguro, mora).
- **Prompt**: El modelo (Gemini) recibe el texto del SOP oficial como "Base de Verdad" antes de responder.

## 📍 4. Estructura de Navegación y Rutas

### 🟢 Nivel 1: Turista (público)
- `HOME`: Buscador (Directorio SAI) y Categorías de Tours.
- `MAP`: **[SUSPENDIDO TEMPORALMENTE]** Se muestra placeholder informativo.
- `WALLET`: Gestión de tokens $GUANA y fidelización.
- `CART/CHECKOUT`: Flujo de reserva con notarización Hedera.

### 🔵 Nivel 2: Partner (Operador Verificado)
- `DASHBOARD`: Métricas de ventas y acceso a servicios.
- `RESERVATIONS`: Lista de clientes con control de estado (Confirmar/Cancelar).
- `OPERATIONS`: Escáner QR para canje de servicios en muelle/hotel.
- `PAYMENTS`: Historial de liquidaciones y saldo para reventa.

### 🟣 Nivel 3: Super Admin
- `ADMIN_DASHBOARD`: Salud del sistema (Usuarios totales, Ingresos COP).
- `ADMIN_USERS`: Aprobación manual de nuevos operadores.
- `ADMIN_SERVICES`: Control de calidad y visibilidad del catálogo global.
- `ADMIN_FINANCE`: Auditoría de canjes de tokens y pagos.

## ⚠️ 5. Nota sobre Mapas y Geolocalización
La integración con **Mapbox GL JS** y la API de **Geolocalización** nativa del navegador han sido suspendidas en esta versión para optimizar el rendimiento inicial y simplificar el flujo de despliegue. Se planea su reactivación en la V4.0 mediante desarrollo en entorno local (Visual Studio).

## 🛡️ 6. Blockchain (Auditoría Inmutable)
Toda reserva confirmada genera un registro en **Hedera Network**.
- El usuario recibe un `transactionID` verificable en **HashScan**.
