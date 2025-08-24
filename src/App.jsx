// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./styles.css";

// import each module; use default and named exports as needed
import Home from "./Home.jsx";
import Standings from "./Standings.jsx";
import Teams from "./Teams.jsx";
import Players, { PlayerPage } from "./Players.jsx"; // PlayerPage is explicitly imported
import Upload from "./Upload.jsx";

/*
  You can later connect these to your authentication provider.
  For now, they just show simple placeholder pages.
*/
const SignUp = () => (
  <div className="wrap">
    <h2 style={{ marginTop: 0 }}>Sign up</h2>
    <p className="muted">Hook this to Supabase Auth or another provider later.</p>
  </div>
);

const LogIn = () => (
  <div className="wrap">
    <h2 style={{ marginTop: 0 }}>Log in</h2>
    <p className="muted">Hook this to Supabase Auth or another provider later.</p>
  </div>
);

export default function App() {
  // maintain season globally so that it can be passed down to children
  const [season, setSeason] = React.useState(
    localStorage.getItem("fs_season") || ""
  );

  const handleSeason = (value) => {
    setSeason(value);
    localStorage.setItem("fs_season", value);
  };

  return (
    <BrowserRouter>
      <TopNav season={season} onSeasonChange={handleSeason} />
      <Routes>
        <Route path="/" element={<Home season={season} />} />
        <Route path="/standings" element={<Standings season={season} />} />
        <Route path="/teams" element={<Teams season={season} />} />
        {/* Players renders the list by default */}
        <Route path="/players" element={<Players season={season} />} />
        <Route path="/upload" element={<Upload season={season} />} />

        {/* Deeper routes:
            - Team page: use Teams again so it can read params
            - Player page: use PlayerPage (imported above) to show single-player view
        */}
        <Route
          path="/season/:season/team/:teamName"
          element={<Teams />}
        />
        <Route
          path="/season/:season/player/:playerSlug"
          element={<PlayerPage />}
        />

        {/* auth placeholders */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />

        {/* Catch all: redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function TopNav({ season, onSeasonChange }) {
  return (
    <header className="nav">
      <div className="nav-left">
        <Link className="brand" to="/">
          PennLive
        </Link>
        <Link className="tab" to="/teams">
          Teams
        </Link>
        <Link className="tab" to="/standings">
          Standings
        </Link>
        <Link className="tab" to="/players">
          Player Stats
        </Link>
        <Link className="tab" to="/upload">
          Upload
        </Link>
      </div>
      <div className="nav-right">
      <label className="muted" style={{ marginRight: 8 }}>
          Season
        </label>
        <input
          placeholder="e.g. 2025"
          value={season}
          onChange={(e) => onSeasonChange(e.target.value)}
          className="season-input"
        />
      </div>
    </header>
  );
}
