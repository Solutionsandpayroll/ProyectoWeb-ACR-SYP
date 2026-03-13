import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, parseSession } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const session = parseSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  redirect(session ? "/dashboard" : "/login");
}
