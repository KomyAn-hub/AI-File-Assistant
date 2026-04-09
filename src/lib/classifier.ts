import type { ClassificationResult } from "./types";

const RULES: {
  fn: RegExp;
  ct: RegExp;
  category: string;
  path: string;
  conf: number;
  hp: string[];
}[] = [
  { fn: /contract|agreement|nda|legal|terms/,     ct: /agreement|confidential|clause|party|nda/,       category: "Legal",       path: "Legal/Contracts/2026",     conf: 96, hp: ["Legal",      "Contracts", "2026"] },
  { fn: /marketing|campaign|brand|ads?_/,          ct: /campaign|audience|brand|social|awareness/,      category: "Marketing",   path: "Marketing/Campaigns/2026", conf: 94, hp: ["Marketing",  "Campaigns", "2026"] },
  { fn: /invoice|receipt|billing|payment|finance/, ct: /invoice|payment|amount|vat|billing/,            category: "Finance",     path: "Finance/Invoices/2026",    conf: 97, hp: ["Finance",    "Invoices",  "2026"] },
  { fn: /roadmap|strategy|plan|okr|kpi/,           ct: /strategy|objective|milestone|initiative/,       category: "Strategy",    path: "Management/Strategy/2026", conf: 91, hp: ["Management", "Strategy",  "2026"] },
  { fn: /report|analysis|analytics|data/,          ct: /report|analysis|metrics|dashboard/,             category: "Reports",     path: "Reports/Analytics/2026",   conf: 88, hp: ["Reports",    "Analytics", "2026"] },
  { fn: /proposal|rfp|pitch|offer/,               ct: /proposal|scope|deliverable|timeline|budget/,    category: "Sales",       path: "Sales/Proposals/2026",     conf: 90, hp: ["Sales",      "Proposals", "2026"] },
  { fn: /hr|onboard|policy|employee|recruit/,      ct: /employee|onboarding|policy|benefit|hire/,       category: "HR",          path: "HR/Policies/2026",         conf: 93, hp: ["HR",         "Policies",  "2026"] },
  { fn: /dev|code|api|spec|tech|readme/,           ct: /function|endpoint|api|deploy|version|class/,    category: "Engineering", path: "Engineering/Docs/2026",    conf: 89, hp: ["Engineering","Docs",      "2026"] },
];

export function classifyOffline(filename: string, content: string): ClassificationResult {
  const f = filename.toLowerCase();
  const c = content.toLowerCase();
  for (const r of RULES) {
    const fm = r.fn.test(f);
    const cm = r.ct.test(c);
    if (fm || cm) {
      const confidence = Math.min(fm && cm ? r.conf : fm ? r.conf - 8 : r.conf - 14, 99);
      const reason =
        fm && cm ? `Filename and content both match ${r.category} category`
        : fm      ? `Filename pattern suggests ${r.category} document`
                  : `Content keywords indicate ${r.category} document`;
      return { category: r.category, suggestedPath: r.path, confidence, reason, highlightPath: r.hp };
    }
  }
  return {
    category: "General",
    suggestedPath: "General/Unsorted/2026",
    confidence: 44,
    reason: "No specific category detected — manual review recommended",
    highlightPath: ["General", "Unsorted", "2026"],
  };
}

export async function classifyWithAI(filename: string, content: string): Promise<ClassificationResult> {
    const env = (import.meta as unknown as { env: Record<string, string> }).env;
  const proxyUrl: string | undefined = env?.VITE_PROXY_URL;

  if (!proxyUrl) {
        return classifyOffline(filename, content);
  }

  try {
    const resp = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content: content.slice(0, 400) }),
    });

    if (!resp.ok) {
      console.warn("Proxy error:", resp.status);
      return classifyOffline(filename, content);
    }

    const result = await resp.json() as ClassificationResult;
        if (!result.category || !result.suggestedPath) throw new Error("Invalid result shape");
    return result;
  } catch (err) {
    console.warn("AI classify failed, falling back to offline:", err);
    return classifyOffline(filename, content);
  }
}
