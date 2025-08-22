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
      rec_tgt: n("rec_t
