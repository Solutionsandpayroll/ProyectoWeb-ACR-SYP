import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createHash } from 'crypto';

const SUBCATEGORIAS = [
  'Acción de mejora',
  'Deficiencia en Documentación',
  'Desviación en Ejecución de Pago',
  'Falta de Revisión o Validación',
  'Inconsistencias de Cálculo',
  'Incumplimiento en indicadores',
  'Omisión en el Proceso',
  'Retraso o Fallas de Comunicación',
] as const;

type Subcategoria = (typeof SUBCATEGORIAS)[number];

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const normalizeText = (value: string | null | undefined): string =>
  (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

const buildHash = (descripcion: string, causasInmediatas: string, causasRaiz: string): string =>
  createHash('sha256')
    .update(`${normalizeText(descripcion)}\n${normalizeText(causasInmediatas)}\n${normalizeText(causasRaiz)}`)
    .digest('hex');

const toSubcategoria = (value: string): Subcategoria | null => {
  const normalized = normalizeText(value);
  const found = SUBCATEGORIAS.find((s) => normalizeText(s) === normalized);
  return found ?? null;
};

const fallbackSubcategoria = (text: string): Subcategoria => {
  const t = normalizeText(text);
  if (/(indicador|kpi|meta)/.test(t)) return 'Incumplimiento en indicadores';
  if (/(excel|formula|calculo|liquidacion|nomina|valor incorrecto)/.test(t)) return 'Inconsistencias de Cálculo';
  if (/(pago|tesorer|ica|pse|transferencia)/.test(t)) return 'Desviación en Ejecución de Pago';
  if (/(revision|validacion|verificacion|doble verificacion)/.test(t)) return 'Falta de Revisión o Validación';
  if (/(document|procedimiento|instructivo|checklist|registro)/.test(t)) return 'Deficiencia en Documentación';
  if (/(comunic|notific|correo|whatsapp|seguimiento tardio|retraso)/.test(t)) return 'Retraso o Fallas de Comunicación';
  if (/(mejora continua|accion de mejora|oportunidad de mejora)/.test(t)) return 'Acción de mejora';
  return 'Omisión en el Proceso';
};

const extractJsonObject = (raw: string): string => {
  const cleaned = raw.replace(/```json|```/gi, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return cleaned;
  return cleaned.slice(first, last + 1);
};

const ensureClassificationTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS acr_subcategorias_ia (
      id SERIAL PRIMARY KEY,
      acr_id INTEGER UNIQUE REFERENCES acr_registros(id) ON DELETE CASCADE,
      subcategoria VARCHAR(120) NOT NULL,
      confidence NUMERIC(5,4) DEFAULT 0.0,
      content_hash CHAR(64) NOT NULL,
      model VARCHAR(80) NOT NULL DEFAULT 'gemini-2.5-flash',
      is_manual_override BOOLEAN NOT NULL DEFAULT false,
      classified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS acr_subcategorias_ia_subcategoria_idx
    ON acr_subcategorias_ia (subcategoria)
  `;
};

const classifyWithGemini = async (input: {
  proceso: string;
  tipoAccion: string;
  descripcion: string;
  causasInmediatas: string;
  causasRaiz: string;
}): Promise<{ subcategoria: Subcategoria; confidence: number; model: string }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const text = `${input.descripcion}\n${input.causasInmediatas}\n${input.causasRaiz}`;
    return { subcategoria: fallbackSubcategoria(text), confidence: 0.55, model: 'fallback-rules' };
  }

  const prompt = `Clasifica un ACR en UNA sola subcategoria del siguiente catalogo (exactamente una):
- Acción de mejora
- Deficiencia en Documentación
- Desviación en Ejecución de Pago
- Falta de Revisión o Validación
- Inconsistencias de Cálculo
- Incumplimiento en indicadores
- Omisión en el Proceso
- Retraso o Fallas de Comunicación

Responde solo JSON valido con este formato exacto:
{"subcategoria":"...","confidence":0.0}

Reglas:
- confidence entre 0 y 1
- no incluyas texto adicional
- si hay duda, escoge la categoria mas probable

Datos del ACR:
Proceso: ${input.proceso || 'No informado'}
Tipo de accion: ${input.tipoAccion || 'No informado'}
Descripcion: ${input.descripcion || 'No informada'}
Causas inmediatas: ${input.causasInmediatas || 'No informadas'}
Causas raiz: ${input.causasRaiz || 'No informadas'}`;

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 300,
      },
    }),
  });

  if (!response.ok) {
    const text = `${input.descripcion}\n${input.causasInmediatas}\n${input.causasRaiz}`;
    return { subcategoria: fallbackSubcategoria(text), confidence: 0.55, model: 'fallback-rules' };
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const parsedRaw = extractJsonObject(text);

  try {
    const parsed = JSON.parse(parsedRaw) as { subcategoria?: string; confidence?: number };
    const subcategoria = parsed.subcategoria ? toSubcategoria(parsed.subcategoria) : null;
    const confidence = Number(parsed.confidence);
    if (!subcategoria) throw new Error('invalid category');
    return {
      subcategoria,
      confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.65,
      model: 'gemini-2.5-flash',
    };
  } catch {
    const fallback = fallbackSubcategoria(`${input.descripcion}\n${input.causasInmediatas}\n${input.causasRaiz}`);
    return { subcategoria: fallback, confidence: 0.55, model: 'fallback-rules' };
  }
};

export async function GET(req: NextRequest) {
  try {
    await ensureClassificationTable();

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year'); // e.g. "2026" or "all"
    const mode      = searchParams.get('mode');  // "compare" or null

    // Always fetch available years for the year-selector UI
    const yearsRows = await sql`
      SELECT DISTINCT EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int AS anio
      FROM acr_registros
      ORDER BY anio
    `;
    const availableYears = (yearsRows as Array<{ anio: number }>).map((r) => r.anio);

    /* ── COMPARE MODE ─────────────────────────────────────────────────────── */
    if (mode === 'compare') {
      const [totalPorAnio, costoPorAnio, tipoAccionPorAnio, estadoPorAnio] = await Promise.all([
        sql`
          SELECT EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int AS anio,
                 COUNT(*)::int AS value
          FROM acr_registros
          GROUP BY anio ORDER BY anio
        `,
        sql`
          SELECT EXTRACT(YEAR FROM COALESCE(r.fecha_registro, r.created_at::date))::int AS anio,
                 ROUND((COALESCE(SUM(c.costo_total), 0) / 1000000.0)::numeric, 3)::float AS value
          FROM acr_registros r
          LEFT JOIN costos_asociados c ON c.acr_id = r.id
          GROUP BY anio ORDER BY anio
        `,
        sql`
          SELECT EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int AS anio,
                 tipo_accion,
                 COUNT(*)::int AS value
          FROM acr_registros
          GROUP BY anio, tipo_accion ORDER BY anio, value DESC
        `,
        sql`
          SELECT EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int AS anio,
                 estado,
                 COUNT(*)::int AS value
          FROM acr_registros
          GROUP BY anio, estado ORDER BY anio, value DESC
        `,
      ]);

      return NextResponse.json({ mode: 'compare', availableYears, totalPorAnio, costoPorAnio, tipoAccionPorAnio, estadoPorAnio });
    }

    /* ── NORMAL MODE (single year or all) ────────────────────────────────── */
    const yearNum = yearParam && yearParam !== 'all' ? parseInt(yearParam, 10) : null;

    const [
      porTipoAccion,
      porProceso,
      porCliente,
      porEstado,
      costoPorProceso,
      porProcesoYFuente,
      costoTotal,
    ] = await Promise.all([
      yearNum !== null
        ? sql`SELECT tipo_accion AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int = ${yearNum}
              GROUP BY tipo_accion ORDER BY value DESC`
        : sql`SELECT tipo_accion AS label, COUNT(*)::int AS value FROM acr_registros
              GROUP BY tipo_accion ORDER BY value DESC`,

      yearNum !== null
        ? sql`SELECT proceso AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE proceso IS NOT NULL AND proceso <> ''
                AND EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int = ${yearNum}
              GROUP BY proceso ORDER BY value DESC LIMIT 15`
        : sql`SELECT proceso AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE proceso IS NOT NULL AND proceso <> ''
              GROUP BY proceso ORDER BY value DESC LIMIT 15`,

      yearNum !== null
        ? sql`SELECT cliente AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE cliente IS NOT NULL AND cliente <> ''
                AND EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int = ${yearNum}
              GROUP BY cliente ORDER BY value DESC LIMIT 15`
        : sql`SELECT cliente AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE cliente IS NOT NULL AND cliente <> ''
              GROUP BY cliente ORDER BY value DESC LIMIT 15`,

      yearNum !== null
        ? sql`SELECT estado AS label, COUNT(*)::int AS value FROM acr_registros
              WHERE EXTRACT(YEAR FROM COALESCE(fecha_registro, created_at::date))::int = ${yearNum}
              GROUP BY estado`
        : sql`SELECT estado AS label, COUNT(*)::int AS value FROM acr_registros GROUP BY estado`,

      yearNum !== null
        ? sql`SELECT r.proceso AS label,
                     ROUND((COALESCE(SUM(c.costo_total), 0) / 1000000.0)::numeric, 3)::float AS value
              FROM acr_registros r LEFT JOIN costos_asociados c ON c.acr_id = r.id
              WHERE r.proceso IS NOT NULL AND r.proceso <> ''
                AND EXTRACT(YEAR FROM COALESCE(r.fecha_registro, r.created_at::date))::int = ${yearNum}
              GROUP BY r.proceso ORDER BY value DESC LIMIT 10`
        : sql`SELECT r.proceso AS label,
                     ROUND((COALESCE(SUM(c.costo_total), 0) / 1000000.0)::numeric, 3)::float AS value
              FROM acr_registros r LEFT JOIN costos_asociados c ON c.acr_id = r.id
              WHERE r.proceso IS NOT NULL AND r.proceso <> ''
              GROUP BY r.proceso ORDER BY value DESC LIMIT 10`,

      yearNum !== null
        ? sql`SELECT r.proceso,
             COALESCE(cls.subcategoria, 'Sin clasificar') AS subcategoria,
             COUNT(*)::int AS conteo
          FROM acr_registros r
          LEFT JOIN acr_subcategorias_ia cls ON cls.acr_id = r.id
          WHERE r.proceso IS NOT NULL
                AND EXTRACT(YEAR FROM COALESCE(r.fecha_registro, r.created_at::date))::int = ${yearNum}
          GROUP BY r.proceso, COALESCE(cls.subcategoria, 'Sin clasificar')
          ORDER BY conteo DESC, r.proceso`
        : sql`SELECT r.proceso,
             COALESCE(cls.subcategoria, 'Sin clasificar') AS subcategoria,
             COUNT(*)::int AS conteo
          FROM acr_registros r
          LEFT JOIN acr_subcategorias_ia cls ON cls.acr_id = r.id
          WHERE r.proceso IS NOT NULL
          GROUP BY r.proceso, COALESCE(cls.subcategoria, 'Sin clasificar')
          ORDER BY conteo DESC, r.proceso`,

      yearNum !== null
        ? sql`SELECT COALESCE(SUM(c.costo_total), 0)::float AS total
              FROM acr_registros r LEFT JOIN costos_asociados c ON c.acr_id = r.id
              WHERE EXTRACT(YEAR FROM COALESCE(r.fecha_registro, r.created_at::date))::int = ${yearNum}`
        : sql`SELECT COALESCE(SUM(costo_total), 0)::float AS total FROM costos_asociados`,
    ]);

    const totalCosto = (costoTotal[0]?.total ?? 0) as number;
    const totalRows  = (porProcesoYFuente as Array<{ proceso: string; subcategoria: string; conteo: number }>)
      .reduce((acc, r) => acc + r.conteo, 0);

    return NextResponse.json({
      availableYears,
      porTipoAccion,
      porProceso,
      porCliente,
      porEstado,
      costoPorProceso,
      porProcesoYFuente,
      totalCosto,
      totalRows,
    });
  } catch (error) {
    console.error('GET /api/panel-analisis error:', error);
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureClassificationTable();

    const body = await req.json().catch(() => ({}));
    const year = Number(body?.year);
    const forceReclassifyAll = Boolean(body?.forceReclassifyAll);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Parametro year invalido' }, { status: 400 });
    }

    const acrRows = await sql`
      SELECT
        r.id,
        r.consecutivo,
        r.proceso,
        r.tipo_accion,
        COALESCE(r.descripcion, '') AS descripcion,
        COALESCE((
          SELECT string_agg(ci.descripcion, ' || ' ORDER BY ci.orden)
          FROM causas_inmediatas ci
          WHERE ci.acr_id = r.id
        ), '') AS causas_inmediatas,
        COALESCE((
          SELECT string_agg(cr.descripcion, ' || ' ORDER BY cr.orden)
          FROM causas_raiz cr
          WHERE cr.acr_id = r.id
        ), '') AS causas_raiz
      FROM acr_registros r
      WHERE EXTRACT(YEAR FROM COALESCE(r.fecha_registro, r.created_at::date))::int = ${year}
      ORDER BY r.id
    ` as Array<{
      id: number;
      consecutivo: string;
      proceso: string;
      tipo_accion: string;
      descripcion: string;
      causas_inmediatas: string;
      causas_raiz: string;
    }>;

    if (acrRows.length === 0) {
      return NextResponse.json({
        success: true,
        year,
        stats: {
          total: 0,
          evaluated: 0,
          reclassified: 0,
          reused: 0,
          unchanged: 0,
        },
      });
    }

    const existingRows = await sql`
      SELECT acr_id, content_hash, subcategoria, is_manual_override
      FROM acr_subcategorias_ia
      WHERE acr_id = ANY(${acrRows.map((r) => r.id)})
    ` as Array<{
      acr_id: number;
      content_hash: string;
      subcategoria: string;
      is_manual_override: boolean;
    }>;

    const existingByAcr = new Map(existingRows.map((r) => [r.acr_id, r]));

    let unchanged = 0;
    let reused = 0;
    let reclassified = 0;

    for (const row of acrRows) {
      const currentHash = buildHash(row.descripcion, row.causas_inmediatas, row.causas_raiz);
      const existing = existingByAcr.get(row.id);

      if (existing?.is_manual_override && !forceReclassifyAll) {
        reused += 1;
        continue;
      }

      const needsClassification =
        forceReclassifyAll || !existing || existing.content_hash !== currentHash;

      if (!needsClassification) {
        unchanged += 1;
        continue;
      }

      const classified = await classifyWithGemini({
        proceso: row.proceso,
        tipoAccion: row.tipo_accion,
        descripcion: row.descripcion,
        causasInmediatas: row.causas_inmediatas,
        causasRaiz: row.causas_raiz,
      });

      await sql`
        INSERT INTO acr_subcategorias_ia (
          acr_id,
          subcategoria,
          confidence,
          content_hash,
          model,
          is_manual_override,
          classified_at,
          updated_at
        ) VALUES (
          ${row.id},
          ${classified.subcategoria},
          ${classified.confidence},
          ${currentHash},
          ${classified.model},
          false,
          NOW(),
          NOW()
        )
        ON CONFLICT (acr_id) DO UPDATE SET
          subcategoria = CASE
            WHEN acr_subcategorias_ia.is_manual_override THEN acr_subcategorias_ia.subcategoria
            ELSE EXCLUDED.subcategoria
          END,
          confidence = CASE
            WHEN acr_subcategorias_ia.is_manual_override THEN acr_subcategorias_ia.confidence
            ELSE EXCLUDED.confidence
          END,
          content_hash = EXCLUDED.content_hash,
          model = CASE
            WHEN acr_subcategorias_ia.is_manual_override THEN acr_subcategorias_ia.model
            ELSE EXCLUDED.model
          END,
          classified_at = CASE
            WHEN acr_subcategorias_ia.is_manual_override THEN acr_subcategorias_ia.classified_at
            ELSE EXCLUDED.classified_at
          END,
          updated_at = NOW()
      `;

      reclassified += 1;
    }

    return NextResponse.json({
      success: true,
      year,
      stats: {
        total: acrRows.length,
        evaluated: reclassified,
        reclassified,
        reused,
        unchanged,
      },
    });
  } catch (error) {
    console.error('POST /api/panel-analisis error:', error);
    return NextResponse.json({ error: 'Error al clasificar subcategorias' }, { status: 500 });
  }
}
