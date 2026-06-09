import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createMember, fetchMembers, resendMemberInvite, type Member } from "../api/members";

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
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Developer, Manager, etc."
              />
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

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add member"}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="results-header">
          <h3>Members ({members.length})</h3>
          <Link to="/" className="nav-link">
            Back to Lead Bot
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
                <div className="member-top">
                  <h4>{member.name}</h4>
                  {member.role && <span className="badge">{member.role}</span>}
                  <span className={`badge ${member.inviteStatus === "accepted" ? "badge-success" : "badge-pending"}`}>
                    {member.inviteStatus === "accepted" ? "Active" : "Invite pending"}
                  </span>
                </div>
                <p className="member-meta">{member.email}</p>
                {member.phone && <p className="member-meta">{member.phone}</p>}
                {member.notes && <p className="member-notes">{member.notes}</p>}
                {member.inviteStatus === "pending" && (
                  <button
                    type="button"
                    className="btn-secondary resend-btn"
                    disabled={resendingId === member.id}
                    onClick={() => handleResendInvite(member.id)}
                  >
                    {resendingId === member.id ? "Sending..." : "Resend invite"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
