import { apiFetch } from "./client";

export type TrackerRowInput = {
  date?: string | null;
  name?: string | null;
  jobTitle?: string | null;
  employmentType?: string | null;
  email?: string | null;
  linkedin?: string | null;
  phone?: string | null;
  source?: string | null;
  remarks?: string | null;
  connects?: string | null;
  projectPrice?: string | null;
};

export type TrackerRow = TrackerRowInput & {
  id: number;
  userId?: number;
  ownerName?: string;
  ownerEmail?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TrackerUserOption = {
  id: number;
  name: string;
  email: string;
};

export type TrackerState = {
  headers: string[];
  rows: TrackerRow[];
  isAdmin: boolean;
  users?: TrackerUserOption[];
};

export function fetchTracker(userId?: number): Promise<TrackerState> {
  const query = userId !== undefined ? `?userId=${userId}` : "";
  return apiFetch<TrackerState>(`/api/tracker${query}`);
}

export function createTrackerRow(input: TrackerRowInput): Promise<TrackerRow> {
  return apiFetch<TrackerRow>("/api/tracker/rows", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTrackerRow(id: number, input: TrackerRowInput): Promise<TrackerRow> {
  return apiFetch<TrackerRow>(`/api/tracker/rows/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteTrackerRow(id: number): Promise<void> {
  return apiFetch(`/api/tracker/rows/${id}`, { method: "DELETE" });
}
