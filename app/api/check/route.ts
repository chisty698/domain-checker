const TLDS = ["com", "net", "org", "io", "co", "ai", "app", "dev", "xyz", "me"];

let bootstrap: Record<string, string> | null = null;

// Official list of where each ending (.com, .net...) keeps its records
async function loadBootstrap(): Promise<Record<string, string>> {
  if (bootstrap) return bootstrap;
  const res = await fetch("https://data.iana.org/rdap/dns.json");
  const json = await res.json();
  const map: Record<string, string> = {};
  for (const [tlds, urls] of json.services) {
    for (const tld of tlds) map[tld] = urls[0];
  }
  bootstrap = map;
  return map;
}

type Status = "available" | "taken" | "unknown";

async function checkOne(
  name: string,
  tld: string,
  map: Record<string, string>
): Promise<{ tld: string; status: Status }> {
  const base = map[tld];
  if (!base) return { tld, status: "unknown" };
  try {
    const url = base.replace(/\/?$/, "/") + "domain/" + name + "." + tld;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.status === 404) return { tld, status: "available" };
    if (res.ok) return { tld, status: "taken" };
    return { tld, status: "unknown" };
  } catch {
    return { tld, status: "unknown" };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("name") || "").trim().toLowerCase();

  if (!/^[a-z0-9-]{1,63}$/.test(name)) {
    return Response.json({ error: "Invalid name" }, { status: 400 });
  }

  const map = await loadBootstrap();
  const results = await Promise.all(TLDS.map((tld) => checkOne(name, tld, map)));
  return Response.json({ results });
}