import { useEffect, useState } from "react";
import {
  fetchCategories,
  fetchPlatforms,
  runLeadBot,
  type BotRunResult,
  type Category,
  type Platform,
} from "../api/leads";
import { LeadCard } from "./LeadCard";
import { ExportLeadsButtons } from "./ExportLeadsButtons";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIsoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function LeadBot() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [startDate, setStartDate] = useState(daysAgoIsoDate(7));
  const [endDate, setEndDate] = useState(todayIsoDate());
  const [maxPages, setMaxPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BotRunResult | null>(null);

  useEffect(() => {
    Promise.all([fetchPlatforms(), fetchCategories()])
      .then(([platformItems, categoryItems]) => {
        setPlatforms(platformItems);
        setCategories(categoryItems);
        if (platformItems[0]) setPlatform(platformItems[0].id);
        if (categoryItems[0]) setCategory(categoryItems[0].id);
      })
      .catch(() =>
        setError("Could not connect to backend. Start it with: cd backend && npm run dev"),
      );
  }, []);

  async function handleRun(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!platform || !category) {
      setError("Select a platform and category.");
      return;
    }

    const selected = platforms.find((item) => item.id === platform);
    if (selected?.enabled === false) {
      setError(`${selected.name} is coming soon. Please use OnlineJobs.ph for now.`);
      return;
    }

    if (useDateFilter && startDate && endDate && startDate > endDate) {
      setError("Start date must be on or before end date.");
      return;
    }

    setLoading(true);
    try {
      const data = await runLeadBot({
        platform,
        category,
        maxPages,
        startDate: useDateFilter ? startDate : undefined,
        endDate: useDateFilter ? endDate : undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const selectedPlatform = platforms.find((item) => item.id === platform);
  const selectedCategory = categories.find((item) => item.id === category);

  return (
    <div className="lead-bot">
      <section className="panel">
        <h2>Lead Bot</h2>
        <p className="subtitle">
          Select a platform and category — the bot scrapes all job pages from the platform search.
        </p>

        <form className="bot-form" onSubmit={handleRun}>
          <div className="form-row">
            <label>
              Platform
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                disabled={loading}
              >
                {platforms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.enabled === false ? " " : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useDateFilter}
              onChange={(e) => setUseDateFilter(e.target.checked)}
              disabled={loading}
            />
            Filter by posted date
          </label>

          {useDateFilter && (
            <>
              <div className="form-row">
                <label>
                  Start date
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                  />
                </label>
              </div>
              <p className="hint date-filter-note">
                Only jobs <strong>posted on the platform</strong> between these dates are included.
                Widen the range or turn off the filter to get more leads.
              </p>
              <div className="date-presets">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={loading}
                  onClick={() => {
                    setStartDate(daysAgoIsoDate(7));
                    setEndDate(todayIsoDate());
                  }}
                >
                  Last 7 days
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={loading}
                  onClick={() => {
                    setStartDate(daysAgoIsoDate(30));
                    setEndDate(todayIsoDate());
                  }}
                >
                  Last 30 days
                </button>
              </div>
            </>
          )}

          {selectedPlatform && <p className="hint">{selectedPlatform.description}</p>}

          {selectedCategory && (
            <p className="hint">
              Searching for <strong>{selectedCategory.label}</strong> jobs
              {useDateFilter && startDate && endDate && (
                <>
                  {" "}
                  from <strong>{startDate}</strong> to <strong>{endDate}</strong>
                </>
              )}
            </p>
          )}

          <label>
            Max pages (0 = all pages on platform)
            <input
              type="number"
              min={0}
              max={20}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || platforms.length === 0 || categories.length === 0}
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm" aria-hidden />
                Scraping leads…
              </>
            ) : (
              "Run Bot"
            )}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="panel results">
          <div className="results-header">
            <div>
              <h3>
                {result.totalFound} {result.category} leads
              </h3>
              <span className="meta">
              {result.runBy && (
                <>
                  Run by <strong>{result.runBy.name}</strong> ·{" "}
                </>
              )}
              {result.totalOnPlatform !== null && (
                <>
                  {result.totalOnPlatform} on platform · {result.pagesScraped} pages scraped ·{" "}
                </>
              )}
              {result.startDate && result.endDate
                ? `${result.startDate} → ${result.endDate} · `
                : ""}
              {result.totalScanned} collected
              {result.savedToDatabase > 0 ? ` · ${result.savedToDatabase} saved` : ""}
              {result.skippedDuplicates > 0
                ? ` · ${result.skippedDuplicates} duplicates skipped`
                : ""}{" "}
              · {new Date(result.runAt).toLocaleString()}
              </span>
            </div>
            <ExportLeadsButtons
              leads={result.leads}
              filenameBase={`${result.category}-${result.platform}`}
              pdfTitle={`${result.category} Leads`}
              pdfSubtitle={`${result.platform} · ${result.totalFound} leads · ${new Date(result.runAt).toLocaleString()}`}
            />
          </div>

          {result.startDate && result.endDate && result.totalRelevant > result.totalFound && (
            <p className="date-filter-warning">
              Date filter: <strong>{result.totalFound}</strong> of{" "}
              <strong>{result.totalRelevant}</strong> collected jobs were posted between{" "}
              <strong>{result.startDate}</strong> and <strong>{result.endDate}</strong>. OnlineJobs.ph
              only had {result.totalFound} matching that range — widen dates or disable the filter for
              more results.
            </p>
          )}

          <div className="lead-list">
            {result.leads.length === 0 && (
              <p className="hint">
                No leads found. Try turning off the date filter or setting max pages to 0 (all pages).
              </p>
            )}

            {result.leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
