import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-top">
        <h1>{title}</h1>
        {isAuthenticated && (
          <div className="header-actions">
            <span className="user-badge">{user?.name}</span>
            <button type="button" className="btn-secondary" onClick={logout}>
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
