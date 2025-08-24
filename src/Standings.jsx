// src/Standings.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { supa } from './supa';

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET;

async function fetchJsonFromStorage(path) {
  const { data: url } = supa.storage.from(BUCKET).getPublicUrl(path);
  const fetchUrl = `${url.publicUrl}?cb=${Date.now()}`;
  const res = await fetch(fetchUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

export default function Standings({ season: seasonProp }) {
  const params = useParams();
  const season = params.season || seasonProp || '';
  const [data, setData] = React.useState([]);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    if (!season) return;
    let live = true;
    (async () => {
      setErr('');
      try {
        const standings = await fetchJsonFromStorage(`stats/${season}/standings.json`);
        if (live) setData(Array.isArray(standings) ? standings : []);
      } catch (e) {
        if (live) setErr(e.message || 'Failed to load standings.');
      }
    })();
    return () => {
      live = false;
    };
  }, [season]);

  if (!season) return <div className="muted">Enter a season (top right).</div>;

  return (
    <div className="card">
      <h3>Standings</h3>
      {err && <div className="muted">Error: {err}</div>}
      {!data.length ? (
        <div className="muted">No standings for this season.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>T</th>
              <th>Pct</th>
              <th>PF</th>
              <th>PA</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.team}>
                <td>{s.team}</td>
                <td>{s.w}</td>
                <td>{s.l}</td>
                <td>{s.t}</td>
                <td>{s.pct.toFixed(3)}</td>
                <td>{s.pf}</td>
                <td>{s.pa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
