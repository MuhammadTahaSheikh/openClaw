import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-top">
        <BrandLogo size="sm" />
        {isAuthenticated && (
          <div className="header-actions">
            <span className="user-badge">
              {user?.name}
              {user?.role === "admin" && <span className="badge badge-success">Admin</span>}
            </span>
            <button type="button" className="btn-secondary btn-sm" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>

      {isAuthenticated && (
        <nav className="nav">
          <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>
            Lead Bot
          </Link>
          <Link
            to="/history"
            className={location.pathname === "/history" ? "nav-link active" : "nav-link"}
          >
            Run History
          </Link>
          <Link
            to="/tracker"
            className={location.pathname === "/tracker" ? "nav-link active" : "nav-link"}
          >
            Lead Tracker
          </Link>
          <Link
            to="/members/add"
            className={location.pathname.startsWith("/members") ? "nav-link active" : "nav-link"}
          >
            Add Member
          </Link>
        </nav>
      )}
    </header>
  );
}
