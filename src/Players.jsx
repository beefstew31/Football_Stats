import React from 'react'

export function Players({ playerAgg }){
  if (!playerAgg?.length) return <div className="muted">No players published for this season.</div>
  return (
    <div className="card">
      <h3>Players</h3>
      <div className="spacer"></div>
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
          {playerAgg.map((p,i)=> (
            <tr key={i}>
              <td>{p.player}</td><td>{p.team}</td><td>{p.position||''}</td>
              <td>{p.pass_yds||0}</td><td>{p.pass_td||0}</td><td>{p.pass_int||0}</td>
              <td>{p.rush_yds||0}</td><td>{p.rush_td||0}</td>
              <td>{p.rec_rec||0}</td><td>{p.rec_yds||0}</td><td>{p.rec_td||0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
