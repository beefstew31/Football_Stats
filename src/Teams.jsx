// src/Teams.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { supa } from './supa';

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET;

// helper: fetch JSON with a cache‑buster
async function fetchJsonFromStorage(path) {
  const { data: pub } = supa.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.publicUrl + (pub.publicUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

export default function Teams({ season: seasonProp }) {
  const params = useParams();
  const season = params.season || seasonProp || '';

  const [team, setTeam] = React.useState('');
  const [teams, setTeams] = React.useState([]);
  const [games, setGames] = React.useState([]);
  const [err, setErr] = React.useState('');

  // 1) Load list of team names from players/index.json or teams folder
  React.useEffect(() => {
    if (!season) return;
    let live = true;
    (async () => {
      setErr('');
      setTeams([]);
      setTeam('');
      try {
        let names = [];
        // Try deriving team names from players index
        try {
          const index = await fetchJsonFromStorage(`stats/${season}/players/index.json`);
          names = Array.from(new Set(index.map(p => p.team)));
        } catch {
          // Fallback: list team files
          const { data: files, error } = await supa.storage
            .from(BUCKET)
            .list(`stats/${season}/teams`, { limit: 500 });
          if (error) throw error;
          names = files
            .filter(f => f.name.toLowerCase().endsWith('.json'))
            .map(f => decodeURIComponent(f.name.replace(/\.json$/i, '')));
        }
        names = names.sort();
        if (live) {
          setTeams(names);
          if (!team && names.length) setTeam(names[0]);
        }
      } catch (e) {
        if (live) setErr(e.message || 'Failed to load teams');
      }
    })();
    return () => { live = false; };
  }, [season]);

  // 2) Load selected team’s schedule
  React.useEffect(() => {
    if (!season || !team) return;
    let live = true;
    (async () => {
      setErr('');
      setGames([]);
      try {
        const path = `stats/${season}/teams/${encodeURIComponent(team)}.json`;
        const json = await fetchJsonFromStorage(path);
        if (live) setGames(Array.isArray(json) ? json : []);
      } catch (e) {
        if (live) setErr(e.message || 'Failed to load schedule');
      }
    })();
    return () => { live = false; };
  }, [season, team]);

  if (!season) return <div className="muted">Enter a season (top right).</div>;

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Teams</h3>
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="">— Select team —</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
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
                <td>
                  <Link to={`/season/${season}/team/${encodeURIComponent(g.opponent)}`}>
                    {g.opponent}
                  </Link>
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
