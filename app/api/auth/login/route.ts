import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  serializeSession,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username?.trim() || !password) {
      return NextResponse.json({ error: "Usuario y contraseña son obligatorios." }, { status: 400 });
    }

    const session = authenticateUser(username, password);
    if (!session) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }

    const response = NextResponse.json({ session });
    response.cookies.set(AUTH_COOKIE_NAME, serializeSession(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "No fue posible iniciar sesión." }, { status: 500 });
  }
}