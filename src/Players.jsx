// src/Players.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { supa } from './supa';
import { slugPlayer } from './slug';

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET;

async function fetchJsonFromStorage(path) {
  const { data: url } = supa.storage.from(BUCKET).getPublicUrl(path);
  const fetchUrl = `${url.publicUrl}?cb=${Date.now()}`;
  const res = await fetch(fetchUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

export default function Players({ season: seasonProp }) {
  const params = useParams();
  const season = params.season || seasonProp || '';
  const [team, setTeam] = React.useState('');
  const [players, setPlayers] = React.useState([]);
  const [teams, setTeams] = React.useState([]);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    if (!season) return;
    let live = true;
    (async () => {
      setErr('');
      try {
        const list = await fetchJsonFromStorage(`stats/${season}/players/index.json`);
        const names = Array.from(new Set(list.map((p) => p.team).filter(Boolean))).sort();
        if (live) {
          setPlayers(list);
          setTeams(names);
        }
      } catch (e) {
        if (live) setErr(e.message || 'Failed to load players.');
      }
    })();
    return () => {
      live = false;
    };
  }, [season]);

  const filtered = team ? players.filter((p) => p.team === team) : players;

  if (!season) return <div className="muted">Enter a season (top right).</div>;

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Players</h3>
        <div className="row" style={{ alignItems: 'center', gap: 8 }}>
          <span className="muted">Team:</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">— All Teams —</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="spacer" />
      {err && <div className="muted">Error: {err}</div>}
      {!players.length ? (
        <div className="muted">No players published for this season.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th>Pos</th>
              <th>Pass Yds</th>
              <th>Pass TD</th>
              <th>INT</th>
              <th>Rush Yds</th>
              <th>Rush TD</th>
              <th>Rec</th>
              <th>Rec Yds</th>
              <th>Rec TD</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i}>
                <td>
                  <Link to={`/season/${season}/player/${encodeURIComponent(slugPlayer(p.player, p.team))}`}>
                    {p.player}
                  </Link>
                </td>
                <td>{p.team}</td>
                <td>{p.position}</td>
                <td>{p.pass_yds || 0}</td>
                <td>{p.pass_td || 0}</td>
                <td>{p.pass_int || 0}</td>
                <td>{p.rush_yds || 0}</td>
                <td>{p.rush_td || 0}</td>
                <td>{p.rec_rec || 0}</td>
                <td>{p.rec_yds || 0}</td>
                <td>{p.rec_td || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
