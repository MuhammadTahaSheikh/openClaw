import type { TrackerRow, TrackerRowInput } from "../api/tracker";

const FIELD_KEYS: (keyof TrackerRowInput)[] = [
  "date",
  "name",
  "jobTitle",
  "email",
  "linkedin",
  "phone",
  "source",
  "remarks",
  "connects",
  "projectPrice",
];

function formatDateForExport(value: string | null | undefined): string {
  if (!value) return "";
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function escapeCsvValue(value: string | null | undefined): string {
  const text = value ?? "";
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildFilename(baseName: string, extension: string): string {
  const safe = baseName.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-").toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  return `bestechvision-${safe}-${date}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getFieldValue(row: TrackerRow, field: keyof TrackerRowInput): string {
  if (field === "date") return formatDateForExport(row.date);
  return (row[field] ?? "") as string;
}

export function exportTrackerToCsv(
  rows: TrackerRow[],
  headers: string[],
  filenameBase: string,
): void {
  const csvHeaders = ["Team Member", ...headers];

  const csvRows = rows.map((row) => [
    escapeCsvValue(row.ownerName ?? "Unknown"),
    ...FIELD_KEYS.map((field) => escapeCsvValue(getFieldValue(row, field))),
  ]);

  const csv = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, buildFilename(filenameBase, "csv"));
}
