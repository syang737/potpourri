import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create verticals
  const verticals = [
    { slug: "movies_tv", name: "Movies / TV Shows", description: "Movies and television shows" },
    { slug: "countries", name: "Countries", description: "Countries of the world" },
    { slug: "fortune_500", name: "Fortune 500", description: "Fortune 500 companies" },
    { slug: "sports", name: "Sports", description: "Sports teams and athletes" },
    { slug: "languages", name: "Languages", description: "World languages" },
  ];

  for (const v of verticals) {
    await prisma.vertical.upsert({
      where: { slug: v.slug },
      create: v,
      update: { name: v.name, description: v.description },
    });
  }

  console.log("Created verticals");

  // Seed countries answer pool
  const countriesVertical = await prisma.vertical.findUnique({ where: { slug: "countries" } });
  if (countriesVertical) {
    const countries = [
      { label: "Russia", metadata: { iso2: "RU", region: "Europe/Asia" } },
      { label: "Canada", metadata: { iso2: "CA", region: "Americas" } },
      { label: "United States", metadata: { iso2: "US", region: "Americas" } },
      { label: "China", metadata: { iso2: "CN", region: "Asia" } },
      { label: "Brazil", metadata: { iso2: "BR", region: "Americas" } },
      { label: "Australia", metadata: { iso2: "AU", region: "Oceania" } },
      { label: "India", metadata: { iso2: "IN", region: "Asia" } },
      { label: "Argentina", metadata: { iso2: "AR", region: "Americas" } },
      { label: "Kazakhstan", metadata: { iso2: "KZ", region: "Asia" } },
      { label: "Algeria", metadata: { iso2: "DZ", region: "Africa" } },
      { label: "Democratic Republic of the Congo", metadata: { iso2: "CD", region: "Africa" } },
      { label: "Saudi Arabia", metadata: { iso2: "SA", region: "Asia" } },
      { label: "Mexico", metadata: { iso2: "MX", region: "Americas" } },
      { label: "Indonesia", metadata: { iso2: "ID", region: "Asia" } },
      { label: "Sudan", metadata: { iso2: "SD", region: "Africa" } },
      { label: "Libya", metadata: { iso2: "LY", region: "Africa" } },
      { label: "Iran", metadata: { iso2: "IR", region: "Asia" } },
      { label: "Mongolia", metadata: { iso2: "MN", region: "Asia" } },
      { label: "Peru", metadata: { iso2: "PE", region: "Americas" } },
      { label: "Chad", metadata: { iso2: "TD", region: "Africa" } },
      { label: "France", metadata: { iso2: "FR", region: "Europe" } },
      { label: "Germany", metadata: { iso2: "DE", region: "Europe" } },
      { label: "United Kingdom", metadata: { iso2: "GB", region: "Europe" } },
      { label: "Japan", metadata: { iso2: "JP", region: "Asia" } },
      { label: "South Korea", metadata: { iso2: "KR", region: "Asia" } },
      { label: "Italy", metadata: { iso2: "IT", region: "Europe" } },
      { label: "Spain", metadata: { iso2: "ES", region: "Europe" } },
      { label: "Nigeria", metadata: { iso2: "NG", region: "Africa" } },
      { label: "Egypt", metadata: { iso2: "EG", region: "Africa" } },
      { label: "South Africa", metadata: { iso2: "ZA", region: "Africa" } },
    ];

    for (const c of countries) {
      const normalizedLabel = c.label.toLowerCase().trim();
      await prisma.answerPoolItem.upsert({
        where: { verticalId_normalizedLabel: { verticalId: countriesVertical.id, normalizedLabel } },
        create: { verticalId: countriesVertical.id, label: c.label, normalizedLabel, metadata: c.metadata },
        update: { label: c.label, metadata: c.metadata },
      });
    }
    console.log("Seeded countries answer pool");

    // Create a sample puzzle: Top 10 countries by land area
    const topCountries = ["Russia", "Canada", "United States", "China", "Brazil", "Australia", "India", "Argentina", "Kazakhstan", "Algeria"];
    const poolItems = await prisma.answerPoolItem.findMany({
      where: { verticalId: countriesVertical.id, label: { in: topCountries } },
    });

    const labelToItem = new Map(poolItems.map((p) => [p.label, p]));

    const existingPuzzle = await prisma.puzzle.findFirst({
      where: { topic: "Top 10 countries by land area" },
    });

    if (!existingPuzzle) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const puzzle = await prisma.puzzle.create({
        data: {
          verticalId: countriesVertical.id,
          topic: "Top 10 countries by land area",
          description: "Source: Wikipedia",
          scheduledFor: today,
          status: "PUBLISHED",
          answers: {
            create: topCountries.map((label, idx) => ({
              answerPoolItemId: labelToItem.get(label)!.id,
              rank: idx + 1,
            })),
          },
        },
      });

      // Initialize puzzle stats
      await prisma.puzzleStats.create({
        data: {
          puzzleId: puzzle.id,
          numSessions: 0,
          scoreHistogram: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0 },
          guessHistogram: {},
        },
      });

      console.log("Created sample puzzle: Top 10 countries by land area");
    }
  }

  // Seed languages answer pool
  const languagesVertical = await prisma.vertical.findUnique({ where: { slug: "languages" } });
  if (languagesVertical) {
    const languages = [
      { label: "English", metadata: { iso639_1: "en", family: "Indo-European" } },
      { label: "Mandarin Chinese", metadata: { iso639_1: "zh", family: "Sino-Tibetan" } },
      { label: "Hindi", metadata: { iso639_1: "hi", family: "Indo-European" } },
      { label: "Spanish", metadata: { iso639_1: "es", family: "Indo-European" } },
      { label: "French", metadata: { iso639_1: "fr", family: "Indo-European" } },
      { label: "Arabic", metadata: { iso639_1: "ar", family: "Afro-Asiatic" } },
      { label: "Bengali", metadata: { iso639_1: "bn", family: "Indo-European" } },
      { label: "Portuguese", metadata: { iso639_1: "pt", family: "Indo-European" } },
      { label: "Russian", metadata: { iso639_1: "ru", family: "Indo-European" } },
      { label: "Japanese", metadata: { iso639_1: "ja", family: "Japonic" } },
      { label: "German", metadata: { iso639_1: "de", family: "Indo-European" } },
      { label: "Korean", metadata: { iso639_1: "ko", family: "Koreanic" } },
      { label: "Italian", metadata: { iso639_1: "it", family: "Indo-European" } },
      { label: "Turkish", metadata: { iso639_1: "tr", family: "Turkic" } },
      { label: "Vietnamese", metadata: { iso639_1: "vi", family: "Austroasiatic" } },
      { label: "Thai", metadata: { iso639_1: "th", family: "Kra-Dai" } },
      { label: "Swahili", metadata: { iso639_1: "sw", family: "Niger-Congo" } },
      { label: "Malay", metadata: { iso639_1: "ms", family: "Austronesian" } },
      { label: "Dutch", metadata: { iso639_1: "nl", family: "Indo-European" } },
      { label: "Polish", metadata: { iso639_1: "pl", family: "Indo-European" } },
    ];

    for (const l of languages) {
      const normalizedLabel = l.label.toLowerCase().trim();
      await prisma.answerPoolItem.upsert({
        where: { verticalId_normalizedLabel: { verticalId: languagesVertical.id, normalizedLabel } },
        create: { verticalId: languagesVertical.id, label: l.label, normalizedLabel, metadata: l.metadata },
        update: { label: l.label, metadata: l.metadata },
      });
    }
    console.log("Seeded languages answer pool");
  }

  // Create admin user
  const adminEmail = "admin@potpourri.dev";
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, passwordHash, role: "ADMIN" },
    update: { passwordHash },
  });

  console.log(`Admin user created: ${adminEmail} / admin123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
