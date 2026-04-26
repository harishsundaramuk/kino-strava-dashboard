import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import LeaderboardSection from "@/components/LeaderboardSection";

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_MONTHLY = [
  {m:"May",km:68,target:80},{m:"Jun",km:82,target:80},{m:"Jul",km:95,target:90},
  {m:"Aug",km:78,target:90},{m:"Sep",km:102,target:95},{m:"Oct",km:118,target:100},
  {m:"Nov",km:89,target:100},{m:"Dec",km:45,target:80},{m:"Jan",km:76,target:85},
  {m:"Feb",km:94,target:85},{m:"Mar",km:108,target:90},{m:"Apr",km:52,target:90},
];
const MOCK_WEEKLY = [
  {d:"Mon",km:8.2,prev:6.1},{d:"Tue",km:0,prev:4.5},{d:"Wed",km:12.5,prev:9.2},
  {d:"Thu",km:6.1,prev:0},{d:"Fri",km:0,prev:7.8},{d:"Sat",km:21.1,prev:18.3},{d:"Sun",km:5.0,prev:5.5},
];
const MOCK_HR = [
  {t:"0",bpm:82},{t:"5",bpm:134},{t:"10",bpm:151},{t:"15",bpm:162},
  {t:"20",bpm:168},{t:"25",bpm:172},{t:"30",bpm:178},{t:"35",bpm:187},{t:"40",bpm:155},{t:"43",bpm:112},
];
const MOCK_ACTS = [
  {id:1,name:"Morning Run",start_date_local:"2026-04-26T06:30:00Z",distance:8400,moving_time:2878,average_heartrate:162,kudos_count:14,average_speed:2.92},
  {id:2,name:"Long Sunday Run",start_date_local:"2026-04-20T07:00:00Z",distance:21100,moving_time:8062,average_heartrate:168,kudos_count:34,average_speed:2.62},
  {id:3,name:"Wednesday Tempo",start_date_local:"2026-04-16T06:30:00Z",distance:12500,moving_time:4125,average_heartrate:174,kudos_count:8,average_speed:3.03},
  {id:4,name:"Easy Recovery Run",start_date_local:"2026-04-14T07:00:00Z",distance:6200,moving_time:2480,average_heartrate:148,kudos_count:5,average_speed:2.50},
  {id:5,name:"Interval Session",start_date_local:"2026-04-12T06:00:00Z",distance:10000,moving_time:3120,average_heartrate:181,kudos_count:22,average_speed:3.21},
];
const MOCK_PBS = [
  {l:"5K",v:"22:14",d:"Mar 2026",badge:"🥇"},
  {l:"10K",v:"46:32",d:"Jan 2026",badge:"🥈"},
  {l:"Half",v:"1:48:05",d:"Nov 2025",badge:"🥉"},
  {l:"Full",v:"3:58:22",d:"Oct 2025",badge:"🏅"},
];
const HR_ZONES = [
  {zone:"Zone 1",label:"Easy",range:"<115 bpm",pct:8,color:"#84CC16"},
  {zone:"Zone 2",label:"Aerobic",range:"115–140 bpm",pct:28,color:"#22D3EE"},
  {zone:"Zone 3",label:"Tempo",range:"140–160 bpm",pct:32,color:"#FFB347"},
  {zone:"Zone 4",label:"Threshold",range:"160–175 bpm",pct:22,color:"#F97316"},
  {zone:"Zone 5",label:"Max",range:"175+ bpm",pct:10,color:"#F43F5E"},
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtPace = (mps) => { const spm=1000/mps; const m=Math.floor(spm/60); const s=Math.round(spm%60); return `${m}:${String(s).padStart(2,"0")}`; };
const fmtDist = (m) => (m/1000).toFixed(2);
const fmtTime = (s) => { const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); const ss=s%60; return h>0?`${h}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`:`${m}:${String(ss).padStart(2,"0")}`; };
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); } catch { return iso?.slice(0,10)??""; } };

