import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createMember,
  deleteMember,
  fetchMembers,
  resendMemberInvite,
  updateMember,
  type Member,
} from "../api/members";

const MEMBER_ROLES = [
  "Developer",
  "Web Developer",
  "Virtual Assistant",
  "Sales",
  "Lead Generation",
  "Marketing",
  "Bookkeeping",
  "Manager",
  "Admin",
  "Customer Support",
] as const;

type EditForm = {
  name: string;
  email: string;
  phone: string;
  role: string;
  notes: string;
};

function toEditForm(member: Member): EditForm {
  return {
    name: member.name,
    email: member.email,
    phone: member.phone ?? "",
    role: member.role ?? "",
    notes: member.notes ?? "",
  };
}

export function AddMemberPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMembers()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const { member, message } = await createMember({
        name,
        email,
        phone: phone || undefined,
        role: role || undefined,
        notes: notes || undefined,
      });

      setMembers((prev) => [member, ...prev]);
      setSuccess(message);
      setName("");
      setEmail("");
      setPhone("");
      setRole("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendInvite(memberId: number) {
    setError(null);
    setSuccess(null);
    setResendingId(memberId);

    try {
      const { member, message } = await resendMemberInvite(memberId);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? member : m)));
      setSuccess(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invite");
    } finally {
      setResendingId(null);
    }
  }

  function startEdit(member: Member) {
    setEditingId(member.id);
    setEditForm(toEditForm(member));
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function handleSaveEdit(member: Member) {
    if (!editForm) return;

    setSavingId(member.id);
    setError(null);
    setSuccess(null);

    try {
      const { member: updated, message } = await updateMember(member.id, {
        name: editForm.name,
        email: member.inviteStatus === "pending" ? editForm.email : undefined,
        phone: editForm.phone || null,
        role: editForm.role || null,
        notes: editForm.notes || null,
      });

      setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
      setSuccess(message);
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(member: Member) {
    const label = member.inviteStatus === "accepted" ? "remove their login too" : "delete this invite";
    if (!window.confirm(`Delete ${member.name}? This will ${label}.`)) return;

    setDeletingId(member.id);
    setError(null);
    setSuccess(null);

    try {
      const { message } = await deleteMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      if (editingId === member.id) cancelEdit();
      setSuccess(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete member");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page-content">
      <div className="panel">
        <h2>Add Member</h2>
        <p className="subtitle">An invite email will be sent so they can set their password and sign in.</p>

        <form className="bot-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Full name *
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </label>

            <label>
              Email *
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Phone
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0100"
              />
            </label>

            <label>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Select role</option>
                {MEMBER_ROLES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Notes
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </label>

          {error && !editingId && <p className="error">{error}</p>}
          {success && !editingId && <p className="success">{success}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner spinner-sm" aria-hidden />
                Adding…
              </>
            ) : (
              "Add member"
            )}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="results-header">
          <h3>Members ({members.length})</h3>
          <Link to="/" className="back-link">
            ← Back to Lead Bot
          </Link>
        </div>

        {loadingMembers ? (
          <p className="meta">Loading members...</p>
        ) : members.length === 0 ? (
          <p className="meta">No members yet. Add your first member above.</p>
        ) : (
          <div className="member-list">
            {members.map((member) => (
              <article key={member.id} className="member-card">
                {editingId === member.id && editForm ? (
                  <div className="member-edit-form">
                    <div className="form-row">
                      <label>
                        Full name *
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          required
                        />
                      </label>
                      <label>
                        Email *
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          disabled={member.inviteStatus === "accepted"}
                          required
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        Phone
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </label>
                      <label>
                        Role
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        >
                          <option value="">Select role</option>
                          {MEMBER_ROLES.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Notes
                      <input
                        type="text"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      />
                    </label>
                    {error && <p className="error">{error}</p>}
                    {success && <p className="success">{success}</p>}
                    <div className="member-actions">
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        disabled={savingId === member.id}
                        onClick={() => handleSaveEdit(member)}
                      >
                        {savingId === member.id ? "Saving…" : "Save"}
                      </button>
                      <button type="button" className="btn-secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="member-top">
                      <h4>{member.name}</h4>
                      {member.role && <span className="badge">{member.role}</span>}
                      <span
                        className={`badge ${member.inviteStatus === "accepted" ? "badge-success" : "badge-pending"}`}
                      >
                        {member.inviteStatus === "accepted" ? "Active" : "Invite pending"}
                      </span>
                    </div>
                    <p className="member-meta">{member.email}</p>
                    {member.phone && <p className="member-meta">{member.phone}</p>}
                    {member.notes && <p className="member-notes">{member.notes}</p>}
                    <div className="member-actions">
                      <button type="button" className="btn-secondary" onClick={() => startEdit(member)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        disabled={deletingId === member.id}
                        onClick={() => handleDelete(member)}
                      >
                        {deletingId === member.id ? "Deleting…" : "Delete"}
                      </button>
                      {member.inviteStatus === "pending" && (
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={resendingId === member.id}
                          onClick={() => handleResendInvite(member.id)}
                        >
                          {resendingId === member.id ? "Sending..." : "Resend invite"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
