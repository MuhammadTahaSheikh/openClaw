import type { Lead } from "../api/leads";

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

export function exportLeadsToCsv(leads: Lead[], filenameBase: string): void {
  const headers = [
    "Title",
    "Employment Type",
    "Salary",
    "Posted At",
    "Skills",
    "URL",
    "Platform",
    "Keyword",
  ];

  const rows = leads.map((lead) => [
    escapeCsvValue(lead.title),
    escapeCsvValue(lead.employmentType),
    escapeCsvValue(lead.salary),
    escapeCsvValue(lead.postedAt),
    escapeCsvValue(lead.skills.join("; ")),
    escapeCsvValue(lead.url),
    escapeCsvValue(lead.platform),
    escapeCsvValue(lead.keyword),
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, buildFilename(filenameBase, "csv"));
}

export async function exportLeadsToPdf(
  leads: Lead[],
  filenameBase: string,
  meta?: { title?: string; subtitle?: string },
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text(meta?.title ?? "BestechVision Leads Export", 40, 40);

  if (meta?.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(meta.subtitle, 40, 58);
    doc.setTextColor(0);
  }

  autoTable(doc, {
    startY: meta?.subtitle ? 70 : 55,
    head: [["Title", "Type", "Salary", "Posted", "Skills", "URL"]],
    body: leads.map((lead) => [
      lead.title,
      lead.employmentType ?? "",
      lead.salary ?? "",
      lead.postedAt ?? "",
      lead.skills.join(", "),
      lead.url,
    ]),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 140 },
      5: { cellWidth: 120 },
    },
  });

  doc.save(buildFilename(filenameBase, "pdf"));
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
