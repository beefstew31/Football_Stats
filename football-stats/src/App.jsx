
import React, { useMemo, useState } from "react";
import Papa from "papaparse";

// ===============================================
//  Football CSV → Standings, Teams & Players (SPA)
// ===============================================

const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));
const str = (v) => (v ?? "").toString();
const asDate = (v) => (v ? new Date(v) : null);
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : "");
const key = (...parts) => parts.map((p) => String(p ?? "").trim()).join("::");
const pct = (a, b) => (b ? a / b : 0);
const safeDiv = (a, b) => (b ? a / b : 0);

const headerAliases = {
  season: ["season", "yr", "year"],
  week: ["week", "wk"],
  date: ["date", "game_date", "gamedate"],
  game_id: ["game_id", "gid", "game", "match_id"],

  // Team/game context
  team: ["team", "team_name", "school", "club"],
  opponent: ["opponent", "opp", "vs", "opponent_team"],
  home_team: ["home_team", "home", "homeclub"],
  away_team: ["away_team", "away", "roadclub"],
  home_score: ["home_score", "hs", "home_pts", "home_points"],
  away_score: ["away_score", "as", "away_pts", "away_points"],
  team_score: ["team_score", "score", "points_for", "pf"],
  opponent_score: ["opponent_score", "opp_score", "points_against", "pa"],
  result: ["result", "w_l", "outcome"],
  conference: ["conference", "conf", "division"],
  location: ["location", "site", "stadium"],
  home_away: ["home_away", "ha", "venue"], // H/A/N

  // Player identity
  player: ["player", "player_name", "name"],
  position: ["position", "pos"],
  jersey: ["jersey", "number", "#"],

  // Passing
  pass_att: ["pass_att", "att", "pa"],
  pass_cmp: ["pass_cmp", "cmp", "pc"],
  pass_yds: ["pass_yds", "yds", "py"],
  pass_td: ["pass_td", "td", "ptd"],
  pass_int: ["pass_int", "int", "ints"],
  sack_taken: ["sack_taken", "sacked", "sk_against"],

  // Rushing
  rush_att: ["rush_att", "ratt", "ra"],
  rush_yds: ["rush_yds", "ryds", "ry"],
  rush_td: ["rush_td", "rtd"],

  // Receiving
  rec_rec: ["rec", "receptions", "rec_rec"],
  rec_tgt: ["tgt", "targets", "rec_tgt"],
  rec_yds: ["rec_yds", "ryds", "recyds"],
  rec_td: ["rec_td", "retd"],

  // Defense
  tackles: ["tackles", "tkl", "tot_tkl"],
  sacks: ["sacks", "sk"],
  tfl: ["tfl", "tackles_for_loss"],
  qb_hits: ["qb_hits", "qbh"],
  int_def: ["int_def", "def_int", "interceptions"],
  pbu: ["pbu", "pass_breakups"],

  // Kicking
  fg_m: ["fg_m", "fgm"],
  fg_a: ["fg_a", "fga"],
  xp_m: ["xp_m", "xpm"],
  xp_a: ["xp_a", "xpa"],
  long_fg: ["long_fg", "longfg", "lg_fg"],

  // Returns / Special Teams
  kick_ret_yds: ["kick_ret_yds", "kr_yds"],
  punt_ret_yds: ["punt_ret_yds", "pr_yds"],
  return_td: ["return_td", "st_td"],
};

function mapHeaders(rawHeaders) {
  const lower = rawHeaders.map((h) => str(h).trim().toLowerCase());
  const mapping = {};
  for (const [canon, aliases] of Object.entries(headerAliases)) {
    const i = lower.findIndex((h) => aliases.includes(h));
    if (i !== -1) mapping[canon] = rawHeaders[i];
  }
  return mapping; // { canonName: actualHeader }
}

function useCSVs() {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);

  const onFiles = async (files) => {
    const newErrors = [];
    const all = [];
    const tasks = Array.from(files).map(
      (file) =>
        new Promise((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: (res) => {
              if (res.errors?.length) {
                newErrors.push({ file: file.name, errs: res.errors });
              }
              res.data.forEach((r) => all.push({ __file: file.name, ...r }));
              resolve();
            },
          });
        })
    );
    await Promise.all(tasks);
    setRows(all);
    setErrors(newErrors);
  };

  return { rows, errors, onFiles };
}

