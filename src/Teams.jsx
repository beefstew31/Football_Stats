import React from "react";
import { Link } from "react-router-dom";

/* sanity marker so we know the right file is building */
console.log("[TeamList.jsx] loaded");

export function Teams({ season, team, setTeam, schedulesByTeam }) {
  const teams = Object.keys(schedulesByTeam || {}).sort();
  const games = team ? schedulesByTeam[team] || [] : [];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>Teams</h3>
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="">— Select team —</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="spacer"></div>

      {/* quick links */}
      <div className="row" style={{ flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {teams.map((t) => (
          <Link
            key={t}
            className="btn"
            to={`/season/${season}/team/${encodeURIComponent(t)}`}
          >
            {t}
          </Link>
        ))}
      </div>

      {/* inline schedule preview for selected team */}
      {!team ? (
        <div className="muted">Pick a team or click a button above.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Week</th>
              <th>Opponent</th>
              <th>H/A</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => (
              <tr key={i}>
                <td>{g.date}</td>
                <td>{g.week}</td>
                <td>{g.opponent}</td>
                <td>{g.home_away}</td>
                <td>{g.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
