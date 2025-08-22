import React, { useEffect, useState } from 'react'
import { supa, getPublicUrl } from './supa'
import { Leaders } from './Leaders.jsx'
import { Standings } from './Standings.jsx'
import { Teams } from './Teams.jsx'
import { Players } from './Players.jsx'
import Upload from './Upload.jsx'

export default function App(){
  const [tab, setTab] = useState('standings')
  const [season, setSeason] = useState('')
  const [standings, setStandings] = useState(null)
  const [leaders, setLeaders] = useState(null)
  const [players, setPlayers] = useState(null)
  const [team, setTeam] = useState('')
  const [schedulesByTeam, setSchedulesByTeam] = useState({})
  const [status, setStatus] = useState('')

  async function fetchJSON(path){
    if (!supa) throw new Error('Supabase not configured')
    const url = getPublicUrl(path)
    const r = await fetch(url)
    if (!r.ok) throw new Error('Fetch failed '+path)
    return r.json()
  }

  async function loadSeason(season){
    try{
      setStatus('Loading…')
      const [st, pl, leaders] = await Promise.all([
        fetchJSON(`stats/${season}/standings.json`),
        fetchJSON(`stats/${season}/players/index.json`),
        fetchJSON(`stats/${season}/leaders.json`).catch(()=>null),
      ])
      setStandings(st); setPlayers(pl); setLeaders(leaders)
      const teams = (st||[]).map(x=>x.team)
      const schedEntries = await Promise.all(teams.map(
        t => fetchJSON(`stats/${season}/teams/${encodeURIComponent(t)}.json`).then(rows=>[t, rows]).catch(()=>[t, []])
      ))
      const map = Object.fromEntries(schedEntries)
      setSchedulesByTeam(map)
      setStatus('Loaded')
    }catch(e){
      console.warn(e); setStatus('')
      setStandings(null); setPlayers(null); setLeaders(null); setSchedulesByTeam({})
    }
  }

  useEffect(()=>{ if (season) loadSeason(season) }, [season])

  return (
    <div className="wrap">
      <header>
        <nav>
          {['standings','teams','players','leaders','upload'].map(id => (
            <button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{id[0].toUpperCase()+id.slice(1)}</button>
          ))}
        </nav>
        <div className="row">
          <label>Season</label>
          <input placeholder="e.g. 2025" value={season} onChange={e=>setSeason(e.target.value)} style={{width:100}} />
        </div>
      </header>

      {!!status && <div className="muted">{status}</div>}

      {tab==='standings' && <Standings data={standings} />}
      {tab==='teams' && <Teams season={season} seasons={[]} team={team} setTeam={setTeam} schedulesByTeam={schedulesByTeam} />}
      {tab==='players' && <Players playerAgg={players} />}
      {tab==='leaders' && <Leaders data={leaders} />}
      {tab==='upload' && <Upload season={season} setLeadersData={setLeaders} onPublished={()=> loadSeason(season)} />}
    </div>
  )
}
