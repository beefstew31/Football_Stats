import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./styles.css";

/** Safely import pages that might export default OR named */
import * as StandingsMod from "./Standings.jsx";
import * as TeamsMod from "./Teams.jsx";
import * as PlayersMod from "./Players.jsx";
import * as UploadMod from "./Upload.jsx";
import * as HomeMod from "./Home.jsx";

/** Resolve the component regardless of export style */
const Standings = StandingsMod.default ?? StandingsMod.Standings;
const Teams = TeamsMod.default ?? TeamsMod.Teams;
const Players = PlayersMod.default ?? PlayersMod.Players ?? PlayersMod.PlayerPage; // allow either name
const Upload = UploadMod.default ?? UploadMod.Upload;
const Home = HomeMod.default ?? HomeMod.Home;

export default function App() {
  // keep season at the top so all routes can read/update it
  const [season, setSeason] = React.useState(
    localStorage.getItem("fs_season") || ""
  );

  const handleSeason = (v) => {
    setSeason(v);
    localStorage.setItem("fs_season", v);
  };

  return (
    <BrowserRouter>
      <TopNav season={season} onSeasonChange={handleSeason} />
      <div className="wrap">
        <Routes>
          <Route path="/" element={<Home season={season} />} />

          {/* main sections */}
          <Route path="/standings" element={<Standings season={season} />} />
          <Route path="/teams" element={<Teams season={season} />} />
          <Route path="/players" element={<Players season={season} />} />
          <Route path="/upload" element={<Upload season={season} />} />

          {/* deep routes (team / player pages) */}
          <Route path="/season/:season/team/:teamName" element={<Teams />} />
          <Route path="/season/:season/player/:playerSlug" element={<Players />} />

          {/* last resort */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function TopNav({ season, onSeasonChange }) {
  return (
    <header className="nav">
      <div className="nav-left">
        <Link className="brand" to="/">🏈 Football Stats</Link>
        <Link className="tab" to="/standings">Standings</Link>
        <Link className="tab" to="/teams">Teams</Link>
        <Link className="tab" to="/players">Players</Link>
        <Link className="tab" to="/upload">Upload</Link>
      </div>

      <div className="nav-right">
        <label className="muted" style={{ marginRight: 8 }}>Season</label>
        <input
          placeholder="e.g. 2025"
          value={season}
          onChange={(e) => onSeasonChange(e.target.value)}
          className="season-input"
          style={{ width: 110 }}
        />
      </div>
    </header>
  );
}
