import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBotRunDetail, type BotRunDetail } from "../api/leads";
import { LeadCard } from "../components/LeadCard";
import { ExportLeadsButtons } from "../components/ExportLeadsButtons";

export function BotRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<BotRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    fetchBotRunDetail(Number(id))
      .then(setRun)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load run"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-status">
        <div className="spinner" aria-hidden />
        <p className="hint">Loading run details…</p>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="panel">
        <p className="error">{error ?? "Run not found"}</p>
        <Link to="/history" className="back-link">
          ← Back to run history
        </Link>
      </div>
    );
  }

  return (
    <div className="lead-bot">
      <section className="panel">
        <Link to="/history" className="back-link">
          ← Back to run history
        </Link>

        <h2>{run.category} — Run #{run.id}</h2>

        <div className="run-detail-meta">
          <p>
            <span className="label">Member</span>
            {run.runBy?.name ?? "Unknown"}
          </p>
          <p>
            <span className="label">Platform</span>
            {run.platform}
          </p>
          <p>
            <span className="label">Keyword</span>
            {run.keyword}
          </p>
          <p>
            <span className="label">Run at</span>
            {new Date(run.runAt).toLocaleString()}
          </p>
          {run.startDate && run.endDate && (
            <p>
              <span className="label">Date filter</span>
              {run.startDate} → {run.endDate}
            </p>
          )}
          <p>
            <span className="label">Leads found</span>
            {run.totalFound} ({run.totalScanned} scanned)
          </p>
        </div>
      </section>

      <section className="panel results">
        <div className="results-header">
          <h3>{run.leads.length} leads from database</h3>
          <ExportLeadsButtons
            leads={run.leads}
            filenameBase={`run-${run.id}-${run.category}`}
            pdfTitle={`${run.category} — Run #${run.id}`}
            pdfSubtitle={`${run.platform} · ${run.runBy?.name ?? "Unknown"} · ${new Date(run.runAt).toLocaleString()}`}
          />
        </div>

        {run.leads.length === 0 ? (
          <p className="hint">
            No leads linked to this run in the database. Runs before this update may not have
            stored lead links — run the bot again to track leads per run.
          </p>
        ) : (
          <div className="lead-list">
            {run.leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
