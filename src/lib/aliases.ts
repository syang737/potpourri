// Common abbreviations and alternate names for loose matching
// Shared between client-side and could be used server-side too
const ALIASES: Record<string, string[]> = {
  "us": ["united states", "united states of america"],
  "usa": ["united states", "united states of america"],
  "uk": ["united kingdom"],
  "uae": ["united arab emirates"],
  "drc": ["democratic republic of the congo"],
  "car": ["central african republic"],
  "rok": ["south korea", "republic of korea"],
  "dprk": ["north korea"],
  "prc": ["china", "people's republic of china"],
  "czechia": ["czech republic"],
  "holland": ["netherlands"],
  "burma": ["myanmar"],
  "ivory coast": ["cote d'ivoire", "côte d'ivoire"],
  "russia": ["russian federation"],
  "south korea": ["korea, south", "republic of korea"],
  "north korea": ["korea, north"],
  "taiwan": ["chinese taipei"],
  "vietnam": ["viet nam"],
  "laos": ["lao people's democratic republic"],
  "iran": ["islamic republic of iran"],
  "syria": ["syrian arab republic"],
  "bolivia": ["plurinational state of bolivia"],
  "venezuela": ["bolivarian republic of venezuela"],
  "tanzania": ["united republic of tanzania"],
  "micronesia": ["federated states of micronesia"],
  "moldova": ["republic of moldova"],
  "congo": ["republic of the congo"],
};

export function expandQuery(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  const results = [normalized];

  const aliases = ALIASES[normalized];
  if (aliases) {
    results.push(...aliases);
  }

  for (const [key, values] of Object.entries(ALIASES)) {
    if (key.startsWith(normalized) && !results.includes(key)) {
      results.push(...values);
    }
  }

  return results;
}
