# Sistema de Gestión ACR — Solutions & Payroll

Plataforma web interna para la gestión de **Acciones Correctivas y de Registro (ACR)** y **Gestión de Documentos del Sistema (GDS)** de Solutions & Payroll S.A.S. Desarrollada con Next.js 16, Neon Postgres, Vercel Blob y Tailwind CSS.

---

## Módulos

### Módulo ACR — Acciones Correctivas y de Registro

Gestiona el ciclo de vida completo de las no conformidades, hallazgos y oportunidades de mejora del Sistema de Gestión Integrado (SGI).

**Flujo principal:**

1. **Formulario ACR** — Creación de un nuevo registro con:
   - Información general: fuente, proceso, cliente, tipo de acción, fechas, evaluación de riesgo, descripción
   - Actividades de corrección con responsables, horas, costos y evidencias
   - Análisis de causas inmediatas y causas raíz (metodología 5 Porqués asistida por IA)
   - Plan de acción: actividades con responsables de ejecución y seguimiento, fechas, costos y estado
   - Costos asociados: corrección, plan, pérdida de ingresos, multas, descuentos a cliente

2. **Historial ACR** — Tabla de todos los registros con filtros por estado, proceso, año y búsqueda de texto. Permite ver el detalle completo o editar un ACR existente directamente desde la vista.

3. **Panel de Análisis** — Dashboard con gráficas interactivas (Recharts):
   - ACR por tipo de acción, proceso, cliente y estado
   - Costo por proceso
   - Tabla de ACR por proceso y fuente
   - Comparativa anual: total de ACR, costos, tipo de acción y estado por año

4. **Control de Acciones de Seguimiento** — Vista consolidada de todas las actividades de ejecución y seguimiento pendientes y sus responsables, con columnas editables de responsable, fecha y estado.

5. **ACR Eliminadas** — Archivo de registros eliminados con su razón de eliminación y datos históricos.

**Cálculo de costos por cargo:**
- Los costos se calculan automáticamente como `(salario mensual / 180 horas) × horas trabajadas`.
- Se aplica la escala salarial vigente según la `fecha_registro` del ACR (escala antigua antes de 2025, escala nueva a partir de 2025).
- El cargo `Otro/Externo` permite ingresar un precio por hora manual.

**Análisis de causas con IA:**
- Botón "Analizar con IA" en el formulario que envía la descripción del problema a la API de **Google Gemini 2.5 Flash**.
- La IA propone un análisis de 5 Porqués, causas inmediatas y causas raíz, que el usuario puede editar antes de guardar.

---

### Módulo GDS — Gestión de Documentos del Sistema

Gestiona los cambios planificados al Sistema de Gestión.

**Funcionalidades:**
- Formulario de registro de cambios con: propósito, descripción, cambio planeado, tipo de cambio, consecuencias, plan de actividades y seguimiento
- Historial GDS con filtros y detalle expandible
- Control de cambios al sistema: log versionado de cambios realizados a la plataforma (visible para todos, editable solo por administradores)
- GDS Eliminadas: archivo de registros eliminados

---

## Autenticación y roles

- Sesión basada en **cookie HTTP-only** (`acr_auth`) con duración de 12 horas
- Dos roles:
  - **admin** — acceso total: crear, editar, eliminar registros y gestionar el control de cambios
  - **user** — acceso de solo lectura y creación, sin permisos de eliminación ni edición del control de cambios
- Las credenciales se configuran en `lib/auth.ts`

---

## Notificaciones por correo (Cron)

Dos endpoints protegidos por `Authorization: Bearer <CRON_SECRET>`:

### `POST /api/cron/notificaciones-acr`
Envía recordatorios a los responsables de proceso de ACRs abiertas. Configurable con la variable `NOTIFICATION_INTERVAL_MINUTES` (por defecto 1 440 min = 1 día). Evita spam con un registro de último envío por ACR en la tabla `control_acciones_seguimiento`.

### `POST /api/cron/actividades-pendientes`
Envía un resumen mensual a cada responsable individual con las actividades de ejecución y/o seguimiento que tiene pendientes (estado `Abierta` o `Parcial`). Configurable con `ACTIVIDADES_INTERVAL_MINUTES` (por defecto 10 080 min = 7 días). Registra envíos en la tabla `actividades_notificaciones`.

**Parámetros opcionales (query string):**
- `?force=1` — omite el control de intervalo y envía de todas formas
- `?dryrun=1` — ejecuta toda la lógica pero no escribe en DB ni envía correos reales

Los correos se envían con HTML + texto plano de fallback vía **Nodemailer / Gmail SMTP**.

---

## Evidencias (Vercel Blob)

