// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./styles.css";

import Home from "./Home.jsx";
import Teams from "./Teams.jsx";
import Standings from "./Standings.jsx";
import Players, { PlayerPage } from "./Players.jsx";  // <-- default Players, named PlayerPage
import Upload from "./Upload.jsx";
import TeamPage from "./TeamPage.jsx";  // page for individual teams

// … your auth stubs …

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

        {/* Auth routes (stubs) */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
