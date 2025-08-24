// src/Players.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { supa } from './supa';

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET;

// helper
async function fetchJson(path) {
  const { data: pub } = supa.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.publicUrl + (pub.publicUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

// List component
export function Players({ season }) {
  const [teamFilter, setTeamFilter] = React.useState('');
  const [players, setPlayers] = React.useState([]);
  const [teams, setTeams] = React.useState([]);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    if (!season) return;
    let live = true;
    (async () => {
      setErr('');
      try {
        const index = await fetchJson(`stats/${season}/players/index.json`);
        if (live) {
          setPlayers(index);
          setTeams(Array.from(new Set(index.map(p => p.team))).sort());
        }
      } catch (e) {
        if (live) setErr(e.message || 'Failed to load players.');
      }
    })();
    return () => { live = false; };
  }, [season]);

  const filtered = teamFilter
    ? players.filter(p => p.team === teamFilter)
    : players;

  return (
    <div className="card">
      <h3>Players</h3>
      <div className="row" style={{ alignItems: 'center' }}>
      <label style={{ marginRight: 6 }}>Team:</label>
      <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
        <option value="">— All Teams —</option>
        {teams.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      </div>
      <div className="spacer" />
      {err && <div className="muted">Error: {err}</div>}
      {!filtered.length ? (
        <div className="muted">No players published for this season.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Player</th><th>Team</th><th>Pos</th>
              <th>Pass Yds</th><th>Pass TD</th><th>INT</th>
              <th>Rush Yds</th><th>Rush TD</th>
              <th>Rec</th><th>Rec Yds</th><th>Rec TD</th>
            </tr>
          </thead>
          <tbody>
          {filtered.map((p, i) => (
            <tr key={i}>
              <td>
                <Link
                  to={`/season/${season}/player/${encodeURIComponent(`${p.player}__${p.team}`)}`}>
                  {p.player}
                </Link>
              </td>
              <td>{p.team}</td>
              <td>{p.position}</td>
              <td>{p.pass_yds}</td><td>{p.pass_td}</td><td>{p.pass_int}</td>
              <td>{p.rush_yds}</td><td>{p.rush_td}</td>
              <td>{p.rec_rec}</td><td>{p.rec_yds}</td><td>{p.rec_td}</td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Detail page component
export function PlayerPage() {
  const { season, playerSlug } = useParams();
  const [log, setLog] = React.useState([]);
  const [career, setCareer] = React.useState([]);
  const [err, setErr] = React.useState('');

  const [playerName, team] = decodeURIComponent(playerSlug).split('__');

  // At the end of Players.jsx, add:
export default Players;

  React.useEffect(() => {
    if (!season || !playerSlug) return;
    let live = true;
    (async () => {
      setErr('');
      try {
        const slug = encodeURIComponent(playerSlug);
        const gameLog = await fetchJson(`stats/${season}/players/logs/${slug}.json`);
        const careerTotals = await fetchJson(`career/players/${slug}.json`);
        if (live) {
          setLog(Array.isArray(gameLog) ? gameLog : []);
          setCareer(Array.isArray(careerTotals) ? careerTotals : []);
        }
      } catch (e) {
        if (live) setErr(e.message || 'Failed to load player data.');
      }
    })();
    return () => { live = false; };
  }, [season, playerSlug]);

  return (
    <div className="wrap">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#f5f5f5', display: 'grid', placeItems: 'center', fontWeight: 700
            }}>
              {playerName.split(' ').map(s => s[0]).join('').slice(0,2)}
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{playerName}</div>
              <div className="muted">{team}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn" to={`/season/${season}`}>Season {season}</Link>
            <Link className="btn" to={`/season/${season}/team/${encodeURIComponent(team)}`}>Team Page</Link>
          </div>
        </div>
      </div>

      {/* Show game log */}
      <div className="card">
        <h3>Game Log — {season}</h3>
        {!log.length ? (
          <div className="muted">No game log found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Opp</th><th>Result</th><th>C/A</th><th>Pass Yds</th><th>TD</th>
                <th>INT</th><th>Rush Att</th><th>Rush Yds</th><th>Rush TD</th>
                <th>Rec</th><th>Tgt</th><th>Rec Yds</th><th>Rec TD</th>
              </tr>
            </thead>
            <tbody>
            {log.map((g, i) => (
              <tr key={i}>
                <td>{g.date}</td>
                <td>{g.opponent}</td>
                <td>{g.result}</td>
                <td>{g.pass_cmp}/{g.pass_att}</td>
                <td>{g.pass_yds}</td><td>{g.pass_td}</td><td>{g.pass_int}</td>
                <td>{g.rush_att}</td><td>{g.rush_yds}</td><td>{g.rush_td}</td>
                <td>{g.rec_rec}</td><td>{g.rec_tgt}</td><td>{g.rec_yds}</td><td>{g.rec_td}</td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Career stats */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Season-by-Season</h3>
        {!career.length ? (
          <div className="muted">No career totals yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Season</th><th>Team</th><th>Pass Cmp</th><th>Pass Att</th><th>Pass Yds</th>
                <th>TD</th><th>INT</th><th>Rush Att</th><th>Rush Yds</th><th>Rush TD</th>
                <th>Rec</th><th>Tgt</th><th>Rec Yds</th><th>Rec TD</th>
              </tr>
            </thead>
            <tbody>
            {career.map((c,i) => (
              <tr key={i}>
                <td>{c.season}</td>
                <td>{c.team}</td>
                <td>{c.pass_cmp}</td><td>{c.pass_att}</td>
                <td>{c.pass_yds}</td><td>{c.pass_td}</td><td>{c.pass_int}</td>
                <td>{c.rush_att}</td><td>{c.rush_yds}</td><td>{c.rush_td}</td>
                <td>{c.rec_rec}</td><td>{c.rec_tgt}</td><td>{c.rec_yds}</td><td>{c.rec_td}</td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