// ── Ring ──────────────────────────────────────────────────────────────────────
function Ring({ pct, color, T, size=84, sw=8, center, label }) {
  const r=(size-sw)/2, cx=size/2, cy=size/2;
  const circ=2*Math.PI*r, dash=Math.min(pct/100,1)*circ;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
      <div style={{position:"relative",width:size,height:size}}>
        <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.faint} strokeWidth={sw}/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{filter:`drop-shadow(0 0 7px ${color}55)`,transition:"stroke-dasharray 1.2s ease"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color,lineHeight:1}}>{center[0]}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:8,color:T.muted,fontWeight:600}}>{center[1]}</div>
        </div>
      </div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,fontWeight:600}}>{label}</div>
    </div>
  );
}

// ── VO2 Gauge ─────────────────────────────────────────────────────────────────
function VO2Gauge({ value=52, T }) {
  const R=68, stroke=10, cx=90, cy=88;
  const circ=Math.PI*R, dash=Math.min(value/70,1)*circ;
  const label=value<42?"Fair":value<50?"Good":value<58?"Very Good":"Excellent";
  const labelCol=value<42?T.rose:value<50?T.amber:value<58?T.lime:T.cyan;
  return (
    <svg width={180} height={105} overflow="visible">
      <defs>
        <linearGradient id="vo2g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={T.primary}/><stop offset="100%" stopColor={T.cyan}/>
        </linearGradient>
      </defs>
      <path d={`M${cx-R} ${cy} A${R} ${R} 0 0 1 ${cx+R} ${cy}`} fill="none" stroke={T.faint} strokeWidth={stroke} strokeLinecap="round"/>
      <path d={`M${cx-R} ${cy} A${R} ${R} 0 0 1 ${cx+R} ${cy}`} fill="none" stroke="url(#vo2g)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}/>
      <text x={cx} y={cy-10} textAnchor="middle" fill={T.text} style={{fontFamily:"'Bebas Neue',cursive",fontSize:36}}>{value}</text>
      <text x={cx} y={cy+8} textAnchor="middle" fill={T.muted} style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,letterSpacing:1}}>VO₂ MAX</text>
      <text x={cx} y={cy+24} textAnchor="middle" fill={labelCol} style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700}}>{label}</text>
    </svg>
  );
}

// ── Activity Card ─────────────────────────────────────────────────────────────
function ActivityCard({ a, color, T, dark }) {
  const dist  = fmtDist(a.distance);
  const pace  = fmtPace(a.average_speed);
  const time  = fmtTime(a.moving_time);
  const hr    = Math.round(a.average_heartrate??0);
  const kudos = a.kudos_count??0;
  const date  = fmtDate(a.start_date_local);
  const CARD  = {background:T.card,border:`1px solid ${T.border}`,borderRadius:16,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"};
  return (
    <div style={{...CARD,padding:"18px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:`rgba(232,96,62,${dark?.12:.07})`,border:"1px solid rgba(232,96,62,.22)",borderRadius:20,padding:"2px 10px",marginBottom:6}}>
            <span style={{fontSize:10}}>🏃</span>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.pLight,fontWeight:700,letterSpacing:.5}}>RUN</span>
          </div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,lineHeight:1.3,color:T.text}}>{a.name??"Activity"}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,marginTop:3}}>{date}</div>
        </div>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:30,color,lineHeight:1,textAlign:"right"}}>
          {dist}<br/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted}}>KM</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
        {[{l:"Pace",v:pace},{l:"Time",v:time},{l:"HR",v:hr?`${hr}bpm`:"—"}].map((s,j)=>(
          <div key={j} style={{background:T.faint,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,color:T.text}}>{s.v||"—"}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.muted,marginTop:1,fontWeight:600}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,fontWeight:600}}>👏 {kudos} kudos</span>
        <button onClick={()=>window.open(`https://www.strava.com/activities/${a.id}`,"_blank")}
          style={{background:T.primary,border:"none",outline:"none",borderRadius:7,color:"#fff",padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          View ↗
        </button>
      </div>
    </div>
  );
}

