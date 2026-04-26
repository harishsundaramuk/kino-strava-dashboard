import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStarredSegments, getClubs, getClubActivities } from "@/lib/strava";
import { loadTokens, refreshAccessToken } from "@/lib/strava";

// ── Internal fetch for segment efforts (your own only — Strava allows this) ──
async function getMySegmentEfforts(segmentId, athleteId) {
  let { access_token, expires_at } = loadTokens() ?? {};
  if (!access_token || expires_at * 1000 < Date.now() + 60_000) {
    access_token = await refreshAccessToken();
  }
  const url = new URL(`https://www.strava.com/api/v3/segments/${segmentId}/all_efforts`);
  url.searchParams.set("athlete_id", athleteId);
  url.searchParams.set("per_page", "10");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!res.ok) throw new Error(`Segment efforts error: ${res.status}`);
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (s) => {
  if (!s) return "—";
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), ss=s%60;
  return h>0 ? `${h}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}` : `${m}:${String(ss).padStart(2,"0")}`;
};
const fmtPace  = (mps) => { if(!mps) return "—"; const spm=1000/mps; const m=Math.floor(spm/60); const s=Math.round(spm%60); return `${m}:${String(s).padStart(2,"0")}/km`; };
const fmtDist  = (m)   => m ? `${(m/1000).toFixed(1)} km` : "—";
const fmtDate  = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return "—"; } };
const medal    = (i)   => i===0?"🥇":i===1?"🥈":i===2?"🥉":null;

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ T }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:280,gap:16}}>
      <div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${T.faint}`,borderTopColor:T.primary,animation:"spin .8s linear infinite"}}/>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.muted}}>Loading from Strava…</div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ icon, title, desc, action, actionLabel, T }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:280,gap:12,textAlign:"center"}}>
      <div style={{fontSize:48}}>{icon}</div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:T.text}}>{title}</div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.muted,lineHeight:1.7,maxWidth:340}}>{desc}</div>
      {action && (
        <button onClick={action} style={{marginTop:8,background:T.primary,border:"none",outline:"none",borderRadius:10,color:"#fff",padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────
function TabBtn({ label, icon, active, onClick, T }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:8,
      padding:"10px 20px", borderRadius:10,
      background: active ? T.primary : T.faint,
      color: active ? "#fff" : T.muted,
      border:"none", outline:"none", cursor:"pointer",
      fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700,
      transition:"all .2s ease",
    }}>
      <span>{icon}</span>{label}
    </button>
  );
}

// ── Tier Badge ────────────────────────────────────────────────────────────────
function TierBadge({ isPremium, T }) {
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:6,
      background:isPremium?"rgba(255,179,71,.12)":"rgba(161,161,170,.1)",
      border:`1px solid ${isPremium?"rgba(255,179,71,.3)":"rgba(161,161,170,.2)"}`,
      borderRadius:20,padding:"4px 12px"}}>
      <span style={{fontSize:12}}>{isPremium?"⭐":"🆓"}</span>
      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:isPremium?"#FFB347":T.muted,fontWeight:700}}>
        {isPremium?"Strava Subscriber — Full Data":"Free Tier — Limited Data"}
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TAB 1 — Personal Records
// ════════════════════════════════════════════════════════════════════
function PersonalRecords({ stats, activities, T, CARD }) {
  const allTime = stats?.all_run_totals;
  const ytd     = stats?.ytd_run_totals;
  const recent  = stats?.recent_run_totals;

  const bestRun    = activities?.length ? [...activities].sort((a,b)=>b.distance-a.distance)[0] : null;
  const fastestRun = activities?.length ? [...activities].filter(a=>a.average_speed).sort((a,b)=>b.average_speed-a.average_speed)[0] : null;

  const records = [
    {label:"Total Distance",     value:allTime?fmtDist(allTime.distance):"—",                          icon:"🌍",color:"#E8603E",sub:"All time"},
    {label:"Total Runs",         value:allTime?`${allTime.count}`:"—",                                  icon:"🏃",color:"#FFB347",sub:"All time"},
    {label:"Total Time",         value:allTime?fmtTime(allTime.moving_time):"—",                        icon:"⏱", color:"#84CC16",sub:"All time"},
    {label:"Total Elevation",    value:allTime?`${Math.round(allTime.elevation_gain)}m`:"—",            icon:"⛰", color:"#22D3EE",sub:"All time"},
    {label:"This Year Distance", value:ytd?fmtDist(ytd.distance):"—",                                  icon:"📅",color:"#E8603E",sub:"Year to date"},
    {label:"This Year Runs",     value:ytd?`${ytd.count}`:"—",                                          icon:"🔢",color:"#FFB347",sub:"Year to date"},
    {label:"Longest Run",        value:bestRun?fmtDist(bestRun.distance):"—",                           icon:"📏",color:"#84CC16",sub:bestRun?.name??""},
    {label:"Fastest Pace",       value:fastestRun?fmtPace(fastestRun.average_speed):"—",               icon:"⚡",color:"#F43F5E",sub:fastestRun?.name??""},
  ];

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {records.map((r,i)=>(
          <div key={i} style={{...CARD,padding:"20px 18px"}}>
            <div style={{fontSize:28,marginBottom:10}}>{r.icon}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,fontWeight:600,letterSpacing:.5,marginBottom:6}}>{r.label.toUpperCase()}</div>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:32,color:r.color,lineHeight:1}}>{r.value}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,marginTop:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.sub}</div>
          </div>
        ))}
      </div>

      {recent && (
        <div style={{...CARD,padding:"20px 22px"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:T.text,marginBottom:16}}>Last 4 Weeks</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {[
              {l:"Runs",     v:recent.count,                              color:"#E8603E"},
              {l:"Distance", v:fmtDist(recent.distance),                  color:"#FFB347"},
              {l:"Time",     v:fmtTime(recent.moving_time),               color:"#84CC16"},
              {l:"Elevation",v:`${Math.round(recent.elevation_gain??0)}m`,color:"#22D3EE"},
            ].map((s,i)=>(
              <div key={i} style={{background:T.faint,borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,fontWeight:600,marginBottom:4}}>{s.l}</div>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:26,color:s.color,lineHeight:1}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TAB 2 — Segment Personal Bests (your efforts only — Strava allows)
// ════════════════════════════════════════════════════════════════════
function SegmentTab({ athleteId, T, CARD }) {
  const [segments, setSegments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [efforts,  setEfforts]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [efLoading,setEfLoading]= useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    getStarredSegments()
      .then(data => { setSegments(data??[]); if(data?.length) setSelected(data[0]); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected || !athleteId) return;
    setEfLoading(true);
    setEfforts([]);
    getMySegmentEfforts(selected.id, athleteId)
      .then(data => setEfforts(data??[]))
      .catch(e => setError(e.message))
      .finally(() => setEfLoading(false));
  }, [selected, athleteId]);

  if (loading) return <Spinner T={T}/>;
  if (error)   return <Empty icon="⚠️" title="Could not load segments" desc={error} T={T}/>;
  if (!segments.length) return (
    <Empty icon="📍" title="No starred segments" T={T}
      desc="Star your favourite running segments on Strava and your personal bests will appear here."
      action={()=>window.open("https://www.strava.com/segments/explore","_blank")}
      actionLabel="Explore Segments on Strava ↗"
    />
  );

  const best = efforts.length ? [...efforts].sort((a,b)=>a.elapsed_time-b.elapsed_time)[0] : null;

  return (
    <div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.muted,marginBottom:16,lineHeight:1.6,background:T.faint,borderRadius:10,padding:"10px 14px"}}>
        ℹ️ Showing <strong>your personal efforts</strong> on each starred segment. Strava's March 2026 update restricts third-party apps from showing other athletes' data.
      </div>

      {/* Segment pills */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        {segments.map(seg=>(
          <button key={seg.id} onClick={()=>setSelected(seg)} style={{
            padding:"8px 16px", borderRadius:20,
            background:selected?.id===seg.id?T.primary:T.faint,
            color:selected?.id===seg.id?"#fff":T.muted,
            border:"none",outline:"none",cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,
            transition:"all .15s ease", whiteSpace:"nowrap",
          }}>{seg.name}</button>
        ))}
      </div>

      {/* Segment info card */}
      {selected && (
        <div style={{...CARD,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:T.text}}>{selected.name}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginTop:3}}>
              {fmtDist(selected.distance)}
              {selected.average_grade ? ` · ${selected.average_grade.toFixed(1)}% avg grade` : ""}
              {selected.city ? ` · ${selected.city}` : ""}
            </div>
          </div>
          <button onClick={()=>window.open(`https://www.strava.com/segments/${selected.id}`,"_blank")}
            style={{background:T.primary,border:"none",outline:"none",borderRadius:8,color:"#fff",padding:"7px 16px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            View on Strava ↗
          </button>
        </div>
      )}

      {/* Your best banner */}
      {best && (
        <div style={{...CARD,padding:"16px 20px",marginBottom:16,background:"rgba(232,96,62,.07)",border:"1px solid rgba(232,96,62,.2)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:32}}>🏆</span>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:T.text}}>Your Personal Best</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginTop:2}}>{fmtDate(best.start_date_local)}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:20,textAlign:"right"}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:T.primary,lineHeight:1}}>{fmtTime(best.elapsed_time)}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted}}>Time</div>
              </div>
              <div>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:T.cyan,lineHeight:1}}>{fmtPace(best.average_speed??0)}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted}}>Pace</div>
              </div>
              {best.average_heartrate && (
                <div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:T.rose,lineHeight:1}}>{Math.round(best.average_heartrate)}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted}}>Avg BPM</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All your efforts */}
      {efLoading ? <Spinner T={T}/> : efforts.length ? (
        <div style={{...CARD,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:"40px 1fr 110px 100px 80px",gap:12}}>
            {["","Date","Time","Pace","HR"].map((h,i)=>(
              <div key={i} style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,fontWeight:700,letterSpacing:1}}>{h}</div>
            ))}
          </div>
          {[...efforts].sort((a,b)=>a.elapsed_time-b.elapsed_time).map((e,i)=>(
            <div key={e.id??i} style={{
              padding:"13px 20px",
              borderBottom:`1px solid ${T.border}`,
              display:"grid",gridTemplateColumns:"40px 1fr 110px 100px 80px",gap:12,alignItems:"center",
              background:i===0?"rgba(232,96,62,.05)":"transparent",
            }}>
              <div>{medal(i) ? <span style={{fontSize:16}}>{medal(i)}</span> : <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.muted}}>#{i+1}</span>}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.text}}>{fmtDate(e.start_date_local)}</div>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,color:i===0?T.primary:T.text}}>{fmtTime(e.elapsed_time)}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.muted}}>{fmtPace(e.average_speed??0)}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.muted}}>{e.average_heartrate?`${Math.round(e.average_heartrate)} bpm`:"—"}</div>
            </div>
          ))}
        </div>
      ) : selected ? (
        <Empty icon="🏃" title="No efforts recorded" desc="You haven't run this segment yet. Go get it!" T={T}/>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TAB 3 — Clubs (activity feed — Strava allows this)
// ════════════════════════════════════════════════════════════════════
function ClubsTab({ T, CARD }) {
  const [clubs,      setClubs]      = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    getClubs()
      .then(data => { setClubs(data??[]); if(data?.length) setSelected(data[0]); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setActLoading(true);
    setActivities([]);
    getClubActivities(selected.id, { per_page: 15 })
      .then(data => setActivities(data??[]))
      .catch(e => setError(e.message))
      .finally(() => setActLoading(false));
  }, [selected]);

  if (loading) return <Spinner T={T}/>;
  if (error)   return <Empty icon="⚠️" title="Could not load clubs" desc={error} T={T}/>;
  if (!clubs.length) return (
    <Empty icon="👥" title="No clubs found" T={T}
      desc="Join a Strava running club and their recent activity feed will appear here."
      action={()=>window.open("https://www.strava.com/clubs","_blank")}
      actionLabel="Find Clubs on Strava ↗"
    />
  );

  const fmtPaceShort = (mps) => { if(!mps) return "—"; const spm=1000/mps; const m=Math.floor(spm/60); const s=Math.round(spm%60); return `${m}:${String(s).padStart(2,"0")}`; };

  return (
    <div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.muted,marginBottom:16,lineHeight:1.6,background:T.faint,borderRadius:10,padding:"10px 14px"}}>
        ℹ️ Showing <strong>recent club activity feed</strong>. Strava's March 2026 update restricts member-vs-member leaderboards in third-party apps.
      </div>

      {/* Club picker */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        {clubs.map(club=>(
          <button key={club.id} onClick={()=>setSelected(club)} style={{
            display:"flex",alignItems:"center",gap:8,
            padding:"8px 16px",borderRadius:20,
            background:selected?.id===club.id?T.primary:T.faint,
            color:selected?.id===club.id?"#fff":T.muted,
            border:"none",outline:"none",cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,
            transition:"all .15s ease",
          }}>
            {club.profile_medium && <img src={club.profile_medium} style={{width:20,height:20,borderRadius:"50%",objectFit:"cover"}} alt=""/>}
            {club.name}
          </button>
        ))}
      </div>

      {/* Club info */}
      {selected && (
        <div style={{...CARD,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          {selected.profile_medium && <img src={selected.profile_medium} style={{width:48,height:48,borderRadius:12,objectFit:"cover",flexShrink:0}} alt=""/>}
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:T.text}}>{selected.name}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginTop:3}}>
              {selected.member_count?.toLocaleString()} members
              {selected.city?` · ${selected.city}`:""}
              {selected.country?` · ${selected.country}`:""}
            </div>
          </div>
          <button onClick={()=>window.open(`https://www.strava.com/clubs/${selected.id}`,"_blank")}
            style={{background:T.primary,border:"none",outline:"none",borderRadius:8,color:"#fff",padding:"7px 16px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>
            View Club ↗
          </button>
        </div>
      )}

      {/* Recent activity feed */}
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,fontWeight:700,letterSpacing:1,marginBottom:12}}>RECENT CLUB ACTIVITIES</div>

      {actLoading ? <Spinner T={T}/> : activities.length ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {activities.map((a,i)=>(
            <div key={i} style={{...CARD,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:38,height:38,borderRadius:10,background:"rgba(232,96,62,.12)",border:"1px solid rgba(232,96,62,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {a.type==="Run"?"🏃":a.type==="Ride"?"🚴":a.type==="Swim"?"🏊":"🏅"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {a.athlete?.firstname} {a.athlete?.lastname}
                </div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {a.name}
                </div>
              </div>
              <div style={{display:"flex",gap:16,flexShrink:0}}>
                {[
                  {v:fmtDist(a.distance),  l:"KM"},
                  {v:fmtPaceShort(a.average_speed), l:"/KM"},
                  {v:fmtTime(a.moving_time),l:"TIME"},
                ].map((s,j)=>(
                  <div key={j} style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:j===0?T.primary:T.text,lineHeight:1}}>{s.v}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:T.muted,fontWeight:600,letterSpacing:1}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon="😴" title="No recent activity" desc="No club members have logged activities recently." T={T}/>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Main export
// ════════════════════════════════════════════════════════════════════
export default function LeaderboardSection({ stats, activities, T, CARD }) {
  const { athlete } = useAuth();
  const [tab, setTab] = useState(0);

  const isPremium = !!(athlete?.premium || athlete?.subscriber);
  const athleteId = athlete?.id;

  const tabs = [
    {label:"Personal Records", icon:"🏅"},
    {label:"My Segments",      icon:"📍"},
    {label:"Clubs",            icon:"👥"},
  ];

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:T.text,marginBottom:4}}>Leaderboard</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.muted}}>
            Your personal records, segment bests and club activity
          </div>
        </div>
        <TierBadge isPremium={isPremium} T={T}/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
        {tabs.map((t,i)=>(
          <TabBtn key={i} label={t.label} icon={t.icon} active={tab===i} onClick={()=>setTab(i)} T={T}/>
        ))}
      </div>

      {tab===0 && <PersonalRecords stats={stats} activities={activities} T={T} CARD={CARD}/>}
      {tab===1 && <SegmentTab athleteId={athleteId} T={T} CARD={CARD}/>}
      {tab===2 && <ClubsTab T={T} CARD={CARD}/>}
    </div>
  );
}