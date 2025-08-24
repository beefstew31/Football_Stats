// src/Teams.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { supa } from "./supa";

export default function Teams({ season: seasonProp }) {
  const params = useParams();
  const season = params.season || seasonProp || "";
  const [team, setTeam] = React.useState("");
  const [teams, setTeams] = React.useState([]);
  const [games, setGames] = React.useState([]);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!season) return;
    let live = true;
    (async () => {
      try {
        // discover available team files by loading standings or players then deriving names
        const { data } = supa
          .storage
          .from(import.meta.env.VITE_SUPABASE_BUCKET)
          .getPublicUrl(`stats/${season}/standings.json`);
        const r = await fetch(data.publicUrl);
        const list = r.ok ? await r.json() : [];
        const names = list.map(s => s.team).sort();
        if (live) setTeams(names);
        if (live && !team && names.length) setTeam(names[0]);
      } catch (e) {
        if (live) setErr(e.message || "Failed to load teams");
      }
    })();
    return () => { live = false; };
  }, [season]);

  React.useEffect(() => {
    if (!season || !team) return;
    let live = true;
    (async () => {
      try {
        const { data } = supa
          .storage
          .from(import.meta.env.VITE_SUPABASE_BUCKET)
          .getPublicUrl(`stats/${season}/teams/${encodeURIComponent(team)}.json`);
        const r = await fetch(data.publicUrl);
        const json = r.ok ? await r.json() : [];
        if (live) setGames(json);
      } catch (e) {
        if (live) setErr(e.message || "Failed to load schedule");
      }
    })();
    return () => { live = false; };
  }, [season, team]);

  if (!season) return <div className="muted">Enter a season.</div>;
  if (err) return <div className="muted">Error: {err}</div>;

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>Teams</h3>
        <select value={team} onChange={e=>setTeam(e.target.value)}>
          <option value="">— Select team —</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="spacer"></div>
      {!team ? <div className="muted">Pick a team.</div> : (
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Week</th><th>Opponent</th><th>H/A</th><th>Result</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g,i)=>(
              <tr key={i}>
                <td>{g.date}</td>
                <td>{g.week}</td>
                <td>
                  <Link to={`/season/${season}/team/${encodeURIComponent(g.opponent)}`}>{g.opponent}</Link>
                </td>
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
