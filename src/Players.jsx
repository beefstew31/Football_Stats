import React from "react";
import { Link, useParams } from "react-router-dom";
import { supa } from "./supa";
import { slugPlayer } from "./slug";

// fetch public JSON via Supabase Storage
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

// theme hook (light/dark)
function useTheme() {
  const [theme, setTheme] = React.useState(
    () => localStorage.getItem("theme") || "dark"
  );
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

export default function Players() {
  const { season } = useParams();
  const [theme, setTheme] = useTheme();
  const [teamFilter, setTeamFilter] = React.useState("");

  // all player season totals for this season
  const players = usePublicJson(`stats/${season}/players/index.json`) || [];

  const teams = React.useMemo(
    () => Array.from(new Set(players.map(p => p.team))).sort(),
    [players]
  );

  const filtered = React.useMemo(() => {
    const base = teamFilter ? players.filter(p => p.team === teamFilter) : players;
    // Example default sort: team -> player
    return [...base].sort((a, b) =>
      a.team.localeCompare(b.team) || a.player.localeCompare(b.player)
    );
  }, [players, teamFilter]);

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Players</h3>

        <div className="row" style={{ gap: 8 }}>
          {/* Team filter */}
          <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
            <option value="">All teams</option>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Light/Dark toggle */}
          <button
            className="btn"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="Toggle light/dark"
          >
            {theme === "light" ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      <div className="card">
        {!filtered.length ? (
          <div className="muted">No players found.</div>
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
              {filtered.map((p, i) => {
                const playerSlug = slugPlayer(p.player, p.team);
                return (
                  <tr key={i}>
                    <td>
                      <Link
                        to={`/season/${season}/player/${playerSlug}`}
                        title="Open player page"
                      >
                        {p.player}
                      </Link>
                    </td>
                    <td>{p.team}</td>
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