// ── Gear Card — works for shoes AND bikes ─────────────────────────────────────
function GearCard({ item, icon, maxKm, T }) {
  const km     = Math.round((item.converted_distance ?? item.distance ?? 0) / (item.converted_distance ? 1 : 1000));
  const pct    = maxKm ? Math.min((km/maxKm)*100, 100) : null;
  const barCol = pct > 80 ? T.rose : pct > 60 ? T.amber : T.lime;
  const CARD   = {background:T.card,border:`1px solid ${T.border}`,borderRadius:16,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"};
  return (
    <div style={{...CARD,padding:"22px 20px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <span style={{fontSize:36}}>{icon}</span>
        {item.primary && (
          <div style={{background:"rgba(232,96,62,.12)",border:"1px solid rgba(232,96,62,.22)",borderRadius:20,padding:"3px 10px"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.primary,fontWeight:700}}>PRIMARY</span>
          </div>
        )}
        {item.retired && (
          <div style={{background:"rgba(244,63,94,.1)",border:"1px solid rgba(244,63,94,.2)",borderRadius:20,padding:"3px 10px"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:T.rose,fontWeight:700}}>RETIRED</span>
          </div>
        )}
      </div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>{item.name}</div>
      {item.brand_name && (
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginBottom:2}}>{item.brand_name} {item.model_name}</div>
      )}
      {item.nickname && item.nickname !== item.name && (
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,fontStyle:"italic",marginBottom:2}}>"{item.nickname}"</div>
      )}
      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:36,color:pct?barCol:T.primary,lineHeight:1,marginTop:12}}>
        {km.toLocaleString()} <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.muted,fontWeight:400}}>km</span>
      </div>
      {pct !== null && (
        <>
          <div style={{height:6,background:T.faint,borderRadius:999,overflow:"hidden",marginTop:12}}>
            <div style={{height:"100%",width:`${pct}%`,background:barCol,borderRadius:999,transition:"width 1s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted}}>{pct.toFixed(0)}% of {maxKm}km lifespan</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:pct>80?T.rose:T.muted}}>{maxKm-km} km left</div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function KinoDashboard({ activities, stats, loading, error, onRefetch }) {
  const { athlete, logout } = useAuth();
  const { dark, toggle: toggleTheme, T } = useTheme();
  const [activeNav, setActiveNav] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const actColors = [T.primary, T.cyan, T.lime, T.amber, T.rose];
  const allActs   = activities?.length ? activities : MOCK_ACTS;
  const isMock    = !activities?.length;

  // Real gear from Strava athlete object
  const shoes = athlete?.shoes ?? [];
  const bikes = athlete?.bikes ?? [];
  const allGear = [...shoes.map(s=>({...s,_type:"shoe"})), ...bikes.map(b=>({...b,_type:"bike"}))];

  const CARD = {background:T.card,border:`1px solid ${T.border}`,borderRadius:16,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",transition:"background .3s,border-color .3s"};

  const navItems = [
    {ic:"▦",lb:"Overview"},{ic:"⚡",lb:"Activities"},{ic:"〜",lb:"Progress"},
    {ic:"♡",lb:"Health"},{ic:"◈",lb:"Gear"},{ic:"⊞",lb:"Leaderboard"},
  ];

  const sideW    = collapsed ? 64 : 210;
  const initials = athlete ? `${athlete.firstname?.[0]??""}${athlete.lastname?.[0]??""}`.toUpperCase() : "KN";
  const firstName= athlete?.firstname ?? "Athlete";

  const MonthlyTip = ({ active, payload, label }) => active && payload?.length ? (
    <div style={{background:T.tooltipBg,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{fontSize:11,color:T.muted,marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,color:T.primary,fontWeight:700}}>{payload.find(p=>p.dataKey==="km")?.value} km actual</div>
      <div style={{fontSize:12,color:T.muted}}>{payload.find(p=>p.dataKey==="target")?.value} km target</div>
    </div>
  ) : null;

  const HRTip = ({ active, payload }) => active && payload?.length ? (
    <div style={{background:T.tooltipBg,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{fontSize:13,color:T.rose,fontWeight:700}}>{payload[0]?.value} bpm</div>
    </div>
  ) : null;

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:T.bg,minHeight:"100vh",display:"flex",color:T.text,transition:"background .3s,color .3s"}}>

      {/* Blobs */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:-80,left:sideW+20,width:440,height:440,borderRadius:"50%",background:`radial-gradient(circle,${T.blob1} 0%,transparent 70%)`}}/>
        <div style={{position:"absolute",bottom:60,right:80,width:320,height:320,borderRadius:"50%",background:`radial-gradient(circle,${T.blob2} 0%,transparent 70%)`}}/>
      </div>

      {/* ── SIDEBAR ── */}
      <div style={{width:sideW,minHeight:"100vh",background:T.sidebar,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",padding:"20px 0",transition:"width .25s ease",flexShrink:0,zIndex:20,backdropFilter:"blur(20px)",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
        <div style={{padding:`0 ${collapsed?10:16}px 24px`,display:"flex",alignItems:"center",gap:11}}>
          <div style={{flexShrink:0,width:36,height:36,borderRadius:10,background:"#E8603E",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 12px rgba(232,96,62,.45)"}}>
            <svg width="22" height="22" viewBox="0 0 44 44" fill="none">
              <polygon points="6,4 14,4 26,16 18,16" fill="white"/>
              <polygon points="6,40 14,40 26,28 18,28" fill="white"/>
              <rect x="29" y="4" width="9" height="36" rx="1.5" fill="white"/>
            </svg>
          </div>
          {!collapsed && (
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,letterSpacing:1.5,color:T.text,lineHeight:1}}>KINŌ</div>
              <div style={{fontSize:8,color:"#E8603E",fontWeight:700,letterSpacing:2,marginTop:3}}>VIA STRAVA</div>
            </div>
          )}
        </div>

        <div style={{flex:1,padding:`0 ${collapsed?8:10}px`,display:"flex",flexDirection:"column",gap:2}}>
          {navItems.map((n,i)=>(
            <button key={i} onClick={()=>setActiveNav(i)} style={{
              display:"flex",alignItems:"center",gap:12,
              padding:collapsed?"10px":"10px 12px",
              borderRadius:10,
              justifyContent:collapsed?"center":"flex-start",
              background:activeNav===i?`rgba(232,96,62,${dark?".12":".08"})`:"transparent",
              border:activeNav===i?`1px solid rgba(232,96,62,.2)`:"1px solid transparent",
              borderLeft:activeNav===i?`2px solid ${T.primary}`:"2px solid transparent",
              color:activeNav===i?T.text:T.muted,
              outline:"none",cursor:"pointer",width:"100%",textAlign:"left",
              transition:"all .15s ease",
            }}>
              <span style={{fontSize:16,flexShrink:0}}>{n.ic}</span>
              {!collapsed && <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:activeNav===i?700:500,whiteSpace:"nowrap"}}>{n.lb}</span>}
            </button>
          ))}
        </div>

        {!collapsed && (
          <div style={{margin:"16px 12px 8px",background:`rgba(132,204,22,${dark?".08":".06"})`,border:"1px solid rgba(132,204,22,.2)",borderRadius:12,padding:"10px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#84CC16"}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.lime,fontWeight:700}}>Strava Connected</span>
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,marginTop:3}}>Live data syncing</div>
          </div>
        )}

        <div style={{padding:`12px ${collapsed?8:14}px 0`,borderTop:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {athlete?.profile_medium
              ? <img src={athlete.profile_medium} alt={firstName} style={{width:34,height:34,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
              : <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#E8603E,#F08060)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>{initials}</div>
            }
            {!collapsed && (
              <div style={{flex:1,overflow:"hidden"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:700,whiteSpace:"nowrap",color:T.text}}>{firstName}</div>
                <button onClick={logout} style={{background:"none",border:"none",outline:"none",padding:0,fontSize:10,color:T.muted,cursor:"pointer",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,overflow:"auto",padding:"28px 28px 48px",zIndex:1,position:"relative"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:T.text}}>
              Good {new Date().getHours()<12?"morning":"afternoon"}, {firstName} 👋
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.muted,marginTop:4}}>
              {loading?"Syncing your stats…":isMock?"Demo data — connect Strava to see real stats":"Here's your training overview"}
            </div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={onRefetch} disabled={loading} style={{background:T.card,border:`1px solid ${T.border}`,outline:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,color:T.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              {loading?"⟳ Syncing…":"⟳ Refresh"}
            </button>
            <button onClick={()=>setCollapsed(c=>!c)} style={{background:T.card,border:`1px solid ${T.border}`,outline:"none",borderRadius:10,padding:"8px 12px",fontSize:14,cursor:"pointer",color:T.muted}}>
              {collapsed?"→":"←"}
            </button>
            <button onClick={toggleTheme} style={{background:T.faint,border:`1px solid ${T.border}`,outline:"none",borderRadius:20,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,color:T.textSub,fontFamily:"'DM Sans',sans-serif"}}>
              {dark?"🌙 Dark":"☀️ Light"}
            </button>
          </div>
        </div>

        {error && <div style={{background:"rgba(244,63,94,.08)",border:"1px solid rgba(244,63,94,.25)",borderRadius:12,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#F43F5E",fontFamily:"'DM Sans',sans-serif"}}>⚠ {error}</div>}

        {/* ════ OVERVIEW ════ */}
        {activeNav===0 && <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
            {[
              {label:"Weekly Distance",value:stats?`${(stats.recent_run_totals?.distance/1000).toFixed(1)}`:"52.9",unit:"km",color:T.primary,change:"+14%"},
              {label:"Active Time",value:stats?fmtTime(stats.recent_run_totals?.moving_time??0):"5:38",unit:"hr",color:T.cyan,change:"+8%"},
              {label:"Calories",value:"3,241",unit:"kcal",color:T.lime,change:"+11%"},
              {label:"Elevation",value:stats?`${stats.recent_run_totals?.elevation_gain?.toFixed(0)??612}`:"612",unit:"m",color:T.rose,change:"+3%"},
            ].map((s,i)=>(
              <div key={i} style={{...CARD,padding:"20px 18px"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,fontWeight:600,letterSpacing:.5,marginBottom:8}}>{s.label.toUpperCase()}</div>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:40,color:s.color,lineHeight:1}}>
                  {s.value}<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,color:T.muted,fontWeight:400,marginLeft:3}}>{s.unit}</span>
                </div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.lime,fontWeight:600,marginTop:8}}>{s.change} this week</div>
              </div>
            ))}
          </div>

          <div style={{...CARD,padding:"22px 20px 14px",marginBottom:20}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:4,color:T.text}}>Monthly Trend</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginBottom:16}}>Actual vs target — last 12 months</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={MOCK_MONTHLY}>
                <defs>
                  <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.primary} stopOpacity={dark?.35:.2}/>
                    <stop offset="100%" stopColor={T.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.muted} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={T.muted} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" tick={{fill:T.muted,fontSize:10,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip content={<MonthlyTip/>}/>
                <Area type="monotone" dataKey="target" stroke={T.muted} strokeWidth={1.5} fill="url(#tG)" strokeDasharray="5 4" dot={false}/>
                <Area type="monotone" dataKey="km" stroke={T.primary} strokeWidth={2.5} fill="url(#aG)" dot={false} activeDot={{r:4,fill:T.primary}}/>
              </AreaChart>
            </ResponsiveContainer>
            <div style={{display:"flex",gap:20,marginTop:8,paddingLeft:4}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:20,height:2,background:T.primary,borderRadius:1}}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted}}>Actual</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:20,height:0,borderTop:`2px dashed ${T.muted}`,opacity:.6}}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted}}>Target</span></div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
            <div style={{...CARD,padding:"22px 16px"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:4,color:T.text}}>Weekly Goals</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginBottom:18}}>Progress to targets</div>
              <div style={{display:"flex",justifyContent:"space-around"}}>
                <Ring pct={66} color={T.primary} T={T} center={["52.9","KM"]} label="Distance"/>
                <Ring pct={74} color={T.cyan} T={T} center={["5.6","HR"]} label="Active Time"/>
                <Ring pct={81} color={T.lime} T={T} center={["81","PCT"]} label="Calories"/>
              </div>
            </div>
            <div style={{...CARD,padding:"22px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:4,color:T.text,width:"100%"}}>VO₂ Max</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginBottom:12,width:"100%"}}>Estimated from runs</div>
              <VO2Gauge value={52} T={T}/>
            </div>
            <div style={{...CARD,padding:"22px 20px 14px"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:4,color:T.text}}>Week vs Week</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginBottom:16}}>This vs last week</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={MOCK_WEEKLY} barSize={9} barGap={2}>
                  <XAxis dataKey="d" tick={{fill:T.muted,fontSize:10,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Bar dataKey="km" fill={T.primary} radius={[4,4,0,0]}/>
                  <Bar dataKey="prev" fill={T.muted} radius={[4,4,0,0]} opacity={.45}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{...CARD,padding:"20px 22px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:T.text}}>Personal Bests</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted}}>All time records</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {MOCK_PBS.map((pb,i)=>(
                <div key={i} style={{background:T.faint,borderRadius:14,padding:"16px 18px",border:`1px solid ${i===0?T.primary:T.border}`,position:"relative",overflow:"hidden"}}>
                  {i===0&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${T.primary},${T.cyan})`}}/>}
                  <div style={{fontSize:22}}>{pb.badge}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:T.muted,marginTop:8}}>{pb.l}</div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:30,color:i===0?T.pLight:T.text,lineHeight:1,marginTop:4}}>{pb.v}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,marginTop:4}}>{pb.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:T.text}}>Recent Activities</div>
              <button onClick={()=>setActiveNav(1)} style={{background:T.card,border:`1px solid ${T.border}`,outline:"none",borderRadius:8,color:T.muted,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>View All →</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              {allActs.slice(0,3).map((a,i)=><ActivityCard key={a.id} a={a} color={actColors[i%5]} T={T} dark={dark}/>)}
            </div>
          </div>
        </>}

        {/* ════ ACTIVITIES ════ */}
        {activeNav===1 && <>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:T.text,marginBottom:6}}>All Activities</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.muted,marginBottom:24}}>{allActs.length} runs synced from Strava</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {allActs.map((a,i)=><ActivityCard key={a.id} a={a} color={actColors[i%5]} T={T} dark={dark}/>)}
          </div>
        </>}

        {/* ════ PROGRESS ════ */}
        {activeNav===2 && <>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:T.text,marginBottom:24}}>Progress</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
            <div style={{...CARD,padding:"22px 20px 14px"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:4,color:T.text}}>Monthly Distance</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginBottom:16}}>Actual vs target</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={MOCK_MONTHLY}>
                  <defs>
                    <linearGradient id="aG2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.primary} stopOpacity={dark?.35:.2}/>
                      <stop offset="100%" stopColor={T.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{fill:T.muted,fontSize:10,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip content={<MonthlyTip/>}/>
                  <Area type="monotone" dataKey="target" stroke={T.muted} strokeWidth={1.5} fill="none" strokeDasharray="5 4" dot={false}/>
                  <Area type="monotone" dataKey="km" stroke={T.primary} strokeWidth={2.5} fill="url(#aG2)" dot={false} activeDot={{r:4,fill:T.primary}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{...CARD,padding:"22px 20px 14px"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:4,color:T.text}}>Weekly Breakdown</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginBottom:16}}>This week vs last week</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={MOCK_WEEKLY} barSize={12} barGap={3}>
                  <XAxis dataKey="d" tick={{fill:T.muted,fontSize:10,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Bar dataKey="km" fill={T.primary} radius={[4,4,0,0]}/>
                  <Bar dataKey="prev" fill={T.muted} radius={[4,4,0,0]} opacity={.4}/>
                </BarChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:16,marginTop:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:3,background:T.primary}}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted}}>This week</span></div>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:3,background:T.muted,opacity:.6}}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted}}>Last week</span></div>
              </div>
            </div>
          </div>
          <div style={{...CARD,padding:"20px 22px"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:T.text,marginBottom:16}}>Personal Bests</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {MOCK_PBS.map((pb,i)=>(
                <div key={i} style={{background:T.faint,borderRadius:14,padding:"16px 18px",border:`1px solid ${i===0?T.primary:T.border}`,position:"relative",overflow:"hidden"}}>
                  {i===0&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${T.primary},${T.cyan})`}}/>}
                  <div style={{fontSize:22}}>{pb.badge}</div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:T.muted,marginTop:8}}>{pb.l}</div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:30,color:i===0?T.pLight:T.text,lineHeight:1,marginTop:4}}>{pb.v}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,marginTop:4}}>{pb.d}</div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* ════ HEALTH ════ */}
        {activeNav===3 && <>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:T.text,marginBottom:24}}>Health</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
            <div style={{...CARD,padding:"22px 20px 14px"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:4,color:T.text}}>Heart Rate</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginBottom:16}}>Last run — bpm over time</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={MOCK_HR}>
                  <defs>
                    <linearGradient id="hrG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={T.rose} stopOpacity={dark?.35:.2}/>
                      <stop offset="100%" stopColor={T.rose} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{fill:T.muted,fontSize:10,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[60,200]} tick={{fill:T.muted,fontSize:9,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false} width={30}/>
                  <Tooltip content={<HRTip/>}/>
                  <Area type="monotone" dataKey="bpm" stroke={T.rose} strokeWidth={2} fill="url(#hrG)" dot={false} activeDot={{r:4,fill:T.rose}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{...CARD,padding:"22px 16px",display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,marginBottom:4,color:T.text,width:"100%"}}>VO₂ Max</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,marginBottom:16,width:"100%"}}>Estimated from last 10 runs</div>
              <VO2Gauge value={52} T={T}/>
              <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%"}}>
                {[{l:"Max HR",v:"187 bpm"},{l:"Avg HR",v:"162 bpm"},{l:"Resting HR",v:"52 bpm"},{l:"HRV",v:"68 ms"}].map((s,i)=>(
                  <div key={i} style={{background:T.faint,borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,marginBottom:2}}>{s.l}</div>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,color:T.text}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{...CARD,padding:"20px 22px"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:T.text,marginBottom:16}}>Heart Rate Zones</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {HR_ZONES.map((z,i)=>(
                <div key={i}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:z.color,flexShrink:0}}/>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:T.text}}>{z.zone}</span>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted}}>{z.label}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted}}>{z.range}</span>
                      <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:z.color,width:36,textAlign:"right"}}>{z.pct}%</span>
                    </div>
                  </div>
                  <div style={{height:6,background:T.faint,borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${z.pct}%`,background:z.color,borderRadius:999,transition:"width 1s ease"}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* ════ GEAR ════ */}
        {activeNav===4 && <>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:T.text,marginBottom:6}}>Gear</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.muted,marginBottom:24}}>
            Your equipment tracked on Strava
          </div>
          {allGear.length === 0 ? (
            <div style={{...CARD,padding:"48px",textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:16}}>👟</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:T.text,marginBottom:8}}>No gear found</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.muted,lineHeight:1.7,maxWidth:340,margin:"0 auto"}}>
                Add your shoes or bike on Strava under <strong>Settings → My Gear</strong> and they'll appear here with full mileage tracking.
              </div>
              <button onClick={()=>window.open("https://www.strava.com/settings/gear","_blank")}
                style={{marginTop:24,background:T.primary,border:"none",outline:"none",borderRadius:10,color:"#fff",padding:"11px 28px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                Add Gear on Strava ↗
              </button>
            </div>
          ) : (
            <>
              {shoes.length > 0 && (
                <>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,fontWeight:700,letterSpacing:1.5,marginBottom:12}}>SHOES</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
                    {shoes.map((s,i)=><GearCard key={s.id??i} item={s} icon="👟" maxKm={800} T={T}/>)}
                  </div>
                </>
              )}
              {bikes.length > 0 && (
                <>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.muted,fontWeight:700,letterSpacing:1.5,marginBottom:12}}>BIKES</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                    {bikes.map((b,i)=><GearCard key={b.id??i} item={b} icon="🚴" maxKm={10000} T={T}/>)}
                  </div>
                </>
              )}
            </>
          )}
        </>}

        {/* ════ LEADERBOARD ════ */}
        {activeNav===5 && (
  <LeaderboardSection
    stats={stats}
    activities={allActs}
    T={T}
    CARD={CARD}
  />
)}

        <div style={{marginTop:28,textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:10,color:T.muted,letterSpacing:1,opacity:.5}}>
          KINŌ · Open Source · MIT License · Powered by Strava API
        </div>
      </div>
    </div>
  );
}