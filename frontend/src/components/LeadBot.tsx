import { useEffect, useState } from "react";
import {
  fetchCategories,
  fetchPlatforms,
  runLeadBot,
  type BotRunResult,
  type Category,
  type Platform,
} from "../api/leads";

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

          <button type="submit" disabled={loading || platforms.length === 0 || categories.length === 0}>
            {loading ? "Scraping leads..." : "Run Bot"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="panel results">
          <div className="results-header">
            <h3>
              {result.totalFound} {result.category} leads
            </h3>
            <span className="meta">
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
              · {new Date(result.scrapedAt).toLocaleString()}
            </span>
          </div>

          <div className="lead-list">
            {result.leads.length === 0 && (
              <p className="hint">
                No leads found. Try turning off the date filter or setting max pages to 0 (all pages).
              </p>
            )}

            {result.leads.map((lead) => (
              <article key={lead.id} className="lead-card">
                <div className="lead-top">
                  <h4>
                    <a href={lead.url} target="_blank" rel="noreferrer">
                      {lead.title}
                    </a>
                  </h4>
                  {lead.employmentType && <span className="badge">{lead.employmentType}</span>}
                </div>

                <div className="lead-meta">
                  {lead.salary && <span>💰 {lead.salary}</span>}
                  {lead.postedAt && <span>📅 {lead.postedAt}</span>}
                </div>

                {lead.description && (
                  <p className="lead-desc">
                    {lead.description.length > 220
                      ? `${lead.description.slice(0, 220)}…`
                      : lead.description}
                  </p>
                )}

                {lead.skills.length > 0 && (
                  <div className="skills">
                    {lead.skills.map((skill) => (
                      <span key={skill} className="skill">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
