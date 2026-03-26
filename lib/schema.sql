-- ACR Database Schema
-- Project: proyecto-acr-syp | Neon PostgreSQL 17

-- Main ACR record (Section 1: General Info)
CREATE TABLE IF NOT EXISTS acr_registros (
  id SERIAL PRIMARY KEY,
  consecutivo VARCHAR(20) UNIQUE NOT NULL,
  fuente VARCHAR(100) NOT NULL,
  proceso VARCHAR(100) NOT NULL,
  cliente VARCHAR(200),
  fecha_apertura DATE NOT NULL,
  tipo_accion VARCHAR(100) NOT NULL,
  tratamiento TEXT,
  evaluacion_riesgo TEXT,
  descripcion TEXT,
  estado VARCHAR(50) DEFAULT 'Abierta',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Section 2: Correction Activities
CREATE TABLE IF NOT EXISTS actividades_correccion (
  id SERIAL PRIMARY KEY,
  acr_id INTEGER REFERENCES acr_registros(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  actividad TEXT NOT NULL,
  recursos TEXT[] DEFAULT '{}',      -- ['Financieros','Tecnológicos','Humanos']
  costo_total NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS responsables_correccion (
  id SERIAL PRIMARY KEY,
  actividad_id INTEGER REFERENCES actividades_correccion(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  nombre VARCHAR(200),
  cargo VARCHAR(100),
  horas NUMERIC(8,2) DEFAULT 0,
  fecha_inicio DATE,
  fecha_fin DATE,
  costo NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Section 3: Causes
CREATE TABLE IF NOT EXISTS causas_acr (
  id SERIAL PRIMARY KEY,
  acr_id INTEGER REFERENCES acr_registros(id) ON DELETE CASCADE,
  analisis TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS causas_inmediatas (
  id SERIAL PRIMARY KEY,
  acr_id INTEGER REFERENCES acr_registros(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS causas_raiz (
  id SERIAL PRIMARY KEY,
  acr_id INTEGER REFERENCES acr_registros(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Section 4: Action Plan
CREATE TABLE IF NOT EXISTS actividades_plan (
  id SERIAL PRIMARY KEY,
  acr_id INTEGER REFERENCES acr_registros(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  causas_asociadas TEXT[] DEFAULT '{}',
  costo_total NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS responsables_plan (
  id SERIAL PRIMARY KEY,
  actividad_plan_id INTEGER REFERENCES actividades_plan(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ejecucion', 'seguimiento')),
  nombre VARCHAR(200),
  cargo VARCHAR(100),
  horas NUMERIC(8,2) DEFAULT 0,
  fecha_inicio DATE,
  fecha_fin DATE,
  costo NUMERIC(12,2) DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'Abierta',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Section 5: Associated Costs
CREATE TABLE IF NOT EXISTS costos_asociados (
  id SERIAL PRIMARY KEY,
  acr_id INTEGER REFERENCES acr_registros(id) ON DELETE CASCADE UNIQUE,
  -- Auto-calculated
  costo_correccion      NUMERIC(12,2) DEFAULT 0,
  costo_plan_accion     NUMERIC(12,2) DEFAULT 0,  -- ejecución
  costo_plan_seguimiento NUMERIC(12,2) DEFAULT 0,
  -- Manual inputs
  perdida_ingresos      NUMERIC(12,2) DEFAULT 0,
  multas_sanciones      NUMERIC(12,2) DEFAULT 0,
  otros_costos_internos NUMERIC(12,2) DEFAULT 0,
  descuentos_cliente    NUMERIC(12,2) DEFAULT 0,
  otros_costos          NUMERIC(12,2) DEFAULT 0,
  -- Grand total
  costo_total           NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
