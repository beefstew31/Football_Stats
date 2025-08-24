import React from "react";
import { useParams, Link } from "react-router-dom";
import { supa } from "./supa";
import { slugPlayer } from "./slug";

function usePublicJson(path) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    let live = true;
    (async () => {
      const { data: url } = supa.storage
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

export default function Players() {
  const { season } = useParams();
  const allPlayers = usePublicJson(`stats/${season}/players/index.json`) || [];
  
  const [team, setTeam] = React.useState("");

  // extract unique teams
  const teams = [...new Set(allPlayers.map(p => p.team))].sort();

  // filter players by team
  const shown = team ? allPlayers.filter(p => p.team === team) : allPlayers;

  return (
    <div className="card">
      <h3>Players</h3>

      <div style={{ marginBottom: "1rem" }}>
        <label>Team:&nbsp;</label>
        <select value={team} onChange={e => setTeam(e.target.value)}>
          <option value="">-- All Teams --</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {!shown.length ? (
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
            {shown.map((p,i)=> {
              const slug = slugPlayer(p.player, p.team);
              return (
                <tr key={i}>
                  <td>
                    <Link to={`/season/${season}/player/${slug}`}>
                      {p.player}
                    </Link>
                  </td>
                  <td>{p.team}</td>
                  <td>{p.position}</td>
                  <td>{p.pass_yds||0}</td>
                  <td>{p.pass_td||0}</td>
                  <td>{p.pass_int||0}</td>
                  <td>{p.rush_yds||0}</td>
                  <td>{p.rush_td||0}</td>
                  <td>{p.rec_rec||0}</td>
                  <td>{p.rec_yds||0}</td>
                  <td>{p.rec_td||0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
