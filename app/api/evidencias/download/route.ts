import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getRequestSession } from "@/lib/auth";

const isAllowedBlobUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.endsWith("blob.vercel-storage.com");
  } catch {
    return false;
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = getRequestSession(request);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const urlParam = request.nextUrl.searchParams.get("url");
    if (!urlParam) {
      return NextResponse.json({ error: "Falta el parámetro url" }, { status: 400 });
    }

    const blobUrl = decodeURIComponent(urlParam);
    if (!isAllowedBlobUrl(blobUrl)) {
      return NextResponse.json({ error: "URL de evidencia inválida" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Falta configurar BLOB_READ_WRITE_TOKEN para descargar evidencias." },
        { status: 500 }
      );
    }

    let blob = await get(blobUrl, { access: "private", token, useCache: true });

    // Backward compatibility for files uploaded before private-mode migration
    if (!blob) {
      blob = await get(blobUrl, { access: "public", token });
    }

    if (!blob) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    if (blob.statusCode === 304 || !blob.stream) {
      return new NextResponse(null, { status: 304 });
    }

    const headers = new Headers();
    headers.set("Content-Type", blob.blob.contentType || "application/octet-stream");
    headers.set("Content-Disposition", blob.blob.contentDisposition || "inline");
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(blob.stream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[evidencias/download]", error);
    return NextResponse.json({ error: "Error al procesar la descarga." }, { status: 500 });
  }
}
