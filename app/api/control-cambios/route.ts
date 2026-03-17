import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getRequestSession, isAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = getRequestSession(request);
    if (!session) {
      return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
    }
    if (!isAdminSession(session)) {
      return NextResponse.json({ error: "No tienes permiso para visualizar cambios." }, { status: 403 });
    }

    const rows = await sql`
      SELECT id, version, fecha::text, descripcion, autor, created_at
      FROM control_cambios
      ORDER BY fecha DESC, id DESC
    `;
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[control-cambios GET]", e);
    return NextResponse.json({ error: "Error al obtener los registros." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getRequestSession(request);
    if (!session) {
      return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
    }
    if (!isAdminSession(session)) {
      return NextResponse.json({ error: "No tienes permiso para registrar cambios." }, { status: 403 });
    }

    const { version, fecha, descripcion, autor } = await request.json();

    if (!version?.trim() || !descripcion?.trim() || !fecha) {
      return NextResponse.json({ error: "Versión, fecha y descripción son obligatorios." }, { status: 400 });
    }

    const [row] = await sql`
      INSERT INTO control_cambios (version, fecha, descripcion, autor)
      VALUES (
        ${version.trim()},
        ${fecha},
        ${descripcion.trim()},
        ${autor?.trim() || session.displayName}
      )
      RETURNING id, version, fecha::text, descripcion, autor, created_at
    `;
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("[control-cambios POST]", e);
    return NextResponse.json({ error: "Error al guardar el registro." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getRequestSession(request);
    if (!session) {
      return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
    }
    if (!isAdminSession(session)) {
      return NextResponse.json({ error: "No tienes permiso para eliminar cambios." }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    await sql`DELETE FROM control_cambios WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[control-cambios DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar el registro." }, { status: 500 });
  }
}
