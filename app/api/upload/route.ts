import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const ALLOWED_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".doc", ".docx", ".xls", ".xlsx"]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Use PDF, imagen, Word o Excel." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: "Extensión no permitida." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "El archivo no puede superar 10 MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Falta configurar BLOB_READ_WRITE_TOKEN para subir archivos." },
        { status: 500 }
      );
    }

    // Sanitize: only alphanumeric, dash, underscore in the base name
    const base = path.basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .slice(0, 60);
    const filename = `evidencias/${Date.now()}_${base}${ext}`;

    const blob = await put(filename, buffer, {
      access: "private",
      token,
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url, name: file.name });
  } catch (e) {
    console.error("[upload]", e);
    return NextResponse.json({ error: "Error interno al procesar el archivo." }, { status: 500 });
  }
}