- Las evidencias se suben a través de `POST /api/upload`
- Se valida tipo de archivo, extensión y tamaño máximo (10 MB)
- Los archivos se almacenan en **Vercel Blob** (modo privado) en la ruta `evidencias/`
- Las descargas se sirven exclusivamente a través de `GET /api/evidencias/download?url=...` con validación de sesión — las URLs de blob nunca se exponen directamente al navegador

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 + Framer Motion |
| Gráficas | Recharts 3 |
| Base de datos | Neon Postgres (serverless) |
| Almacenamiento | Vercel Blob (privado) |
| Email | Nodemailer + Gmail SMTP |
| IA | Google Gemini 2.5 Flash |
| Internacionalización | Traducción dinámica ES/EN vía `POST /api/translate` |
| Despliegue | Vercel (producción) / Virtualmin (cron scheduler) |

---

## Variables de entorno

Crear un archivo `.env.local` en la raíz con las siguientes variables:

```bash
# Base de datos (Neon Postgres)
DATABASE_URL=postgresql://...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Email (Outlook / Microsoft 365 SMTP)
OUTLOOK_SMTP_HOST=smtp.office365.com
OUTLOOK_SMTP_PORT=587
OUTLOOK_SMTP_SECURE=false
OUTLOOK_SMTP_USER=noreply@solutionsandpayroll.com
OUTLOOK_SMTP_PASS=tu_credencial_smtp
OUTLOOK_SMTP_FROM_NAME=Solutions & Payroll
OUTLOOK_SMTP_FROM_ADDRESS=noreply@solutionsandpayroll.com

# Cron (token secreto para los endpoints de notificación)
CRON_SECRET=tu_clave_secreta

# URL pública de la aplicación (sin barra final; se añade https:// automáticamente si falta)
NEXT_PUBLIC_APP_URL=acr.solutionsandpayroll.com

# Google Gemini (análisis de causas con IA)
GEMINI_API_KEY=AIza...

# Intervalo de notificaciones en minutos (opcional)
NOTIFICATION_INTERVAL_MINUTES=1440
ACTIVIDADES_INTERVAL_MINUTES=10080
```

---

## Estructura del proyecto

```
app/
├── login/                    # Página de inicio de sesión
├── dashboard/
│   ├── inicio/               # Selector de módulo (ACR / GDS)
│   ├── formulario-acr/       # Crear nuevo ACR
│   ├── historial-acr/        # Listado y detalle/edición de ACRs
│   │   └── [id]/             # Vista detalle + modo edición
│   ├── panel-analisis/       # Dashboard de análisis y gráficas
│   ├── control-acciones/     # Tabla de seguimiento de actividades
│   ├── acr-eliminadas/       # Archivo de ACRs eliminados
│   ├── formulario-gds/       # Crear nuevo GDS
│   ├── historial-gds/        # Listado GDS
│   ├── gds-dashboard/        # Dashboard GDS
│   ├── gds-control-cambios/  # Control de cambios GDS
│   ├── gds-eliminadas/       # Archivo GDS eliminados
│   └── control-cambios/      # Log de versiones del sistema
├── api/
│   ├── acr/                  # CRUD de registros ACR
│   ├── auth/                 # Login / logout / session
│   ├── control-acciones/     # Datos para la tabla de seguimiento
│   ├── control-cambios/      # Log de versiones
│   ├── cron/
│   │   ├── notificaciones-acr/       # Cron recordatorios ACR
│   │   └── actividades-pendientes/   # Cron actividades pendientes
│   ├── evidencias/           # Descarga segura de evidencias
│   ├── gemini-analisis/      # Análisis de causas con IA
│   ├── gds/                  # CRUD de registros GDS
│   ├── panel-analisis/       # Datos para el dashboard
│   ├── translate/            # Traducción ES/EN
│   └── upload/               # Subida de evidencias
lib/
├── auth.ts                   # Autenticación y sesión
├── cargo-scale.ts            # Escalas salariales por cargo y fecha
├── db.ts                     # Cliente Neon Postgres
├── email.ts                  # Configuración Nodemailer
├── responsables.ts           # Emails de responsables por nombre
└── email-templates/          # Plantillas HTML + texto para correos
components/
├── Header.tsx                # Cabecera de página con título y subtítulo
├── Sidebar.tsx               # Navegación lateral
├── StatCard.tsx              # Tarjeta de estadística
└── StatusBadge.tsx           # Badge de estado coloreado
types/
└── index.ts                  # Tipos compartidos (AcrRecord, AcrStatus…)
```

---

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

**Credenciales de desarrollo:**
- Admin: `admin` / `Admin2026!`
- Usuario: `usuario` / `Usuario2026!`

---

## Despliegue en producción

La aplicación se despliega en **Vercel** conectado al repositorio Git. Para aplicar cambios en producción:

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

El servidor **Virtualmin** (`acr.solutionsandpayroll.com`) ejecuta los crons con `curl`:

```bash
# Notificaciones ACR (diario a las 8:00)
0 8 * * * curl -s -X POST -H "Authorization: Bearer <CRON_SECRET>" https://acr.solutionsandpayroll.com/api/cron/notificaciones-acr

# Actividades pendientes (día 1 de cada mes a las 8:00)
0 8 1 * * curl -s -X POST -H "Authorization: Bearer <CRON_SECRET>" https://acr.solutionsandpayroll.com/api/cron/actividades-pendientes
```
