import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Set it in your Vercel project settings or .env file."
    );
  }
  const adapter = new PrismaNeon({
    connectionString,
    // Allow extra time for Neon cold starts (default is 0/no timeout)
    connectionTimeoutMillis: 10000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Retry a database operation with exponential backoff.
 * Handles transient Neon cold-start / control plane errors.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryable =
        err instanceof Error &&
        (err.message.includes("Control plane request failed") ||
          err.message.includes("DriverAdapterError") ||
          err.message.includes("Connection terminated unexpectedly"));

      if (isLastAttempt || !isRetryable) throw err;

      const delayMs = 500 * 2 ** attempt; // 500ms, 1s, 2s
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("unreachable");
}
