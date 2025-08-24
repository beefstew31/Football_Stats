import React from "react";
import { useParams, Link } from "react-router-dom";
import { supa } from "./supa";
import { unslugPlayer } from "./slug";

function usePublicJson(path) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    let live = true;
    (async () => {
      const { data: url } = supa
        .storage
        .from(import.meta.env.VITE_SUPABASE_BUCKET)
        .getPublicUrl(path);
      const r = await fetch(url.publicUrl);
      if (!live) return;
      setData(r.ok ? await r.json() : null);
    })();
    return () => { live = false; };
  }, [path]);
  return data;
}

function Tile({ label, value }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800 }}>{value ?? 0}</div>
    </div>
  );
}

export default function PlayerPage() {
  const { season, playerSlug } = useParams();
  const { player, team } = unslugPlayer(playerSlug);

  // current season game log + totals
  const logs = usePublicJson(`stats/${season}/players/logs/${playerSlug}.json`) || [];
  const seasonIndex = usePublicJson(`stats/${season}/players/index.json`) || [];
  const totals = React.useMemo(
    () => (seasonIndex || []).find(p => p.player === player && p.team === team) || null,
    [seasonIndex, player, team]
  );

  // career (all seasons you’ve uploaded)
  const career = usePublicJson(`career/players/${playerSlug}.json`) || [];

  // passer rating (NFL formula)
  const rating = React.useMemo(() => {
    if (!totals || !totals.pass_att) return 0;
    const a = Math.max(0, Math.min(2.375, ((totals.pass_cmp / totals.pass_att) - 0.3) * 5));
    const b = Math.max(0, Math.min(2.375, ((totals.pass_yds / totals.pass_att) - 3) * 0.25));
    const c = Math.max(0, Math.min(2.375, (totals.pass_td / totals.pass_att) * 20));
    const d = Math.max(0, Math.min(2.375, 2.375 - (totals.pass_int / totals.pass_att) * 25));
    return (((a + b + c + d) / 6) * 100).toFixed(1);
  }, [totals]);

  return (
    <div className="wrap">
      {/* Header / ID block */}
      <div className="card" style={{ padding: 20 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--bgElev2)", border: "1px solid var(--line)",
              display: "grid", placeItems: "center", fontWeight: 800, fontSize: 22
            }}>
              {player.split(" ").map(s => s[0]).join("").slice(0,2)}
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{player}</div>
              <div className="muted">{team}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn" to={`/season/${season}`}>Season {season}</Link>
            <Link className="btn" to={`/season/${season}/players`}>All Players</Link>
            <Link className="btn" to={`/season/${season}/team/${encodeURIComponent(team)}`}>Team Page</Link>
          </div>
        </div>

        {/* quick stat tiles */}
        <div className="grid" style={{ marginTop: 16 }}>
          <Tile label="Pass Yds" value={totals?.pass_yds} />
          <Tile label="Pass TD"  value={totals?.pass_td} />
          <Tile label="INT"      value={totals?.pass_int} />
          <Tile label="Rush Yds" value={totals?.rush_yds} />
          <Tile label="Rush TD"  value={totals?.rush_td} />
          <Tile label="Rec Yds"  value={totals?.rec_yds} />
          <Tile label="Rec TD"   value={totals?.rec_td} />
          <Tile label="Rating"   value={rating} />
        </div>
      </div>

      {/* Game log */}
      <div className="spacer"></div>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Game Log — {season}</h3>
          <div className="row">
            <span className="muted" style={{ marginRight: 8 }}>Season:</span>
            <select
              value={season}
              onChange={e => {
                const s = e.target.value;
                window.location.href = `/season/${encodeURIComponent(s)}/player/${playerSlug}`;
              }}
            >
              {[...new Set([season, ...career.map(c => c.season)])]
                .filter(Boolean)
                .sort((a,b)=> String(b).localeCompare(String(a)))
                .map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="spacer"></div>
        {(!logs || !logs.length) ? (
          <div className="muted">No game log found for this season.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Opp</th><th>Result</th>
                <th>C/A</th><th>Pass Yds</th><th>TD</th><th>INT</th>
                <th>Rush Att</th><th>Rush Yds</th><th>Rush TD</th>
                <th>Rec</th><th>Tgt</th><th>Rec Yds</th><th>Rec TD</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((g,i)=>(
                <tr key={i}>
                  <td>{g.date}</td>
                  <td>{g.opponent}</td>
                  <td>{g.result || ""}</td>
                  <td>{g.pass_cmp}/{g.pass_att}</td>
                  <td>{g.pass_yds||0}</td>
                  <td>{g.pass_td||0}</td>
                  <td>{g.pass_int||0}</td>
                  <td>{g.rush_att||0}</td>
                  <td>{g.rush_yds||0}</td>
                  <td>{g.rush_td||0}</td>
                  <td>{g.rec_rec||0}</td>
                  <td>{g.rec_tgt||0}</td>
                  <td>{g.rec_yds||0}</td>
                  <td>{g.rec_td||0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Season-by-season career */}
      <div className="spacer"></div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Season-by-Season</h3>
        {!career?.length ? (
          <div className="muted">No career totals yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Season</th><th>Team</th>
                <th>Pass Cmp</th><th>Pass Att</th><th>Pass Yds</th><th>TD</th><th>INT</th>
                <th>Rush Att</th><th>Rush Yds</th><th>Rush TD</th>
                <th>Rec</th><th>Tgt</th><th>Rec Yds</th><th>Rec TD</th>
              </tr>
            </thead>
            <tbody>
              {career.map((c,i)=>(
                <tr key={i}>
                  <td>
                    <Link to={`/season/${encodeURIComponent(c.season)}/player/${playerSlug}`}>
                      {c.season}
                    </Link>
                  </td>
                  <td>{c.team}</td>
                  <td>{c.pass_cmp||0}</td><td>{c.pass_att||0}</td>
                  <td>{c.pass_yds||0}</td><td>{c.pass_td||0}</td><td>{c.pass_int||0}</td>
                  <td>{c.rush_att||0}</td><td>{c.rush_yds||0}</td><td>{c.rush_td||0}</td>
                  <td>{c.rec_rec||0}</td><td>{c.rec_tgt||0}</td><td>{c.rec_yds||0}</td><td>{c.rec_td||0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
