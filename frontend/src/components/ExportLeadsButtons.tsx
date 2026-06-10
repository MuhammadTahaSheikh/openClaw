import { useState } from "react";
import type { Lead } from "../api/leads";
import { exportLeadsToCsv, exportLeadsToPdf } from "../utils/exportLeads";

type ExportLeadsButtonsProps = {
  leads: Lead[];
  filenameBase: string;
  pdfTitle?: string;
  pdfSubtitle?: string;
};

export function ExportLeadsButtons({
  leads,
  filenameBase,
  pdfTitle,
  pdfSubtitle,
}: ExportLeadsButtonsProps) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  if (leads.length === 0) return null;

  async function handleCsv() {
    setExporting("csv");
    try {
      exportLeadsToCsv(leads, filenameBase);
    } finally {
      setExporting(null);
    }
  }

  async function handlePdf() {
    setExporting("pdf");
    try {
      await exportLeadsToPdf(leads, filenameBase, {
        title: pdfTitle,
        subtitle: pdfSubtitle,
      });
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="export-actions">
      <button type="button" className="btn-secondary" onClick={handleCsv} disabled={!!exporting}>
        {exporting === "csv" ? "Exporting…" : "Export CSV"}
      </button>
      <button type="button" className="btn-secondary" onClick={handlePdf} disabled={!!exporting}>
        {exporting === "pdf" ? "Exporting…" : "Export PDF"}
      </button>
    </div>
  );
}
