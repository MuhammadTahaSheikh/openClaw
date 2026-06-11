import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createTrackerRow,
  deleteTrackerRow,
  fetchTracker,
  updateTrackerRow,
  type TrackerRow,
  type TrackerRowInput,
  type TrackerState,
} from "../api/tracker";
import { exportTrackerToCsv } from "../utils/exportTracker";

const FIELD_KEYS: (keyof TrackerRowInput)[] = [
  "date",
  "name",
  "jobTitle",
  "employmentType",
  "email",
  "linkedin",
  "phone",
  "source",
  "remarks",
  "connects",
  "projectPrice",
];

const EMPTY_ROW: TrackerRowInput = {
  date: "",
  name: "",
  jobTitle: "",
  employmentType: "",
  email: "",
  linkedin: "",
  phone: "",
  source: "",
  remarks: "",
  connects: "",
  projectPrice: "",
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateForInput(value: string | null | undefined): string {
  if (!value) return "";
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

const LINK_FIELDS = new Set<keyof TrackerRowInput>(["email", "source"]);

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "—" },
  { value: "Part-time", label: "Part-time" },
  { value: "Full-time", label: "Full-time" },
] as const;

const SELECT_FIELDS = new Set<keyof TrackerRowInput>(["employmentType"]);

function getLinkHref(field: keyof TrackerRowInput, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (field === "email") {
    const email = trimmed.replace(/^mailto:/i, "");
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return `mailto:${email}`;
    return null;
  }

  if (field === "source") {
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
    if (/^[a-z0-9][-a-z0-9]*(\.[a-z0-9][-a-z0-9]*)+([\/?#].*)?$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return null;
  }

  return null;
}

function getCellValue(row: TrackerRow, field: keyof TrackerRowInput): string {
  if (field === "date") return formatDateForInput(row.date);
  return ((row[field] ?? "") as string);
}

export function LeadTracker() {
  const { user } = useAuth();
  const [tracker, setTracker] = useState<TrackerState | null>(null);
  const [filterUserId, setFilterUserId] = useState<number | "all">("all");
  const [draft, setDraft] = useState<TrackerRowInput>({ ...EMPTY_ROW, date: todayIsoDate() });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const showOwnerColumn = true;

  function handleExportCsv() {
    if (!tracker || tracker.rows.length === 0) return;

    setExporting(true);
    try {
      const filterLabel =
        filterUserId === "all"
          ? "all-members"
          : tracker.users?.find((member) => member.id === filterUserId)?.name ?? "filtered";
      exportTrackerToCsv(tracker.rows, tracker.headers, `lead-tracker-${filterLabel}`);
    } finally {
      setExporting(false);
    }
  }

  async function loadTracker(userId?: number) {
    setError(null);
    try {
      const data = await fetchTracker(userId);
      setTracker(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracker");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    if (filterUserId === "all") {
      loadTracker();
    } else {
      loadTracker(filterUserId);
    }
  }, [filterUserId, user?.role]);

  async function handleAddRow(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createTrackerRow(draft);
      setDraft({ ...EMPTY_ROW, date: todayIsoDate() });
      await loadTracker(filterUserId === "all" ? undefined : filterUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add row");
    } finally {
      setSaving(false);
    }
  }

  async function handleCellBlur(row: TrackerRow, field: keyof TrackerRowInput, value: string) {
    const current =
      field === "date" ? formatDateForInput(row.date) : ((row[field] ?? "") as string);
    if (current === value) return;

    try {
      await updateTrackerRow(row.id, {
        date: row.date,
        name: row.name,
        jobTitle: row.jobTitle,
        employmentType: row.employmentType,
        email: row.email,
        linkedin: row.linkedin,
        phone: row.phone,
        source: row.source,
        remarks: row.remarks,
        connects: row.connects,
        projectPrice: row.projectPrice,
        [field]: value,
      });
      await loadTracker(filterUserId === "all" ? undefined : filterUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save row");
    }
  }

  async function handleDelete(rowId: number) {
    if (!window.confirm("Delete this row?")) return;

    try {
      await deleteTrackerRow(rowId);
      await loadTracker(filterUserId === "all" ? undefined : filterUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete row");
    }
  }

  return (
    <div className="lead-bot tracker-page">
      <section className="panel">
        <h2>Lead Tracker</h2>
        <p className="subtitle">
          Shared team lead sheet — everyone can add, edit, and delete leads. The Team Member column
          shows who added each row.
        </p>

        {tracker && (
          <div className="tracker-toolbar">
            {tracker.users && (
              <div className="tracker-filter">
                <label>
                  Show leads for
                  <select
                    value={filterUserId === "all" ? "all" : String(filterUserId)}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilterUserId(value === "all" ? "all" : Number(value));
                    }}
                  >
                    <option value="all">All members</option>
                    {user && (
                      <option value={String(user.id)}>My leads ({user.name})</option>
                    )}
                    {tracker.users
                      .filter((member) => member.id !== user?.id)
                      .map((member) => (
                        <option key={member.id} value={String(member.id)}>
                          {member.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            )}
            {tracker.rows.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleExportCsv}
                disabled={exporting}
              >
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="loading-inline">
            <div className="spinner" aria-hidden />
            <p className="hint">Loading tracker…</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}

        {tracker && (
          <>
            <form className="tracker-add-form" onSubmit={handleAddRow}>
                <h3>New lead</h3>
                <div className="tracker-add-grid">
                  {FIELD_KEYS.map((field, index) => (
                    <label key={field}>
                      {tracker.headers[index]}
                      {SELECT_FIELDS.has(field) ? (
                        <select
                          value={(draft[field] as string) ?? ""}
                          onChange={(e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                          disabled={saving}
                        >
                          {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value || "empty"} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field === "date" ? "date" : "text"}
                          value={(draft[field] as string) ?? ""}
                          onChange={(e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                          disabled={saving}
                        />
                      )}
                    </label>
                  ))}
                </div>
                <div className="tracker-add-actions">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner spinner-sm" aria-hidden />
                        Saving lead…
                      </>
                    ) : (
                      <>
                        <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z" />
                        </svg>
                        Add Lead
                      </>
                    )}
                  </button>
                </div>
            </form>

            <div className="tracker-table-wrap">
              <table className="tracker-table">
                <thead>
                  <tr>
                    {showOwnerColumn && <th>Team Member</th>}
                    {tracker.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {tracker.rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={tracker.headers.length + (showOwnerColumn ? 2 : 1)}
                        className="tracker-empty"
                      >
                        No rows yet. Add your first lead above.
                      </td>
                    </tr>
                  )}
                  {tracker.rows.map((row) => (
                    <tr key={`${row.id}-${row.updatedAt}`}>
                      {showOwnerColumn && (
                        <td className="tracker-owner-cell">
                          {row.ownerName ?? user?.name ?? "Unknown"}
                        </td>
                      )}
                      {FIELD_KEYS.map((field) => {
                        const value = getCellValue(row, field);
                        const cellKey = `${row.id}-${field}`;
                        const href = LINK_FIELDS.has(field) ? getLinkHref(field, value) : null;
                        const isEditing = editingCell === cellKey;
                        const showAsLink = LINK_FIELDS.has(field) && href && !isEditing;

                        if (showAsLink) {
                          return (
                            <td key={field} className="tracker-link-cell">
                              <a
                                className="tracker-cell-link"
                                href={href}
                                target={field === "email" ? undefined : "_blank"}
                                rel={field === "email" ? undefined : "noopener noreferrer"}
                                title={field === "email" ? `Email ${value}` : `Open ${value}`}
                              >
                                {value}
                              </a>
                              <button
                                type="button"
                                className="tracker-cell-edit"
                                onClick={() => setEditingCell(cellKey)}
                                title="Edit"
                              >
                                Edit
                              </button>
                            </td>
                          );
                        }

                        if (SELECT_FIELDS.has(field)) {
                          return (
                            <td key={field}>
                              <select
                                className="tracker-cell-input"
                                value={value}
                                onChange={(e) => handleCellBlur(row, field, e.target.value)}
                              >
                                {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                                  <option key={option.value || "empty"} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          );
                        }

                        return (
                          <td key={field}>
                            <input
                              className="tracker-cell-input"
                              type={field === "date" ? "date" : "text"}
                              defaultValue={value}
                              autoFocus={isEditing}
                              onBlur={(e) => {
                                handleCellBlur(row, field, e.target.value);
                                if (isEditing) setEditingCell(null);
                              }}
                            />
                          </td>
                        );
                      })}
                      <td>
                        <button
                          type="button"
                          className="btn-danger btn-sm tracker-delete-btn"
                          onClick={() => handleDelete(row.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
