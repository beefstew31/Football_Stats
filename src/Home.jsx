import React from "react";
import { Link } from "react-router-dom";

export default function Home({ season }) {
  return (
    <div className="landing">
      <h1 style={{ marginBottom: 8 }}>Welcome</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Choose a section below. Set a season in the top-right for season-aware pages.
      </p>

      <div className="landing-grid">
        <LandingCard
          title="Standings"
          description="League table with wins, losses, points for/against."
          to="/standings"
        />
        <LandingCard
          title="Teams"
          description="Browse schedules; click into a team for details."
          to="/teams"
        />
        <LandingCard
          title="Players"
          description="Filter by team; click a player for ESPN-style page."
          to="/players"
        />
        <LandingCard
          title="Upload"
          description="Parse CSVs and publish to Supabase for this season."
          to="/upload"
          accent
        />
      </div>

      {!season && (
        <div className="tip">
          <strong>Tip:</strong> enter a season (e.g. <code>2025</code>) in the top-right.
        </div>
      )}
    </div>
  );
}

function LandingCard({ title, description, to, accent=false }) {
  return (
    <Link to={to} className={`card landing-card ${accent ? "accent" : ""}`}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      <div className="muted">{description}</div>
    </Link>
  );
}
