import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { setPasswordFromInvite, verifyInvite } from "../api/auth";
import { BrandLogo } from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";

export function SetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { completeAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setInviteError("Invalid invite link");
      setLoadingInvite(false);
      return;
    }

    verifyInvite(token)
      .then((invite) => {
        setName(invite.name);
        setEmail(invite.email);
      })
      .catch((err) => {
        setInviteError(err instanceof Error ? err.message : "Invalid or expired invite link");
      })
      .finally(() => setLoadingInvite(false));
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) return;

    setSubmitting(true);
    try {
      const response = await setPasswordFromInvite(token, password);
      completeAuth(response);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInvite) {
    return (
      <main className="auth-page">
        <div className="panel auth-panel loading-inline">
          <div className="spinner" aria-hidden />
          <p className="meta">Verifying invite…</p>
        </div>
      </main>
    );
  }

  if (inviteError) {
    return (
      <main className="auth-page">
        <div className="panel auth-panel">
          <h1>Invite expired</h1>
          <p className="error">{inviteError}</p>
          <p className="hint">Ask your admin to send a new invite.</p>
          <Link to="/login" className="btn-secondary" style={{ display: "inline-flex", marginTop: "1rem" }}>
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="panel auth-panel">
        <BrandLogo size="md" />
        <h1>Set your password</h1>
        <p className="subtitle">Welcome, {name}! Create a password to access BestechVision.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} readOnly />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner spinner-sm" aria-hidden />
                Creating account…
              </>
            ) : (
              "Create account & sign in"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
