import React from 'react'

export function Standings({ data }){
  if (!data?.length) return <div className="muted">No standings published for this season.</div>
  return (
    <div className="card">
      <h3>Standings</h3>
      <div className="spacer"></div>
      <table>
        <thead>
          <tr><th>Team</th><th>W</th><th>L</th><th>T</th><th>PF</th><th>PA</th><th>Diff</th><th>Win%</th></tr>
        </thead>
        <tbody>
          {data.map((r,i)=> (
            <tr key={i}>
              <td>{r.team}</td><td>{r.w}</td><td>{r.l}</td><td>{r.t||0}</td><td>{r.pf||0}</td><td>{r.pa||0}</td><td>{(r.pf||0)-(r.pa||0)}</td><td>{(r.pct||0).toFixed?.(3) ?? r.pct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
