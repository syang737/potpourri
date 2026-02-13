import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "session_id";

export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  if (existing) {
    const session = await prisma.session.findUnique({ where: { id: existing } });
    if (session) {
      await prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      });
      return session.id;
    }
  }

  const session = await prisma.session.create({ data: {} });
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return session.id;
}
