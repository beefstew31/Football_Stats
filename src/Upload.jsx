import React, { useState } from "react";
import Papa from "papaparse";
import { uploadJSON, UPLOAD_PASSWORD } from "./supa";
import { nflRating, groupBy, sum } from "./utils";

export default function Upload({ season, setLeadersData, onPublished }) {
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState(false);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (pass === UPLOAD_PASSWORD) setOk(true);
    else alert("Wrong passcode");
  };

  const parseFiles = async (files) => {
    const all = [];
    await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise((res) => {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (r) => {
                all.push(...r.data);
                res();
              },
            });
          })
      )
    );
    setRows(all);
    localStorage.setItem("fs_rows_v1", JSON.stringify(all));
    setMsg(`Parsed ${all.length} rows`);
  };

  // ---------- Compute helpers ----------
  function canonical(r) {
    const m = (str) =>
      r[str] ?? r[str?.toUpperCase?.()] ?? r[str?.replace?.(/rec_/, "")];
    const n = (k) => Number(m(k) || 0);
    return {
      date: m("date") || "",
      season: m("season") || "",
      week: m("week") || "",
      game_id: m("game_id") || "",
      team: m("team") || "",
      opponent: m("opponent") || "",
      player: m("player") || "",
      position: m("position") || "",
      pass_cmp: n("pass_cmp"),
      pass_att: n("pass_att"),
      pass_yds: n("pass_yds"),
      pass_td: n("pass_td"),
      pass_int: n("pass_int"),
      rush_att: n("rush_att"),
      rush_yds: n("rush_yds"),
      rush_td: n("rush_td"),
      rec_rec: n("rec_rec") || n("rec"),
      rec_tgt: n("rec_tgt") || n("tgt"),
      rec_yds: n("rec_yds"),
      rec_td: n("rec_td"),
      tackles: n("tackles"),
      sacks: n("sacks"),
      int_def: n("int_def"),
      home_team: m("home_team") || "",
      away_team: m("away_team") || "",
      home_score: n("home_score"),
      away_score: n("away_score"),
    };
  }

  function compute(all) {
    const rows = all
      .map(canonical)
      .filter((r) => String(r.season) === String(season));

   // ----- schedules & standings (robust even without home_/away_ cols) -----
const games = [];

// group rows into "games" using the best key we can
const normKey = (r) => {
  // prefer explicit game_id
  if (r.game_id) return `gid:${r.game_id}`;
  // otherwise make a symmetric key so TeamA vs TeamB matches both ways
  const a = (r.team || "").trim();
  const b = (r.opponent || "").trim();
  const [t1, t2] = [a, b].sort();
  return `d:${r.date}|w:${r.week}|${t1}__vs__${t2}`;
};

const byGame = groupBy(rows.filter(r => r.team && r.opponent), normKey);

Object.values(byGame).forEach(list => {
  // infer participants & meta
  const sample = list[0];
  const date = sample.date, week = sample.week;

  // Try to discover the two teams reliably
  const teamsInRows = new Set();
  list.forEach(r => { if (r.team) teamsInRows.add(r.team); if (r.opponent) teamsInRows.add(r.opponent); });
  const [T1, T2] = [...teamsInRows].slice(0,2);

  // If explicit home/away exist anywhere in the group, use them
  let home = sample.home_team || "";
  let away = sample.away_team || "";
  if ((!home || !away) && T1 && T2) {
    // fallback: just pick a stable home/away assignment
    [home, away] = [T1, T2];
  }

  // compute scores if provided
  const hs = Number(sample.home_score || 0);
  const as = Number(sample.away_score || 0);
  const haveScores = Number.isFinite(hs) && Number.isFinite(as) && (hs > 0 || as > 0);

  // push two ule rows (home & away teams)
  if (home && away) {
    const resH = haveScores ? (hs > as ? "W" : hs < as ? "L" : "T") : "";
    const resA = haveScores ? (as > hs ? "W" : as < hs ? "L" : "T") : "";
    games.push({ team: home, date, week, opponent: away, home_away: "H", result: haveScores ? `${hs}-${as} ${resH}` : "" });
    games.push({ team: away, date, week, opponent: home, home_away: "A", result: haveScores ? `${as}-${hs} ${resA}` : "" });
  } else if (T1 && T2) {
    // extreme fallback: no home/away at all
    games.push({ team: T1, date, week, opponent: T2, home_away: "-", result: "" });
    games.push({ team: T2, date, week, opponent: T1, home_away: "-", result: "" });
  }
});

// ules → { [team]: Game[] }
const ulesByTeam = groupBy(games, g => g.team);

// standings only if we have scores; otherwise zeros
const standingsMap = {};
games.forEach(g => {
  if (!g.result) return; // no scores yet
  const [us, , res] = (g.result || "").split(" ");
  const [pf, pa] = (us || "").split("-").map(Number);
  const t = g.team;
  standingsMap[t] = standingsMap[t] || { team: t, w:0, l:0, t:0, pf:0, pa:0 };
  standingsMap[t].pf += pf || 0; standingsMap[t].pa += pa || 0;
  if (res === "W") standingsMap[t].w++; else if (res === "L") standingsMap[t].l++; else standingsMap[t].t++;
});

const standings = Object.values(standingsMap).map(s => ({
  ...s,
  pct: (s.w + 0.5 * s.t) / Math.max(1, s.w + s.l + s.t),
})).sort((a,b) => b.pct - a.pct || (b.pf - b.pa) - (a.pf - a.pa));

    // ----- players (season totals) -----
    const byPlayer = groupBy(
      rows.filter((r) => r.player),
      (r) => `${r.player}||${r.team}`
    );
    const playerAgg = Object.values(byPlayer).map((list) => {
      const base = list[0];
      return {
        season: base.season,
        player: base.player,
        team: base.team,
        position: base.position,
        pass_att: sum(list, "pass_att"),
        pass_cmp: sum(list, "pass_cmp"),
        pass_yds: sum(list, "pass_yds"),
        pass_td: sum(list, "pass_td"),
        pass_int: sum(list, "pass_int"),
        rush_att: sum(list, "rush_att"),
        rush_yds: sum(list, "rush_yds"),
        rush_td: sum(list, "rush_td"),
        rec_rec: sum(list, "rec_rec"),
        rec_tgt: sum(list, "rec_tgt"),
        rec_yds: sum(list, "rec_yds"),
        rec_td: sum(list, "rec_td"),
      };
    });

    // ----- leaders -----
    const passQ = playerAgg.filter((p) => p.pass_att >= 14);
    const rushQ = playerAgg.filter((p) => p.rush_att >= 14);
    const recvQ = playerAgg.filter((p) => p.rec_tgt >= 10);

    const rating = passQ.map((p) => ({
      ...p,
      rating: Number(
        nflRating(
          p.pass_cmp,
          p.pass_att,
          p.pass_yds,
          p.pass_td,
          p.pass_int
        ).toFixed(1)
      ),
    }));

    const leaders = {
      season,
      generated_at: new Date().toISOString(),
      categories: {
        passing_yards: [...passQ].sort((a, b) => b.pass_yds - a.pass_yds).slice(0, 25),
        passing_tds: [...passQ].sort((a, b) => b.pass_td - a.pass_td).slice(0, 25),
        passer_rating: [...rating].sort((a, b) => b.rating - a.rating).slice(0, 25),
        rushing_yards: [...rushQ].sort((a, b) => b.rush_yds - a.rush_yds).slice(0, 25),
        rushing_tds: [...rushQ].sort((a, b) => b.rush_td - a.rush_td).slice(0, 25),
        receiving_yards: [...recvQ].sort((a, b) => b.rec_yds - a.rec_yds).slice(0, 25),
        receiving_tds: [...recvQ].sort((a, b) => b.rec_td - a.rec_td).slice(0, 25),
      },
    };

    const schedMap = {};
    schedulesByTeamArr.forEach((list) => {
      if (list?.length) schedMap[list[0].team] = list;
    });

    return { standings, schedMap, playerAgg, leaders };
  }

  const publish = async () => {
    if (!season) return alert("Enter a season at the top right first.");
    if (!rows.length) return alert("Upload CSV(s) first");
    setBusy(true);
    setMsg("Computing…");
    try {
      const { standings, schedMap, playerAgg, leaders } = compute(rows);
      setMsg("Uploading snapshots…");
      await uploadJSON(`stats/${season}/standings.json`, standings);
      await Promise.all(
        Object.entries(schedMap).map(([team, games]) =>
          uploadJSON(
            `stats/${season}/teams/${encodeURIComponent(team)}.json`,
            games
          )
        )
      );
      await uploadJSON(`stats/${season}/players/index.json`, playerAgg);
      await uploadJSON(`stats/${season}/leaders.json`, leaders);
      setLeadersData(leaders);
      setMsg("Published!");
      onPublished && onPublished(season);
    } catch (e) {
      console.error(e);
      setMsg("Error: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>Upload & Publish</h3>
      {!ok && (
        <form onSubmit={handleLogin} className="row">
          <input
            type="password"
            placeholder="Upload passcode"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button className="btn primary" type="submit">
            Unlock
          </button>
          <span className="muted">Set VITE_UPLOAD_PASSWORD in Vercel settings.</span>
        </form>
      )}
      {ok && (
        <div>
          <div className="row">
            <input
              type="file"
              accept=".csv"
              multiple
              onChange={(e) => parseFiles(e.target.files)}
            />
            <button className="btn primary" onClick={publish} disabled={busy}>
              {busy ? "Publishing…" : "Publish to Supabase"}
            </button>
          </div>
          <div className="spacer"></div>
          <div className="muted">{msg}</div>
        </div>
      )}
    </div>
  );
}
