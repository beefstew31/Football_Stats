// src/Teams.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { supa } from "./supa";

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET;

// Fetches JSON from Supabase Storage with a cache‑buster
async function fetchJson(path) {
  const { data } = supa.storage.from(BUCKET).getPublicUrl(path);
  const url = `${data.publicUrl}?cb=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = new Error(`GET ${path}: ${res.status} ${res.statusText}`);
    err.body = await res.text().catch(() => "");
    throw err;
  }
  return res.json();
}

export default function Teams({ season: seasonProp }) {
  const params = useParams();
  const season = params.season || seasonProp || "";
  const [team, setTeam] = React.useState("");
  const [teams, setTeams] = React.useState([]);
  const [games, setGames] = React.useState([]);
  const [err, setErr] = React.useState("");

  // load teams from players/index.json or standings.json
  React.useEffect(() => {
    if (!season) return;
    let cancelled = false;
    (async () => {
      setErr("");
      setTeams([]);
      setTeam("");

      try {
        let names = [];
        // 1) Try players index
        try {
          const index = await fetchJson(`stats/${season}/players/index.json`);
          names = [...new Set(index.map((p) => p.team))].filter(Boolean);
        } catch {
          // 2) Fallback to standings.json
          const standings = await fetchJson(`stats/${season}/standings.json`);
          names = standings.map((s) => s.team).filter(Boolean);
        }
        names.sort();
        if (!cancelled) {
          setTeams(names);
          if (!team && names.length) setTeam(names[0]);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Unable to load teams.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [season]);

  // load schedule for selected team
  React.useEffect(() => {
    if (!season || !team) return;
    let cancelled = false;
    (async () => {
      setErr("");
      setGames([]);
      try {
        const data = await fetchJson(`stats/${season}/teams/${encodeURIComponent(team)}.json`);
        if (!cancelled) setGames(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Unable to load schedule.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [season, team]);

  if (!season) return <div className="muted">Enter a season (top‑right).</div>;

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ margin: 0 }}>Teams</h3>
      <select value={team} onChange={(e) => setTeam(e.target.value)}>
        <option value="">— Select team —</option>
        {teams.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      </div>
      <div className="spacer" />
      {err && <div className="muted">Error: {err}</div>}
      {!team ? (
        <div className="muted">Pick a team.</div>
      ) : !games.length ? (
        <div className="muted">No games published for {team}.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Week</th><th>Opponent</th><th>H/A</th><th>Result</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => (
              <tr key={i}>
                <td>{g.date}</td>
                <td>{g.week}</td>
                <td><Link to={`/season/${season}/team/${encodeURIComponent(g.opponent)}`}>{g.opponent}</Link></td>
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
