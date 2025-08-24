// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './styles.css';

import Standings from './Standings.jsx';
import Teams from './Teams.jsx';
import { Players, PlayerPage } from './Players.jsx';  // note destructure both
import Upload from './Upload.jsx';
import Home from './Home.jsx';

export default function App() {
  const [season, setSeason] = React.useState(localStorage.getItem('fs_season') || '');

  const handleSeason = (v) => {
    setSeason(v);
    localStorage.setItem('fs_season', v);
  };

  return (
    <BrowserRouter>
      <TopNav season={season} onSeasonChange={handleSeason} />
      <Routes>
        <Route path="/" element={<Home season={season} />} />
        <Route path="/standings" element={<Standings season={season} />} />
        <Route path="/teams" element={<Teams season={season} />} />
        <Route path="/players" element={<Players season={season} />} />
        <Route path="/upload" element={<Upload season={season} />} />
        {/* deep routes */}
        <Route path="/season/:season/team/:teamName" element={<Teams />} />
        <Route path="/season/:season/player/:playerSlug" element={<PlayerPage />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
