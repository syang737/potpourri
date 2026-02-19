import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
const mockVerticalFindUnique = vi.fn();
const mockAnswerPoolFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    vertical: { findUnique: (...args: unknown[]) => mockVerticalFindUnique(...args) },
    answerPoolItem: { findMany: (...args: unknown[]) => mockAnswerPoolFindMany(...args) },
  },
}));

// Import after mocking — each test file gets a fresh module instance
// but we need to reset the in-memory cache between tests, so we
// dynamically import in each test or clear the module cache.
// For simplicity, we'll test the route handler directly.

describe("GET /api/vertical/[slug]/pool", () => {
  let GET: typeof import("@/app/api/vertical/[slug]/pool/route").GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to reset the in-memory poolCache Map
    vi.resetModules();

    // Re-setup mocks after resetModules
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        vertical: { findUnique: (...args: unknown[]) => mockVerticalFindUnique(...args) },
        answerPoolItem: { findMany: (...args: unknown[]) => mockAnswerPoolFindMany(...args) },
      },
    }));

    const mod = await import("@/app/api/vertical/[slug]/pool/route");
    GET = mod.GET;
  });

  const fakeItems = [
    { id: "1", label: "France", normalizedLabel: "france", metadata: null },
    { id: "2", label: "Germany", normalizedLabel: "germany", metadata: null },
  ];

  function makeRequest(slug: string) {
    const request = new Request(`http://localhost/api/vertical/${slug}/pool`);
    const params = Promise.resolve({ slug });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return GET(request as any, { params });
  }

  it("returns items from DB on cache miss", async () => {
    mockVerticalFindUnique.mockResolvedValue({ id: "v1", slug: "countries" });
    mockAnswerPoolFindMany.mockResolvedValue(fakeItems);

    const res = await makeRequest("countries");
    const body = await res.json();

    expect(body.items).toHaveLength(2);
    expect(body.items[0].label).toBe("France");
    expect(mockVerticalFindUnique).toHaveBeenCalledTimes(1);
    expect(mockAnswerPoolFindMany).toHaveBeenCalledTimes(1);
  });

  it("sets Cache-Control header", async () => {
    mockVerticalFindUnique.mockResolvedValue({ id: "v1", slug: "countries" });
    mockAnswerPoolFindMany.mockResolvedValue(fakeItems);

    const res = await makeRequest("countries");

    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, stale-while-revalidate=1800"
    );
  });

  it("serves from in-memory cache on second request (no DB call)", async () => {
    mockVerticalFindUnique.mockResolvedValue({ id: "v1", slug: "countries" });
    mockAnswerPoolFindMany.mockResolvedValue(fakeItems);

    // First request — hits DB
    await makeRequest("countries");
    expect(mockVerticalFindUnique).toHaveBeenCalledTimes(1);
    expect(mockAnswerPoolFindMany).toHaveBeenCalledTimes(1);

    // Second request — should be cached
    const res2 = await makeRequest("countries");
    const body2 = await res2.json();

    expect(body2.items).toHaveLength(2);
    // No additional DB calls
    expect(mockVerticalFindUnique).toHaveBeenCalledTimes(1);
    expect(mockAnswerPoolFindMany).toHaveBeenCalledTimes(1);
  });

  it("returns 404 for unknown vertical", async () => {
    mockVerticalFindUnique.mockResolvedValue(null);

    const res = await makeRequest("nonexistent");

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Vertical not found");
  });

  it("caches per-slug independently", async () => {
    mockVerticalFindUnique.mockImplementation(({ where }: { where: { slug: string } }) => {
      if (where.slug === "countries") return { id: "v1", slug: "countries" };
      if (where.slug === "movies") return { id: "v2", slug: "movies" };
      return null;
    });
    mockAnswerPoolFindMany.mockImplementation(({ where }: { where: { verticalId: string } }) => {
      if (where.verticalId === "v1") return fakeItems;
      return [{ id: "3", label: "Inception", normalizedLabel: "inception", metadata: null }];
    });

    const res1 = await makeRequest("countries");
    const body1 = await res1.json();
    expect(body1.items).toHaveLength(2);

    const res2 = await makeRequest("movies");
    const body2 = await res2.json();
    expect(body2.items).toHaveLength(1);
    expect(body2.items[0].label).toBe("Inception");

    // Both required DB lookups (different slugs)
    expect(mockVerticalFindUnique).toHaveBeenCalledTimes(2);
  });
});
