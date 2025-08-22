import React from 'react'

export function Teams({ seasons, season, team, setTeam, schedulesByTeam }){
  const teams = Object.keys(schedulesByTeam||{}).sort()
  const games = team ? schedulesByTeam[team] || [] : []
  return (
    <div className="card">
      <div className="row">
        <h3>Teams</h3>
        <select value={team} onChange={e=>setTeam(e.target.value)}>
          <option value="">— Select team —</option>
          {teams.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="spacer"></div>
      {!team ? <div className="muted">Pick a team to view schedule.</div> : (
        <table>
          <thead>
            <tr><th>Date</th><th>Week</th><th>Opponent</th><th>H/A</th><th>Result</th></tr>
          </thead>
          <tbody>
            {games.map((g,i)=> (
              <tr key={i}>
                <td>{g.date}</td>
                <td>{g.week}</td>
                <td>{g.opponent}</td>
                <td>{g.home_away}</td>
                <td>{g.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
