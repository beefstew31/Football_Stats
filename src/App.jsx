// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./styles.css";
import Home from "./Home.jsx";
import Teams from "./Teams.jsx";
import Standings from "./Standings.jsx";
import Players, { PlayerPage } from "./Players.jsx"; // default Players, named PlayerPage
import Upload from "./Upload.jsx";
import TeamPage from "./TeamPage.jsx";

// Simple navigation bar component; you could extract this into its own file
function TopNav({ season, onSeasonChange }) {
  return (
    <header className="nav">
      <div className="nav-left">
        <Link className="brand" to="/">PennLive</Link>
        <Link className="tab" to="/teams">Teams</Link>
        <Link className="tab" to="/standings">Standings</Link>
        <Link className="tab" to="/players">Player Stats</Link>
        <Link className="tab" to="/upload">Upload</Link>
      </div>
      <div className="nav-right">
        <label className="muted">Season</label>
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

export default function App() {
  const [season, setSeason] = useState(localStorage.getItem("fs_season") || "");

  const handleSeasonChange = (value) => {
    setSeason(value);
    localStorage.setItem("fs_season", value);
  };

  return (
    <BrowserRouter>
      <TopNav season={season} onSeasonChange={handleSeasonChange} />
      <Routes>
        <Route path="/" element={<Home season={season} />} />
        <Route path="/teams" element={<Teams season={season} />} />
        <Route path="/standings" element={<Standings season={season} />} />
        <Route path="/players" element={<Players season={season} />} />
        <Route path="/upload" element={<Upload season={season} />} />

        {/* Detail routes */}
        <Route path="/season/:season/team/:teamName" element={<TeamPage />} />
        <Route path="/season/:season/player/:playerSlug" element={<PlayerPage />} />

        {/* Auth stubs if needed */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