function deriveGameRows(rows) {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);
  const map = mapHeaders(headers);

  return rows.map((r) => ({
    raw: r,
    season: r[map.season] ?? "",
    week: r[map.week] ?? "",
    date: r[map.date] ?? "",
    game_id: r[map.game_id] ?? key(r[map.date], r[map.team], r[map.opponent]),

    // Team/opponent
    team: r[map.team] ?? r[map.home_team] ?? r[map.away_team] ?? "",
    opponent:
      r[map.opponent] ??
      (r[map.home_team] && r[map.away_team]
        ? r[map.team] === r[map.home_team]
          ? r[map.away_team]
          : r[map.home_team]
        : ""),
    home_team: r[map.home_team] ?? "",
    away_team: r[map.away_team] ?? "",

    // Scores
    team_score:
      r[map.team_score] ??
      (r[map.team] && r[map.home_team]
        ? r[map.team] === r[map.home_team]
          ? r[map.home_score]
          : r[map.away_score]
        : ""),
    opponent_score:
      r[map.opponent_score] ??
      (r[map.team] && r[map.home_team]
        ? r[map.team] === r[map.home_team]
          ? r[map.away_score]
          : r[map.home_score]
        : ""),

    // Player
    player: r[map.player] ?? "",
    position: r[map.position] ?? "",

    // Passing
    pass_att: num(r[map.pass_att]),
    pass_cmp: num(r[map.pass_cmp]),
    pass_yds: num(r[map.pass_yds]),
    pass_td: num(r[map.pass_td]),
    pass_int: num(r[map.pass_int]),

    // Rushing
    rush_att: num(r[map.rush_att]),
    rush_yds: num(r[map.rush_yds]),
    rush_td: num(r[map.rush_td]),

    // Receiving
    rec_rec: num(r[map.rec_rec]),
    rec_tgt: num(r[map.rec_tgt]),
    rec_yds: num(r[map.rec_yds]),
    rec_td: num(r[map.rec_td]),

    // Defense
    tackles: num(r[map.tackles]),
    sacks: num(r[map.sacks]),
    tfl: num(r[map.tfl]),
    qb_hits: num(r[map.qb_hits]),
    int_def: num(r[map.int_def]),
    pbu: num(r[map.pbu]),

    // Kicking
    fg_m: num(r[map.fg_m]),
    fg_a: num(r[map.fg_a]),
    xp_m: num(r[map.xp_m]),
    xp_a: num(r[map.xp_a]),

    // ST
    kick_ret_yds: num(r[map.kick_ret_yds]),
    punt_ret_yds: num(r[map.punt_ret_yds]),
    return_td: num(r[map.return_td]),

    conference: r[map.conference] ?? "",
    home_away: r[map.home_away] ?? "",
    location: r[map.location] ?? "",
  }));
}

function computeGameLevel(gRows) {
  // Deduplicate to (game_id, team)
  const seen = new Map();
  for (const r of gRows) {
    const k = key(r.game_id, r.team || (r.home_team && r.away_team ? r.home_team : ""));
    if (!seen.has(k)) {
      let team = r.team;
      let opponent = r.opponent;
      if (!team && r.home_team && r.away_team) team = r.home_team;

      const base = {
        season: r.season,
        week: r.week,
        date: r.date,
        game_id: r.game_id,
        team,
        opponent,
        home_team: r.home_team,
        away_team: r.away_team,
        team_score: num(r.team_score),
        opponent_score: num(r.opponent_score),
        conference: r.conference,
        home_away: r.home_away,
        location: r.location,
      };

      seen.set(k, base);

      // If only home/away provided, insert both sides
      if (r.home_team && r.away_team && !r.team) {
        seen.set(key(r.game_id, r.home_team), {
          ...base,
          team: r.home_team,
          opponent: r.away_team,
          team_score: num(r.home_score ?? r.team_score),
          opponent_score: num(r.away_score ?? r.opponent_score),
          home_away: "H",
        });
        seen.set(key(r.game_id, r.away_team), {
          ...base,
          team: r.away_team,
          opponent: r.home_team,
          team_score: num(r.away_score ?? r.team_score),
          opponent_score: num(r.home_score ?? r.opponent_score),
          home_away: "A",
        });
      }
    }
  }
  return Array.from(seen.values()).filter((r) => r.team && r.opponent);
}

