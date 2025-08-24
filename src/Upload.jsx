// src/Upload.jsx
import React, { useState } from "react";
import Papa from "papaparse";
import { uploadJSON, UPLOAD_PASSWORD } from "./supa";
import { nflRating, groupBy, sum } from "./utils";
import { slugPlayer } from "./slug"; // <-- needed for per-player filenames

console.log("[Upload.jsx] loaded");

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

  // ---------- compute helpers ----------
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
    // normalize rows for everything
    const allNorm = all.map(canonical);

    // rows for the chosen season only
    const rows = allNorm.filter((r) => String(r.season) === String(season));

    // ----- schedules -----
    const games = [];
    const normKey = (r) => {
      if (r.game_id) return `gid:${r.game_id}`;
      const [t1, t2] = [(r.team || "").trim(), (r.opponent || "").trim()].sort();
      return `d:${r.date}|w:${r.week}|${t1}__vs__${t2}`;
    };
    const byGame = groupBy(rows.filter((r) => r.team && r.opponent), normKey);

    Object.values(byGame).forEach((list) => {
      const s = list[0];
      const teams = [...new Set(list.flatMap((r) => [r.team, r.opponent]))].filter(Boolean);
      const [T1, T2] = teams;
      let home = s.home_team || "";
      let away = s.away_team || "";
      if ((!home || !away) && T1 && T2) [home, away] = [T1, T2];

      const hs = Number(s.home_score || 0);
      const as = Number(s.away_score || 0);
      const scored = Number.isFinite(hs) && Number.isFinite(as) && (hs > 0 || as > 0);

      if (home && away) {
        const resH = scored ? (hs > as ? "W" : hs < as ? "L" : "T") : "";
        const resA = scored ? (as > hs ? "W" : as < hs ? "L" : "T") : "";
        games.push({
          team: home,
          date: s.date,
          week: s.week,
          opponent: away,
          home_away: "H",
          result: scored ? `${hs}-${as} ${resH}` : "",
        });
        games.push({
          team: away,
          date: s.date,
          week: s.week,
          opponent: home,
          home_away: "A",
          result: scored ? `${as}-${hs} ${resA}` : "",
        });
      } else if (T1 && T2) {
        games.push({ team: T1, date: s.date, week: s.week, opponent: T2, home_away: "-", result: "" });
        games.push({ team: T2, date: s.date, week: s.week, opponent: T1, home_away: "-", result: "" });
      }
    });

    const schedulesByTeam = groupBy(games, (g) => g.team);

    // ----- standings -----
    const standingsMap = {};
    games.forEach((g) => {
      if (!g.result) return;
      const [us, , res] = (g.result || "").split(" ");
      const [pf, pa] = (us || "").split("-").map(Number);
      const t = g.team;
      standingsMap[t] = standingsMap[t] || { team: t, w: 0, l: 0, t: 0, pf: 0, pa: 0 };
      standingsMap[t].pf += pf || 0;
      standingsMap[t].pa += pa || 0;
      if (res === "W") standingsMap[t].w++;
      else if (res === "L") standingsMap[t].l++;
      else standingsMap[t].t++;
    });

    const standings = Object.values(standingsMap)
      .map((s) => ({ ...s, pct: (s.w + 0.5 * s.t) / Math.max(1, s.w + s.l + s.t) }))
      .sort((a, b) => b.pct - a.pct || (b.pf - b.pa) - (a.pf - a.pa));

    // ----- players (season totals) -----
    const byPlayer = groupBy(rows.filter((r) => r.player), (r) => `${r.player}||${r.team}`);
    const playerAgg = Object.values(byPlayer).map((list) => {
      const b = list[0];
      return {
        season: b.season,
        player: b.player,
        team: b.team,
        position: b.position,
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
      rating: Number(nflRating(p.pass_cmp, p.pass_att, p.pass_yds, p.pass_td, p.pass_int).toFixed(1)),
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

    // ----- per-player logs for this SEASON -----
    const logsByPlayerKey = groupBy(
      rows.filter((r) => r.player),
      (r) => `${r.player}||${r.team}`
    );

    // ----- per-player CAREER (all seasons uploaded) -----
    const byPlayerSeason = groupBy(
      allNorm.filter((r) => r.player),
      (r) => `${r.player}||${r.team}||${r.season}`
    );

    const careerByPlayerKey = {};
    Object.entries(byPlayerSeason).forEach(([k, list]) => {
      const [player, team, sea] = k.split("||");
      const totals = {
        season: sea,
        team,
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
      const key = `${player}||${team}`;
      (careerByPlayerKey[key] = careerByPlayerKey[key] || []).push(totals);
    });
    Object.values(careerByPlayerKey).forEach((arr) =>
      arr.sort((a, b) => String(b.season).localeCompare(String(a.season)))
    );

    // schedules map for publishing
    const schedMap = {};
    Object.entries(schedulesByTeam).forEach(([team, list]) => {
      schedMap[team] = list;
    });

    return { standings, schedMap, playerAgg, leaders, logsByPlayerKey, careerByPlayerKey };
  }

  // ---------- publish ----------
  const publish = async () => {
    if (!season) return alert("Enter a season at the top right first.");
    if (!rows.length) return alert("Upload CSV(s) first");

    setBusy(true);
    setMsg("Computing…");

    try {
      const {
        standings,
        schedMap,
        playerAgg,
        leaders,
        logsByPlayerKey,
        careerByPlayerKey,
      } = compute(rows);

      setMsg("Uploading snapshots…");

      // standings
      await uploadJSON(`stats/${season}/standings.json`, standings);

      // team schedules
      await Promise.all(
        Object.entries(schedMap).map(([team, games]) =>
          uploadJSON(`stats/${season}/teams/${encodeURIComponent(team)}.json`, games)
        )
      );

      // player index + leaders
      await uploadJSON(`stats/${season}/players/index.json`, playerAgg);
      await uploadJSON(`stats/${season}/leaders.json`, leaders);
      if (setLeadersData) setLeadersData(leaders);

      // per-player logs (THIS SEASON)
      await Promise.all(
        Object.entries(logsByPlayerKey).map(([key, list]) => {
          const [player, team] = key.split("||");
          const slug = slugPlayer(player, team);
          return uploadJSON(`stats/${season}/players/logs/${slug}.json`, list);
        })
      );

      // per-player CAREER (ALL seasons you’ve uploaded)
      await Promise.all(
        Object.entries(careerByPlayerKey).map(([key, arr]) => {
          const [player, team] = key.split("||");
          const slug = slugPlayer(player, team);
          return uploadJSON(`career/players/${slug}.json`, arr);
        })
      );

      setMsg("Published!");
      if (onPublished) onPublished(season);
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
      {!ok ? (
        <form onSubmit={handleLogin} className="row">
          <input
            type="password"
            placeholder="Upload passcode"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button className="btn primary" type="submit">Unlock</button>
          <span className="muted">Set VITE_UPLOAD_PASSWORD in Vercel settings.</span>
        </form>
      ) : (
        <div>
          <div className="row">
            <input type="file" accept=".csv" multiple onChange={(e) => parseFiles(e.target.files)} />
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
