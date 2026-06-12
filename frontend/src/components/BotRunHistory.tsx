import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchBotRunHistory,
  fetchCategories,
  fetchStoredLeads,
  type BotRunHistoryItem,
  type Category,
  type Lead,
} from "../api/leads";
import { LeadCard } from "./LeadCard";
import { ExportLeadsButtons } from "./ExportLeadsButtons";

function formatDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BotRunHistory() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [runHistory, setRunHistory] = useState<BotRunHistoryItem[]>([]);
  const [dateLeads, setDateLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const hasFilters = Boolean(selectedDate || selectedCategory);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchBotRunHistory(20, {
      date: selectedDate || undefined,
      category: selectedCategory || undefined,
    })
      .then(setRunHistory)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load run history"),
      )
      .finally(() => setLoading(false));
  }, [selectedDate, selectedCategory]);

  useEffect(() => {
    if (!selectedDate) {
      setDateLeads([]);
      setLeadsError(null);
      return;
    }

    setLeadsLoading(true);
    setLeadsError(null);

    fetchStoredLeads({
      startDate: selectedDate,
      endDate: selectedDate,
      category: selectedCategory || undefined,
      limit: 500,
    })
      .then(setDateLeads)
      .catch((err) =>
        setLeadsError(err instanceof Error ? err.message : "Could not load leads for this date"),
      )
      .finally(() => setLeadsLoading(false));
  }, [selectedDate, selectedCategory]);

  const categoryLabel =
    categories.find((item) => item.id === selectedCategory)?.label ?? selectedCategory;

  function clearFilters() {
    setSelectedDate("");
    setSelectedCategory("");
  }

  return (
    <div className="lead-bot">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Bot run history</h2>
            <p className="subtitle">
              Review past bot runs and drill into leads. Click a row to open the full lead list for
              that run.
            </p>
          </div>
          {!loading && runHistory.length > 0 && (
            <span className="history-run-count">
              {runHistory.length} run{runHistory.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="history-filter-bar">
          <div className="history-filter-bar-top">
            <div className="history-filter-heading">
              <svg className="history-filter-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3.5a.5.5 0 01-.16.37l-4.5 4.05v4.58a.5.5 0 01-.28.45l-3 1.5A.5.5 0 018 17.5v-6.07L3.16 6.87A.5.5 0 013 6.5V3z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Filter results</span>
            </div>
            {hasFilters && (
              <button type="button" className="btn-secondary btn-sm" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <div className="history-filters">
            <label className="history-filter-field">
              <span className="history-filter-label">Run date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Filter by run date"
              />
              <span className="history-filter-hint">Leave empty to show all dates</span>
            </label>

            <label className="history-filter-field">
              <span className="history-filter-label">Category</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasFilters && (
            <div className="history-active-filters" aria-live="polite">
              {selectedDate && (
                <span className="history-filter-chip">
                  Run date: {formatDisplayDate(selectedDate)}
                </span>
              )}
              {selectedCategory && (
                <span className="history-filter-chip">Category: {categoryLabel}</span>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="loading-inline">
            <div className="spinner" aria-hidden />
            <p className="hint">Loading history…</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}

        {!loading && !error && runHistory.length === 0 && (
          <p className="hint history-empty-hint">
            {hasFilters
              ? "No bot runs match these filters. Try clearing one or both filters."
              : "No bot runs yet. Run the bot from the Lead Bot tab."}
          </p>
        )}

        {runHistory.length > 0 && (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Category</th>
                  <th>Platform</th>
                  <th>Leads</th>
                  <th>Run at</th>
                </tr>
              </thead>
              <tbody>
                {runHistory.map((run) => (
                  <tr
                    key={run.id}
                    className="history-row-clickable"
                    onClick={() => navigate(`/runs/${run.id}`)}
                  >
                    <td>{run.runBy?.name ?? "Unknown"}</td>
                    <td>{run.category}</td>
                    <td>{run.platform}</td>
                    <td>
                      <span className="history-lead-count">{run.totalFound}</span>
                    </td>
                    <td>{new Date(run.runAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedDate && (
        <section className="panel results">
          <div className="results-header">
            <div>
              <h3>Leads for selected date</h3>
              <p className="subtitle">
                {leadsLoading
                  ? "Loading leads from the database…"
                  : `${dateLeads.length} lead${dateLeads.length === 1 ? "" : "s"} posted on ${formatDisplayDate(selectedDate)}${
                      selectedCategory ? ` · ${categoryLabel}` : ""
                    }`}
              </p>
            </div>
            {dateLeads.length > 0 && (
              <ExportLeadsButtons
                leads={dateLeads}
                filenameBase={`leads-${selectedDate}${selectedCategory ? `-${selectedCategory}` : ""}`}
                pdfTitle={`Leads — ${selectedDate}`}
                pdfSubtitle={`Posted on ${selectedDate}${selectedCategory ? ` · ${categoryLabel}` : ""}`}
              />
            )}
          </div>

          {leadsError && <p className="error">{leadsError}</p>}

          {!leadsLoading && !leadsError && dateLeads.length === 0 && (
            <p className="hint">
              No leads in the database posted on {formatDisplayDate(selectedDate)}
              {selectedCategory ? ` for ${categoryLabel}` : ""}.
            </p>
          )}

          {dateLeads.length > 0 && (
            <div className="lead-list">
              {dateLeads.map((lead) => (
                <LeadCard key={`${lead.platform}-${lead.id}`} lead={lead} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
