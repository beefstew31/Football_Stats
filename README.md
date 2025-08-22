# Football Stats (Static Snapshots + Supabase Storage)

This app:
- Uploads football CSV box scores
- Computes standings, team schedules, player totals, leaders
- Publishes JSON snapshots to **Supabase Storage**
- All pages **read from Storage** (so refresh/new device always works)
- Upload is gated by `VITE_UPLOAD_PASSWORD`

## 1) Environment variables (Vercel → Project → Settings → Environment Variables)
```
VITE_UPLOAD_PASSWORD=your-passcode
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_BUCKET=pa-football-stats   # your bucket name
```

## 2) Supabase Storage
- Create a **public** bucket (e.g., `pa-football-stats`).
- To allow publishing from the browser without Auth, add temporary RLS policies (SQL editor):
```sql
create policy "anon insert stats" on storage.objects for insert to anon
  with check (bucket_id = 'pa-football-stats' and name like 'stats/%');
create policy "anon update stats" on storage.objects for update to anon
  using (bucket_id = 'pa-football-stats' and name like 'stats/%')
  with check (bucket_id = 'pa-football-stats' and name like 'stats/%');
```
> Later, replace these with `to authenticated` and add Supabase Auth to the Upload tab.

## 3) Deploy
- Push this folder to GitHub.
- In Vercel: **Import Project** → Framework: Vite → Build: `npm run build` → Output: `dist`.
- If the code lives in a subfolder, set **Root Directory** appropriately.
- Add env vars (step 1) and **Redeploy**.

## 4) Use
1. Visit your site.
2. Type season (e.g., `2025`) at top right.
3. **Leaders/Standings/Teams/Players** will load **if JSON exists** in Storage under `stats/<season>/...`.
4. Go to **Upload** → enter passcode → choose CSV(s) → click **Publish to Supabase**.
5. After publish, the app refreshes the data for that season.

## 5) CSV headers recognized
```
date,season,week,game_id,team,opponent,player,position,pass_cmp,pass_att,pass_yds,pass_td,pass_int,rush_att,rush_yds,rush_td,rec_rec,rec_tgt,rec_yds,rec_td,home_team,away_team,home_score,away_score
```
Unknown columns are ignored.

---
