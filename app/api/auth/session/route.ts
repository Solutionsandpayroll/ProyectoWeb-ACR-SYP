import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  return NextResponse.json({ session: getRequestSession(request) });
}