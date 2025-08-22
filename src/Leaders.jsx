import React from 'react'

export function Leaders({ data }){
  if (!data) return <div className="muted">No leaders yet for this season.</div>
  const C = data.categories || {}
  const Table = ({title, rows, cols}) => !rows?.length ? null : (
    <div className="card" style={{marginBottom:12}}>
      <h3>{title}</h3>
      <div className="spacer"></div>
      <table>
        <thead><tr>{cols.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r,i)=>(<tr key={i}>{cols.map(c=><td key={c.key}>{r[c.key]}</td>)}</tr>))}
        </tbody>
      </table>
    </div>
  )
  return (
    <div>
      <div className="muted">Generated: {new Date(data.generated_at||Date.now()).toLocaleString()}</div>
      <div className="spacer"></div>
      <Table title="Passing Yards" rows={C.passing_yards} cols={[
        {key:'player',label:'Player'},{key:'team',label:'Team'},{key:'pass_yds',label:'Yds'},{key:'pass_td',label:'TD'},{key:'pass_int',label:'INT'},{key:'pass_att',label:'Att'}
      ]} />
      <Table title="Rushing Yards" rows={C.rushing_yards} cols={[
        {key:'player',label:'Player'},{key:'team',label:'Team'},{key:'rush_yds',label:'Yds'},{key:'rush_td',label:'TD'},{key:'rush_att',label:'Att'}
      ]} />
      <Table title="Receiving Yards" rows={C.receiving_yards} cols={[
        {key:'player',label:'Player'},{key:'team',label:'Team'},{key:'rec_yds',label:'Yds'},{key:'rec_td',label:'TD'},{key:'rec_rec',label:'Rec'},{key:'rec_tgt',label:'Tgt'}
      ]} />
      <Table title="Passer Rating" rows={C.passer_rating} cols={[
        {key:'player',label:'Player'},{key:'team',label:'Team'},{key:'rating',label:'Rating'},{key:'pass_yds',label:'Yds'},{key:'pass_td',label:'TD'},{key:'pass_int',label:'INT'}
      ]} />
    </div>
  )
}
