import { NextRequest, NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const EJEMPLO_1 = `
Situación: Pérdida de contrato con DISTRITECH COLOMBIA SAS por errores en Administración de Personal y Nómina (retención en la fuente, planilla de cesantías, información exógena, afiliaciones incorrectas a ARL, etc.)

Análisis 5 Porqués:
Por qué 1: No se garantiza el cumplimiento de políticas de doble verificación → Los colaboradores no aplican de forma sistemática la revisión cruzada antes de entregar.
Por qué 2: No hay puntos de control críticos en los procedimientos ADP y ADN → Los procedimientos vigentes no contemplan checkpoints obligatorios en las etapas de mayor riesgo.
Por qué 3: No existen mecanismos de trazabilidad claros → No hay bitácoras ni registros que permitan rastrear quién validó qué y en qué momento.
Por qué 4: No se aplicó proceso disciplinario ante errores humanos recurrentes → La gestión de errores se limitó a correcciones sin consecuencias formales.
Por qué 5: No hay cultura organizacional que integre procedimientos con correctivos disciplinarios → La organización carece de un sistema integrado que vincule incumplimientos con acciones correctivas formales.

Causas Inmediatas:
- Ausencia de doble verificación en entregables de nómina y ADP.
- Falta de puntos de control en etapas críticas de los procesos.
- Errores recurrentes sin proceso disciplinario asociado.

Causas Raíz:
- Inexistencia de mecanismos de trazabilidad en los procesos ADP y ADN.
- Cultura organizacional que no vincula errores procedimentales con correctivos disciplinarios.
- Procedimientos sin checkpoints obligatorios en etapas de mayor riesgo.
`.trim();

const EJEMPLO_2 = `
Situación: Impuesto de ICA no pagado a tiempo por falta de recibo adjunto en solicitud por WhatsApp y falta de seguimiento del outsourcing de tesorería.

Análisis 5 Porqués:
Por qué 1: No se recibió el recibo de pago ni se hizo seguimiento → La solicitud de pago por WhatsApp no incluyó el soporte necesario y nadie lo reclamó.
Por qué 2: No existía mecanismo de control para pagos PSE → El proceso de tesorería no tenía un flujo específico para pagos electrónicos con soporte digital.
Por qué 3: El formato de seguimiento no contemplaba pagos por PSE → Los instrumentos de control fueron diseñados para pagos físicos, excluyendo los electrónicos.
Por qué 4: No se unificó la gestión de todos los tipos de pago → Coexistían canales informales (WhatsApp) y formales sin integración ni trazabilidad.
Por qué 5: Ausencia de política unificada de gestión de pagos → No existe una directriz que establezca un único canal, soporte obligatorio y responsable de seguimiento para todos los tipos de pago.

Causas Inmediatas:
- Solicitud de pago sin soporte adjunto y sin seguimiento posterior.
- Canal informal (WhatsApp) utilizado para gestionar obligaciones fiscales.

Causas Raíz:
- Inexistencia de un mecanismo de control específico para pagos PSE en el outsourcing de tesorería.
- Falta de política unificada que integre todos los tipos de pago con soporte y trazabilidad obligatorios.
`.trim();

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no está configurada en .env.local" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { situacion } = body as { situacion: string };

  if (!situacion?.trim()) {
    return NextResponse.json(
      { error: "Se requiere una descripción de la situación para generar el análisis." },
      { status: 400 }
    );
  }

  const prompt = `Analiza la siguiente situación y proporciona un análisis de causa raíz específico y directo, siguiendo el formato de los ejemplos proporcionados.

--- EJEMPLO 1 ---
${EJEMPLO_1}

--- EJEMPLO 2 ---
${EJEMPLO_2}

--- INSTRUCCIONES ---
Entrega únicamente:
1. Análisis de los 5 Porqués (con pregunta y respuesta encadenada, igual que los ejemplos)
2. 2-3 Causas Inmediatas
3. 2-3 Causas Raíz

Reglas:
- Mismo formato y nivel de detalle que los ejemplos anteriores.
- Específico y directo, enfocado en problemas sistémicos y procedimentales.
- Identificar fallas en procesos, controles, seguimiento y cultura organizacional.
- Sin explicaciones largas, sin ejemplos adicionales, sin recomendaciones.

--- SITUACIÓN A ANALIZAR ---
${situacion.trim()}`;

  console.log("[gemini-analisis] Situación recibida:", situacion);

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[gemini-analisis] Gemini API error:", errText);
    return NextResponse.json(
      { error: "Error al llamar a la API de Gemini. Verifica tu clave API." },
      { status: 502 }
    );
  }

  const data = await response.json();
  console.log("[gemini-analisis] Respuesta completa de Gemini:", JSON.stringify(data, null, 2));

  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text: string = candidate?.content?.parts?.[0]?.text ?? "";

  console.log("[gemini-analisis] finishReason:", finishReason);
  console.log("[gemini-analisis] Texto generado:", text);

  if (!text) {
    return NextResponse.json(
      { error: "La API de Gemini no devolvió contenido." },
      { status: 502 }
    );
  }

  if (finishReason && finishReason !== "STOP") {
    console.warn("[gemini-analisis] Respuesta cortada por finishReason:", finishReason);
  }

  return NextResponse.json({ analisis: text, finishReason });
}
