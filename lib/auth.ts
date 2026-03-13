import "server-only";

import type { NextRequest } from "next/server";

export type AppRole = "admin" | "user";

export interface AppSession {
  username: string;
  displayName: string;
  role: AppRole;
}

interface AccountConfig {
  aliases: string[];
  password: string;
  session: AppSession;
}

export const AUTH_COOKIE_NAME = "acr_auth";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 12;

const ACCOUNTS: AccountConfig[] = [
  {
    aliases: ["admin"],
    password: "Admin2026!",
    session: {
      username: "admin",
      displayName: "Admin",
      role: "admin",
    },
  },
  {
    aliases: ["usuario s&p", "usuario sp", "usuario"],
    password: "Usuario2026!",
    session: {
      username: "usuario s&p",
      displayName: "Usuario S&P",
      role: "user",
    },
  },
];

const normalizeUsername = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export function authenticateUser(username: string, password: string): AppSession | null {
  const normalized = normalizeUsername(username);
  const account = ACCOUNTS.find(
    ({ aliases, password: accountPassword }) =>
      accountPassword === password && aliases.some((alias) => alias === normalized)
  );

  return account ? account.session : null;
}

export function serializeSession(session: AppSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function parseSession(value?: string | null): AppSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<AppSession>;
    if (
      typeof parsed.username === "string" &&
      typeof parsed.displayName === "string" &&
      (parsed.role === "admin" || parsed.role === "user")
    ) {
      return {
        username: parsed.username,
        displayName: parsed.displayName,
        role: parsed.role,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function getRequestSession(request: NextRequest): AppSession | null {
  return parseSession(request.cookies.get(AUTH_COOKIE_NAME)?.value);
}

export function isAdminSession(session: AppSession | null): boolean {
  return session?.role === "admin";
}