function standingsFromGames(games) {
  const byTeam = new Map();
  for (const g of games) {
    const t = str(g.team);
    const pf = num(g.team_score);
    const pa = num(g.opponent_score);
    const win = pf > pa ? 1 : 0;
    const tie = pf === pa ? 1 : 0;
    const loss = pf < pa ? 1 : 0;
    const v =
      byTeam.get(t) || { team: t, gp: 0, w: 0, l: 0, t: 0, pf: 0, pa: 0 };
    v.gp += 1;
    v.w += win;
    v.l += loss;
    v.t += tie;
    v.pf += pf;
    v.pa += pa;
    byTeam.set(t, v);
  }
  const rows = Array.from(byTeam.values()).map((r) => ({
    ...r,
    pct: r.w + r.l + r.t ? (r.w + 0.5 * r.t) / (r.w + r.l + r.t) : 0,
    diff: r.pf - r.pa,
  }));
  rows.sort(
    (a, b) =>
      b.pct - a.pct || b.w - a.w || b.diff - a.diff || b.pf - a.pf
  );
  return rows;
}

function aggregatePlayer(gRows) {
  // Sum per (player, team, season)
  const acc = new Map();
  for (const r of gRows) {
    if (!r.player) continue;
    const k = key(r.player, r.team, r.season);
    const v =
      acc.get(k) || {
        player: r.player,
        team: r.team,
        season: r.season,
        g: 0,
        // Passing
        pass_att: 0,
        pass_cmp: 0,
        pass_yds: 0,
        pass_td: 0,
        pass_int: 0,
        // Rushing
        rush_att: 0,
        rush_yds: 0,
        rush_td: 0,
        // Receiving
        rec_rec: 0,
        rec_tgt: 0,
        rec_yds: 0,
        rec_td: 0,
        // Defense
        tackles: 0,
        sacks: 0,
        tfl: 0,
        qb_hits: 0,
        int_def: 0,
        pbu: 0,
        // Kicking
        fg_m: 0,
        fg_a: 0,
        xp_m: 0,
        xp_a: 0,
      };
    v.g += 1;
    v.pass_att += r.pass_att;
    v.pass_cmp += r.pass_cmp;
    v.pass_yds += r.pass_yds;
    v.pass_td += r.pass_td;
    v.pass_int += r.pass_int;
    v.rush_att += r.rush_att;
    v.rush_yds += r.rush_yds;
    v.rush_td += r.rush_td;
    v.rec_rec += r.rec_rec;
    v.rec_tgt += r.rec_tgt;
    v.rec_yds += r.rec_yds;
    v.rec_td += r.rec_td;
    v.tackles += r.tackles;
    v.sacks += r.sacks;
    v.tfl += r.tfl;
    v.qb_hits += r.qb_hits;
    v.int_def += r.int_def;
    v.pbu += r.pbu;
    v.fg_m += r.fg_m;
    v.fg_a += r.fg_a;
    v.xp_m += r.xp_m;
    v.xp_a += r.xp_a;
    acc.set(k, v);
  }
  return Array.from(acc.values()).map((p) => ({
    ...p,
    cmp_pct: pct(p.pass_cmp, p.pass_att),
    ypa: safeDiv(p.pass_yds, p.pass_att),
    ypc: safeDiv(p.rush_yds, p.rush_att),
    ypr: safeDiv(p.rec_yds, p.rec_rec),
    fg_pct: pct(p.fg_m, p.fg_a),
    xp_pct: pct(p.xp_m, p.xp_a),
  }));
}

function playerGames(gRows) {
  const byPlayer = new Map();
  for (const r of gRows) {
    if (!r.player) continue;
    const k = key(r.player, r.season);
    const list = byPlayer.get(k) || [];
    list.push(r);
    byPlayer.set(k, list);
  }
  return byPlayer; // key -> [rows]
}

function teamSchedule(gameLevel) {
  const byTeam = new Map();
  for (const g of gameLevel) {
    const t = str(g.team);
    const list = byTeam.get(t) || [];
    list.push(g);
    byTeam.set(t, list);
  }
  for (const [t, list] of byTeam) {
    list.sort((a, b) => (asDate(a.date) || 0) - (asDate(b.date) || 0));
  }
  return byTeam;
}

function FileDrop({ onFiles }) {
  const onChange = (e) => onFiles(e.target.files);
  const onDrop = (e) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };
  const onDrag = (e) => e.preventDefault();
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDrag}
      className="border-2 border-dashed rounded-2xl p-8 text-center shadow-sm"
    >
      <p className="text-lg font-semibold">Drop CSVs here or click to upload</p>
      <p className="text-sm opacity-70 mt-1">
        Accepts per-player or per-team box scores. Multiple files OK.
      </p>
      <input type="file" accept=".csv" multiple onChange={onChange} className="mt-4" />
    </div>
  );
}

function StandingsTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left bg-gray-50">
          <tr>
            <th className="p-2">Team</th>
            <th className="p-2">GP</th>
            <th className="p-2">W</th>
            <th className="p-2">L</th>
            <th className="p-2">T</th>
            <th className="p-2">Win%</th>
            <th className="p-2">PF</th>
            <th className="p-2">PA</th>
            <th className="p-2">Diff</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team} className="border-b">
              <td className="p-2 font-medium">{r.team}</td>
              <td className="p-2">{r.gp}</td>
              <td className="p-2">{r.w}</td>
              <td className="p-2">{r.l}</td>
              <td className="p-2">{r.t}</td>
              <td className="p-2">{r.pct.toFixed(3)}</td>
              <td className="p-2">{r.pf}</td>
              <td className="p-2">{r.pa}</td>
              <td className="p-2">{r.diff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamPage({ team, schedule }) {
  const games = schedule.get(team) || [];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{team} — Schedule & Results</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Week</th>
              <th className="p-2">Opponent</th>
              <th className="p-2">Venue</th>
              <th className="p-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => {
              const res =
                num(g.team_score) === num(g.opponent_score)
                  ? `T ${g.team_score}-${g.opponent_score}`
                  : num(g.team_score) > num(g.opponent_score)
                  ? `W ${g.team_score}-${g.opponent_score}`
                  : `L ${g.team_score}-${g.opponent_score}`;
              return (
                <tr key={i} className="border-b">
                  <td className="p-2">{fmtDate(g.date)}</td>
                  <td className="p-2">{g.week}</td>
                  <td className="p-2">{g.opponent}</td>
                  <td className="p-2">
                    {g.home_away || (g.team === g.home_team ? "H" : g.team === g.away_team ? "A" : "")}
                  </td>
                  <td className="p-2">{res}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerList({ players, onSelect }) {
  return (
    <div className="max-h-96 overflow-y-auto border rounded-xl p-2">
      {players.map((p) => (
        <button
          key={key(p.player, p.team, p.season)}
          onClick={() => onSelect(p)}
          className="w-full text-left p-2 rounded-lg hover:bg-gray-50"
        >
          <div className="font-medium">{p.player}</div>
          <div className="text-xs opacity-70">
            {p.team} • {p.season} • G:{p.g}
          </div>
        </button>
      ))}
    </div>
  );
}

function StatCard({ title, lines }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="font-semibold mb-2">{title}</div>
      <ul className="space-y-1 text-sm">
        {lines.map(([k, v]) => (
          <li key={k} className="flex justify-between">
            <span className="opacity-70">{k}</span>
            <span className="font-medium">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlayerCard({ player, games }) {
  const pg = games.get(key(player.player, player.season)) || [];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">{player.player}</h2>
      <p className="text-sm opacity-80 mb-3">
        {player.team} • Season {player.season} • Games {player.g}
      </p>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <StatCard
          title="Passing"
          lines={[
            ["CMP/ATT", `${player.pass_cmp}/${player.pass_att}`],
            ["YDS", player.pass_yds],
            ["TD/INT", `${player.pass_td}/${player.pass_int}`],
            ["CMP%", (player.cmp_pct * 100).toFixed(1)],
            ["YPA", player.ypa.toFixed(2)],
          ]}
        />
        <StatCard
          title="Rushing"
          lines={[
            ["ATT", player.rush_att],
            ["YDS", player.rush_yds],
            ["TD", player.rush_td],
            ["YPC", player.ypc.toFixed(2)],
          ]}
        />
        <StatCard
          title="Receiving"
          lines={[
            ["REC/TGT", `${player.rec_rec}/${player.rec_tgt}`],
            ["YDS", player.rec_yds],
            ["TD", player.rec_td],
            ["YPR", player.ypr.toFixed(2)],
          ]}
        />
        <StatCard
          title="Defense"
          lines={[
            ["Tackles", player.tackles],
            ["Sacks", player.sacks],
            ["TFL", player.tfl],
            ["INT", player.int_def],
          ]}
        />
        <StatCard
          title="Kicking"
          lines={[
            ["FG", `${player.fg_m}/${player.fg_a}`],
            ["XP", `${player.xp_m}/${player.xp_a}`],
            ["FG%", (player.fg_pct * 100).toFixed(1)],
            ["XP%", (player.xp_pct * 100).toFixed(1)],
          ]}
        />
      </div>

      <h3 className="font-semibold mb-2">Game-by-game</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Week</th>
              <th className="p-2">Opp</th>
              <th className="p-2">P:C/A</th>
              <th className="p-2">P Yds</th>
              <th className="p-2">TD/INT</th>
              <th className="p-2">R:Att</th>
              <th className="p-2">R Yds</th>
              <th className="p-2">R TD</th>
              <th className="p-2">REC/TGT</th>
              <th className="p-2">Rec Yds</th>
              <th className="p-2">Rec TD</th>
            </tr>
          </thead>
          <tbody>
            {pg
              .sort((a, b) => (asDate(a.date) || 0) - (asDate(b.date) || 0))
              .map((g, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{fmtDate(g.date)}</td>
                  <td className="p-2">{g.week}</td>
                  <td className="p-2">{g.opponent}</td>
                  <td className="p-2">
                    {g.pass_cmp}/{g.pass_att}
                  </td>
                  <td className="p-2">{g.pass_yds}</td>
                  <td className="p-2">
                    {g.pass_td}/{g.pass_int}
                  </td>
                  <td className="p-2">{g.rush_att}</td>
                  <td className="p-2">{g.rush_yds}</td>
                  <td className="p-2">{g.rush_td}</td>
                  <td className="p-2">
                    {g.rec_rec}/{g.rec_tgt}
                  </td>
                  <td className="p-2">{g.rec_yds}</td>
                  <td className="p-2">{g.rec_td}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const { rows, errors, onFiles } = useCSVs();
  const gRows = useMemo(() => deriveGameRows(rows), [rows]);
  const gameLevel = useMemo(() => computeGameLevel(gRows), [gRows]);
  const standings = useMemo(() => standingsFromGames(gameLevel), [gameLevel]);
  const playerAgg = useMemo(() => aggregatePlayer(gRows), [gRows]);
  const pGames = useMemo(() => playerGames(gRows), [gRows]);
  const schedules = useMemo(() => teamSchedule(gameLevel), [gameLevel]);

  const [tab, setTab] = useState("standings");
  const [team, setTeam] = useState("");
  const [player, setPlayer] = useState(null);
  const teams = useMemo(
    () => Array.from(new Set(gameLevel.map((g) => g.team))).sort(),
    [gameLevel]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Football Stats from CSV</h1>
        <nav className="flex gap-2">
          {[
            ["standings", "Standings"],
            ["teams", "Teams"],
            ["players", "Players"],
            ["upload", "Upload"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-full border ${
                tab === id ? "bg-gray-900 text-white" : "bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "upload" && (
        <section className="space-y-4">
          <FileDrop onFiles={onFiles} />
          {!!errors.length && (
            <div className="text-red-600 text-sm">
              <div className="font-semibold">Parse warnings</div>
              <ul className="list-disc pl-5">
                {errors.map((e, i) => (
                  <li key={i}>
                    {e.file}: {e.errs.length} issues
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="text-xs opacity-70">
            <div className="font-semibold mb-1">Common header names supported:</div>
            <p>
              date, season, week, game_id, team, opponent, home_team, away_team,
              home_score, away_score
            </p>
            <p>player, position</p>
            <p>
              pass_att, pass_cmp, pass_yds, pass_td, pass_int • rush_att,
              rush_yds, rush_td • rec (rec_rec), tgt (rec_tgt), rec_yds, rec_td
            </p>
            <p>
              tackles, sacks, tfl, qb_hits, int_def, pbu • fg_m, fg_a, xp_m, xp_a
            </p>
          </div>
        </section>
      )}

      {tab === "standings" && (
        <section>
          <StandingsTable rows={standings} />
        </section>
      )}

      {tab === "teams" && (
        <section className="space-y-3">
          <div className="flex gap-2 items-center">
            <label className="text-sm">Team</label>
            <select
              className="border rounded-xl px-3 py-2"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            >
              <option value="">Select a team</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {!!team && <TeamPage team={team} schedule={schedules} />}
        </section>
      )}

      {tab === "players" && (
        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <PlayerList players={playerAgg} onSelect={setPlayer} />
          </div>
          <div className="md:col-span-2">
            {player ? (
              <PlayerCard player={player} games={pGames} />
            ) : (
              <div className="opacity-70">Select a player on the left…</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
