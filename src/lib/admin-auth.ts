import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const ADMIN_COOKIE = "admin_session";

export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Invalid credentials" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid credentials" };
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: { token, userId: user.id, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return { success: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) {
    await prisma.adminSession.delete({ where: { token } }).catch(() => {});
  }
  cookieStore.delete(ADMIN_COOKIE);
}

export async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({ where: { token } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { token } }).catch(() => {});
    return null;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
  });
  return user;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
