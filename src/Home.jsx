// src/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "./assets/penn_live.png"; // ensure the file is here

export default function Home({ season }) {
  return (
    <div className="wrap">
      <div className="hero">
        <img src={logo} alt="PennLive" className="hero-logo" />
        <h1>PennLive Football Stats</h1>
        <p>Clean, fast team & player stats. {season ? <>Season: <strong>{season}</strong></> : "Set a season in the top-right."}</p>

        <div className="btn-row" style={{ marginTop: 12 }}>
          <Link className="btn primary" to="/teams">Teams</Link>
          <Link className="btn primary" to="/standings">Standings</Link>
          <Link className="btn primary" to="/players">Player Stats</Link>
          <Link className="btn primary" to="/upload">Upload</Link>

          {/* Auth routes (placeholders for now) */}
          <Link className="btn ghost" to="/signup">Sign up</Link>
          <Link className="btn ghost" to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
