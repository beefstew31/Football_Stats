// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './styles.css';
import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./styles.css";

import Standings from './Standings.jsx';
import Teams from './Teams.jsx';
import { Players, PlayerPage } from './Players.jsx';  // note destructure both
import Upload from './Upload.jsx';
import Home from './Home.jsx';
import * as StandingsMod from "./Standings.jsx";
import * as TeamsMod from "./Teams.jsx";
import * as PlayersMod from "./Players.jsx";
import * as UploadMod from "./Upload.jsx";
import * as HomeMod from "./Home.jsx";

const Standings = StandingsMod.default ?? StandingsMod.Standings;
const Teams     = TeamsMod.default     ?? TeamsMod.Teams;
const Players   = PlayersMod.default   ?? PlayersMod.Players ?? PlayersMod.PlayerPage;
const Upload    = UploadMod.default    ?? UploadMod.Upload;
const Home      = HomeMod.default      ?? HomeMod.Home;

// optional placeholders for auth pages
const SignUp = () => (
  <div className="wrap">
    <h2 style={{marginTop:0}}>Sign up</h2>
    <p className="muted">Hook this to Supabase Auth or your provider later.</p>
  </div>
);
const LogIn = () => (
  <div className="wrap">
    <h2 style={{marginTop:0}}>Log in</h2>
    <p className="muted">Hook this to Supabase Auth or your provider later.</p>
  </div>
);

export default function App() {
  const [season, setSeason] = React.useState(localStorage.getItem('fs_season') || '');
  const [season, setSeason] = React.useState(localStorage.getItem("fs_season") || "");

const handleSeason = (v) => {
setSeason(v);
    localStorage.setItem('fs_season', v);
    localStorage.setItem("fs_season", v);
};

return (
@@ -26,12 +46,40 @@ export default function App() {
<Route path="/teams" element={<Teams season={season} />} />
<Route path="/players" element={<Players season={season} />} />
<Route path="/upload" element={<Upload season={season} />} />

{/* deep routes */}
<Route path="/season/:season/team/:teamName" element={<Teams />} />
        <Route path="/season/:season/player/:playerSlug" element={<PlayerPage />} />
        {/* fallback */}
        <Route path="/season/:season/player/:playerSlug" element={<Players />} />

        {/* auth placeholders */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />

<Route path="*" element={<Navigate to="/" replace />} />
</Routes>
</BrowserRouter>
);
}

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
          onChange={(e)=>onSeasonChange(e.target.value)}
          className="season-input"
        />
      </div>
    </header>
  );
}
