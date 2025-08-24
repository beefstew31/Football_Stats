import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Players from "./Players.jsx";
import TeamPage from "./TeamPage.jsx";
import Upload from "./Upload.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/season/2024" replace />} />
        <Route path="/season/:season/player/:playerSlug" element={<Players />} />
        <Route path="/season/:season/team/:teamName" element={<TeamPage />} />
        <Route path="/admin/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
}
