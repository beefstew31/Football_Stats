// src/Standings.jsx
import React from "react";
import { supa } from "./supa";

export default function Standings({ season }) {
  const [rows, setRows] = React.useState(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!season) return;
    let live = true;
    (async () => {
      try {
        const { data } = supa
          .storage
          .from(import.meta.env.VITE_SUPABASE_BUCKET)
          .getPublicUrl(`stats/${season}/standings.json`);
        const r = await fetch(data.publicUrl);
        const json = r.ok ? await r.json() : [];
        if (live) setRows(json);
      } catch (e) {
        if (live) setErr(e.message || "Failed to load standings");
      }
    })();
    return () => { live = false; };
  }, [season]);

  if (!season) return <div className="muted">Enter a season.</div>;
  if (err) return <div className="muted">Error: {err}</div>;
  if (!rows) return <div className="muted">Loading…</div>;
  if (!rows.length) return <div className="muted">No standings for this season.</div>;

  return (
    <div className="card">
      <h3>Standings — {season}</h3>
      <table>
        <thead>
          <tr>
            <th>Team</th><th>W</th><th>L</th><th>T</th><th>PF</th><th>PA</th><th>Pct</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td>{r.team}</td><td>{r.w}</td><td>{r.l}</td><td>{r.t}</td>
              <td>{r.pf}</td><td>{r.pa}</td><td>{(r.pct ?? 0).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
