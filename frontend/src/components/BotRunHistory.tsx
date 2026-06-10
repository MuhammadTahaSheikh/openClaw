import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBotRunHistory, type BotRunHistoryItem } from "../api/leads";

export function BotRunHistory() {
  const navigate = useNavigate();
  const [runHistory, setRunHistory] = useState<BotRunHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBotRunHistory(20)
      .then(setRunHistory)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load run history"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="lead-bot">
      <section className="panel">
        <h2>Bot run history</h2>
        <p className="subtitle">Click a row to view all leads from that run.</p>

        {loading && (
          <div className="loading-inline">
            <div className="spinner" aria-hidden />
            <p className="hint">Loading history…</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}

        {!loading && !error && runHistory.length === 0 && (
          <p className="hint">No bot runs yet. Run the bot from the Lead Bot tab.</p>
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
                    <td>{run.totalFound}</td>
                    <td>{new Date(run.runAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
