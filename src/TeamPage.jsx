import React from "react";
import { useParams, Link } from "react-router-dom";
import { supa } from "./supa";

function usePublicJson(path) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    let ok = true;
    (async () => {
      const { data: u } = supa
        .storage
        .from(import.meta.env.VITE_SUPABASE_BUCKET)
        .getPublicUrl(path);
      const r = await fetch(u.publicUrl);
      if (!ok) return;
      setData(r.ok ? await r.json() : null);
    })();
    return () => { ok = false; };
  }, [path]);
  return data;
}

const Leader = ({ label, p, valueKey }) => (
  <div className="card" style={{ padding: 16 }}>
    <div className="muted">{label}</div>
    {!p ? (
      <div style={{ fontSize: 24, fontWeight: 700 }}>—</div>
    ) : (
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "#0e131a", border: "1px solid #2a3140",
            display: "grid", placeItems: "center", fontWeight: 700
          }}
          title={p.player}
        >
          {p.player.split(" ").map(s => s[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
            {p[valueKey] ?? 0}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>{p.player}</div>
        </div>
      </div>
    )}
  </div>
);

export default function TeamPage() {
  const { season, teamName } = useParams();
  const teamDecoded = decodeURIComponent(teamName);

  const schedule   = usePublicJson(`stats/${season}/teams/${teamName}.json`) || [];
  const allPlayers = usePublicJson(`stats/${season}/players/index.json`) || [];

  const players = React.useMemo(
    () => (allPlayers || []).filter(p => p.team === teamDecoded),
    [allPlayers, teamDecoded]
  );

  const by = (k) => [...players].sort((a, b) => (b[k] ?? 0) - (a[k] ?? 0))[0];
  const passY = by("pass_yds");
  const rushY = by("rush_yds");
  const recvY = by("rec_yds");
  const passTD = by("pass_td");

  const [sort, setSort] = React.useState({ key: "player", dir: 1 });
  const sorted = React.useMemo(() => {
    const arr = [...players];
    arr.sort((a, b) => {
      const A = a[sort.key] ?? 0, B = b[sort.key] ?? 0;
      if (typeof A === "string" || typeof B === "string") {
        return sort.dir * String(A).localeCompare(String(B));
      }
      return sort.dir * (A - B);
    });
    return arr;
  }, [players, sort]);

  const th = (key, label) => (
    <th
      onClick={() => setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }))}
      style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
      title="Click to sort"
    >
      {label} {sort.key === key ? (sort.dir > 0 ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div className="row" style={{ gap: 12 }}>
          <Link className="btn" to={`/season/${season}`}>← Season {season}</Link>
          <h1 style={{ margin: 0 }}>{teamDecoded} <span className="muted">Stats {season}</span></h1>
        </div>
        <Link className="btn" to={`/season/${season}/teams`}>More Teams</Link>
      </div>

      <div className="grid" style={{ marginBottom: 12 }}>
        <Leader label="Passing Yards"  p={passY}  valueKey="pass_yds" />
        <Leader label="Rushing Yards"  p={rushY}  valueKey="rush_yds" />
        <Leader label="Receiving Yards" p={recvY} valueKey="rec_yds" />
        <Leader label="Passing TDs"    p={passTD} valueKey="pass_td" />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Player Stats</h3>
        <div className="spacer"></div>
        <table>
          <thead>
            <tr>
              {th("player", "Player")}
              {th("position", "Pos")}
              {th("pass_yds", "Pass Yds")}
              {th("pass_td", "Pass TD")}
              {th("pass_int", "INT")}
              {th("rush_yds", "Rush Yds")}
              {th("rush_td", "Rush TD")}
              {th("rec_rec", "Rec")}
              {th("rec_yds", "Rec Yds")}
              {th("rec_td", "Rec TD")}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={i}>
                <td>
                  <Link to={`/season/${season}/player/${encodeURIComponent(`${p.player}__${p.team}`)}`}>
                    {p.player}
                  </Link>
                </td>
                <td>{p.position || ""}</td>
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
      </div>

      <div className="spacer"></div>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Schedule</h3>
        <div className="spacer"></div>
        {(!schedule || !schedule.length) ? (
          <div className="muted">No games published yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Week</th><th>Opponent</th><th>H/A</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((g, i) => (
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
    </div>
  );
}
