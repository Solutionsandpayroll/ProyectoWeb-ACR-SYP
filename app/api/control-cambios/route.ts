import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
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
        ${autor?.trim() || null}
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
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID requerido." }, { status: 400 });
    await sql`DELETE FROM control_cambios WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[control-cambios DELETE]", e);
    return NextResponse.json({ error: "Error al eliminar el registro." }, { status: 500 });
  }
}
