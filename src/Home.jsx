import React from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import pennLive from "./assets/penn_live.png";
import { supa } from "./supa";

export default function Home({ season }) {
  const [showAuth, setShowAuth] = React.useState(null); // 'login' | 'signup' | null
  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supa.auth.getUser();
      if (active) setUser(data?.user || null);
    })();
    const { data: sub } = supa.auth.onAuthStateChange((_evt, sess) => {
      setUser(sess?.user || null);
    });
    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const onAuthed = () => setShowAuth(null);

  return (
    <div className="landing-light">
      {/* Logo */}
      <div className="hero">
        <img className="hero-logo" src={pennLive} alt="PennLive" />
        <h1 className="hero-title">PennLive Football Stats</h1>
        <p className="hero-sub">
          Clean, fast team & player stats. {season ? `Season: ${season}` : "Set a season in the top-right."}
        </p>
      </div>

      {/* Primary actions */}
      <div className="cta-grid">
        <HomeButton to="/teams" label="Teams" />
        <HomeButton to="/standings" label="Standings" />
        <HomeButton to="/players" label="Player Stats" />
        <HomeButton to="/upload" label="Upload" primary />
      </div>

      {/* Auth */}
      <div className="auth-strip">
        {!user ? (
          <>
            <button className="pill-button" onClick={() => setShowAuth("signup")}>Sign up</button>
            <button className="pill-button outline" onClick={() => setShowAuth("login")}>Log in</button>
          </>
        ) : (
          <>
            <span className="muted">Signed in as <strong>{user.email}</strong></span>
            <button
              className="pill-button outline"
              onClick={async () => {
                await supa.auth.signOut();
                navigate("/");
              }}
            >
              Log out
            </button>
          </>
        )}
      </div>

      {/* Footer tip */}
      {!season && (
        <div className="light-tip">
          <strong>Tip:</strong> enter a season (e.g. <code>2025</code>) in the top-right.
        </div>
      )}

      {/* Auth modal */}
      {showAuth && (
        <AuthModal
          mode={showAuth}            // 'login' | 'signup'
          onClose={() => setShowAuth(null)}
          onSuccess={onAuthed}
        />
      )}
    </div>
  );
}

function HomeButton({ to, label, primary }) {
  const className = `home-card ${primary ? "primary" : ""}`;
  return (
    <Link className={className} to={to}>
      <span>{label}</span>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path d="M8 5l8 7-8 7" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </Link>
  );
}
