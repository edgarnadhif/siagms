import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const globalForSession = globalThis as typeof globalThis & {
  developmentSessionSecret?: Uint8Array;
};

function getEncodedKey() {
  const secretKey = process.env.SESSION_SECRET;

  if (secretKey) {
    return new TextEncoder().encode(secretKey);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET wajib dikonfigurasi di environment production");
  }

  globalForSession.developmentSessionSecret ??= crypto.getRandomValues(
    new Uint8Array(32),
  );
  return globalForSession.developmentSessionSecret;
}

export type AppRole = "ADMIN" | "AKUNTAN";

export type SessionPayload = {
  userId: number;
  tenantId: string;
  role: AppRole;
  expiresAt: Date;
};

export async function createSession(
  payload: Omit<SessionPayload, "expiresAt">,
  remember = false,
) {
  const duration = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + duration);

  const session = await new SignJWT({
    ...payload,
    expiresAt: expiresAt.toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getEncodedKey());

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });

    return {
      userId: Number(payload.userId),
      tenantId: String(payload.tenantId),
      role: String(payload.role) as AppRole,
      expiresAt: new Date(String(payload.expiresAt)),
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
