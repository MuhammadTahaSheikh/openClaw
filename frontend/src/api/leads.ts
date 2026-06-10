import { apiFetch } from "./client";

export type Platform = {
  id: string;
  name: string;
  description: string;
  enabled?: boolean;
};

export type Category = {
  id: string;
  label: string;
};

export type Lead = {
  id: string;
  platform: string;
  title: string;
  employmentType: string | null;
  salary: string | null;
  postedAt: string | null;
  description: string | null;
  skills: string[];
  url: string;
  keyword: string;
};

export type BotRunBy = {
  userId: number;
  memberId: number | null;
  name: string;
  email: string;
};

export type BotRunResult = {
  platform: string;
  category: string;
  keyword: string;
  startDate: string | null;
  endDate: string | null;
  totalOnPlatform: number | null;
  pagesScraped: number;
  totalFound: number;
  totalScanned: number;
  totalRelevant: number;
  savedToDatabase: number;
  skippedDuplicates: number;
  runBy: BotRunBy | null;
  runAt: string;
  leads: Lead[];
  scrapedAt: string;
};

export type BotRunHistoryItem = {
  id: number;
  platform: string;
  category: string;
  keyword: string;
  startDate: string | null;
  endDate: string | null;
  totalFound: number;
  totalScanned: number;
  totalRelevant: number;
  runBy: BotRunBy | null;
  runAt: string;
};

export type BotRunDetail = BotRunHistoryItem & {
  leads: Lead[];
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchPlatforms(): Promise<Platform[]> {
  const response = await fetch(`${API_BASE}/api/platforms`);
  if (!response.ok) {
    throw new Error("Failed to load platforms");
  }
  const data = (await response.json()) as { platforms: Platform[] };
  return data.platforms;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/api/categories`);
  if (!response.ok) {
    throw new Error("Failed to load categories");
  }
  const data = (await response.json()) as { categories: Category[] };
  return data.categories;
}

export async function runLeadBot(input: {
  platform: string;
  category: string;
  maxPages?: number;
  startDate?: string;
  endDate?: string;
}): Promise<BotRunResult> {
  return apiFetch<BotRunResult>("/api/bot/run", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchBotRunHistory(limit = 20): Promise<BotRunHistoryItem[]> {
  const data = await apiFetch<{ runs: BotRunHistoryItem[] }>(`/api/bot/runs?limit=${limit}`);
  return data.runs;
}

export async function fetchBotRunDetail(runId: number): Promise<BotRunDetail> {
  return apiFetch<BotRunDetail>(`/api/bot/runs/${runId}`);
}
