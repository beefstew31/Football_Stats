export function nflRating(cmp, att, yds, td, ints){
  if (!att) return 0;
  const a = Math.max(0, Math.min(2.375, ((cmp/att)-0.3)*5));
  const b = Math.max(0, Math.min(2.375, ((yds/att)-3)*0.25));
  const c = Math.max(0, Math.min(2.375, (td/att)*20));
  const d = Math.max(0, Math.min(2.375, 2.375 - ((ints/att)*25)));
  return ((a+b+c+d)/6)*100;
}
export function topN(arr,key,n=25){ return [...arr].sort((a,b)=>(b[key]??0)-(a[key]??0)).slice(0,n) }
export function sum(arr,key){ return arr.reduce((a,b)=>a+(Number(b[key])||0),0) }
export function groupBy(arr, fn){ return arr.reduce((m, x)=>{ const k = fn(x); (m[k]=m[k]||[]).push(x); return m }, {}) }
