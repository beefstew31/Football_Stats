import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Players from "./Players.jsx";       // list page
import PlayerPage from "./PlayerPage.jsx"; // individual page

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/season/2025/players" replace />} />
        <Route path="/season/:season/players" element={<Players />} />
        <Route path="/season/:season/player/:playerSlug" element={<PlayerPage />} />
        {/* ... your other routes ... */}
      </Routes>
    </BrowserRouter>
  );
}
