import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { buildAuthUrl } from "@/lib/strava";

function KinoMark({ size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.26, background: "#E8603E", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(232,96,62,.45)", flexShrink: 0 }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 44 44" fill="none">
        <polygon points="6,4 14,4 26,16 18,16" fill="white" />
        <polygon points="6,40 14,40 26,28 18,28" fill="white" />
        <rect x="29" y="4" width="9" height="36" rx="1.5" fill="white" />
      </svg>
    </div>
  );
}

function StravaIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}

function StatPill({ value, label, delay = 0, T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, animation: `fadeUp .55s ${delay}s ease both`, opacity: 0 }}>
      <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: "#E8603E", lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: T.muted, letterSpacing: 1.5, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function MiniHeatmap() {
  const weeks = 26, days = 7, cells = [];
  let s = 42;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < days; d++) {
      const r = rand();
      let km = 0;
      if (r > 0.62) km = rand() * 12 + 2;
      if (r > 0.90) km = rand() * 8 + 15;
      const alpha = km === 0 ? 0.07 : km < 6 ? 0.28 : km < 12 ? 0.52 : km < 18 ? 0.78 : 1;
      cells.push(<div key={`${w}-${d}`} style={{ width: 8, height: 8, borderRadius: 2, background: `rgba(232,96,62,${alpha})` }} />);
    }
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${weeks}, 8px)`, gridTemplateRows: `repeat(${days}, 8px)`, gap: 3, gridAutoFlow: "column" }}>
      {cells}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { T, dark, toggle: toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => { if (isLoggedIn) navigate("/dashboard", { replace: true }); }, [isLoggedIn, navigate]);
  useEffect(() => { const id = setTimeout(() => setMounted(true), 80); return () => clearTimeout(id); }, []);

  const handleConnect = () => { window.location.href = buildAuthUrl(); };

  const CARD = {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 20,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: dark ? "0 2px 24px rgba(0,0,0,.3)" : "0 2px 20px rgba(0,0,0,.05)",
  };

  const fadeIn = (delay) => ({
    animation: mounted ? `fadeUp .5s ${delay}s ease both` : "none",
    opacity: mounted ? 1 : 0,
  });

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, display: "flex", fontFamily: "'DM Sans', sans-serif", position: "relative", transition: "background .35s ease, color .35s ease" }}>

      {/* Theme toggle */}
      <div onClick={toggleTheme} style={{ position: "fixed", top: 24, right: 24, width: 56, height: 28, borderRadius: 999, background: dark ? "#2A1F1A" : "#E8DDD8", border: `1px solid ${dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)"}`, cursor: "pointer", display: "flex", alignItems: "center", padding: "2px", zIndex: 100, transition: "background .35s ease" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: dark ? "#E8603E" : "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, transform: dark ? "translateX(28px)" : "translateX(0px)", transition: "transform .35s cubic-bezier(.34,1.56,.64,1), background .35s ease" }}>
          {dark ? "🌙" : "☀️"}
        </div>
      </div>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -160, left: -100, width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${T.blob1} 0%, transparent 65%)` }} />
        <div style={{ position: "absolute", bottom: -80, right: -60, width: 440, height: 440, borderRadius: "50%", background: `radial-gradient(circle, ${T.blob2} 0%, transparent 65%)` }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`, backgroundSize: "52px 52px", opacity: dark ? 1 : 0.5 }} />
      </div>

      {/* ══ LEFT PANEL ══ */}
      <div style={{ width: "100%", maxWidth: 460, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 52px", zIndex: 10, position: "relative" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 52, ...fadeIn(0) }}>
          <KinoMark size={44} />
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: 3, color: T.text, lineHeight: 1 }}>KINŌ</div>
            <div style={{ fontSize: 8, color: "#E8603E", fontWeight: 700, letterSpacing: 2.5, marginTop: 5 }}>STRAVA HEALTH DASHBOARD</div>
          </div>
        </div>

        {/* Headline
            FIX: each line is its own display:block span with its own padding.
            This is the only reliable way to prevent descender clipping in CSS. */}
        <div style={{ marginBottom: 24, ...fadeIn(0.07) }}>
          <span style={{ display: "block", fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, color: T.text, letterSpacing: "-1.5px", lineHeight: 1.15, paddingBottom: 2 }}>Your training,</span>
          <span style={{ display: "block", fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, color: "#E8603E", fontStyle: "italic", letterSpacing: "-1.5px", lineHeight: 1.15, paddingBottom: 2 }}>beautifully</span>
          <span style={{ display: "block", fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, color: T.text, letterSpacing: "-1.5px", lineHeight: 1.15, paddingBottom: 10 }}>visualised.</span>
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15.5, color: T.textSub, lineHeight: 1.72, marginBottom: 40, maxWidth: 360, fontWeight: 400, ...fadeIn(0.12) }}>
          Connect your Strava account to unlock real-time analytics — VO₂ Max,
          heart rate zones, weekly trends, and your complete activity history.
        </p>

        {/* CTA */}
        <div style={fadeIn(0.18)}>
          <button onClick={handleConnect} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "16px 28px", background: "#E8603E", border: "none", borderRadius: 14, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "0.2px", boxShadow: hovering ? "0 10px 36px rgba(232,96,62,.55)" : "0 4px 18px rgba(232,96,62,.32)", transform: hovering ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)", transition: "all .22s ease" }}>
            <StravaIcon size={20} />
            Connect with Strava
          </button>
          <p style={{ fontFamily: "'DM Sans', sans-serif", textAlign: "center", fontSize: 11, color: T.muted, marginTop: 14, lineHeight: 1.65 }}>
            Read-only access. We never post, modify, or store your activities.
          </p>
        </div>

        {/* Stat pills */}
        <div style={{ display: "flex", gap: 24, marginTop: 52, paddingTop: 32, borderTop: `1px solid ${T.border}` }}>
          <StatPill value="52W" label="HEATMAP"     delay={0.22} T={T} />
          <StatPill value="7"   label="METRICS"     delay={0.26} T={T} />
          <StatPill value="∞"   label="ACTIVITIES"  delay={0.30} T={T} />
          <StatPill value="MIT" label="OPEN SOURCE" delay={0.34} T={T} />
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", marginTop: "auto", paddingTop: 40, fontSize: 10, color: T.muted, letterSpacing: 0.8 }}>
          KINŌ · Open Source · MIT License · Powered by Strava API
        </p>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "56px 40px", zIndex: 10, gap: 14 }}>

        {/* This Week card */}
        <div style={{ width: "100%", maxWidth: 500, ...CARD, padding: "24px 24px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: T.text }}>This Week</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: T.muted, marginTop: 2 }}>Apr 21 – Apr 27, 2026</div>
            </div>
            <div style={{ background: "rgba(232,96,62,.1)", border: "1px solid rgba(232,96,62,.2)", borderRadius: 20, padding: "4px 12px" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#E8603E", fontWeight: 700 }}>▲ 14% vs last week</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
            {[
              { v: "52.9",  label: "Distance",    color: "#E8603E" },
              { v: "5:38",  label: "Active Time", color: "#FFB347" },
              { v: "3,241", label: "Calories",    color: "#84CC16" },
              { v: "612",   label: "Elevation",   color: "#F43F5E" },
            ].map((s, i) => (
              <div key={i} style={{ background: T.faint, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: s.color, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, color: T.muted, fontWeight: 600, letterSpacing: 1, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>52-WEEK HEATMAP</div>
            <div style={{ overflowX: "auto" }}><MiniHeatmap /></div>
          </div>
        </div>

        {/* Sample Morning Run activity card */}
        <div style={{ width: "100%", maxWidth: 500, ...CARD, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(232,96,62,.12)", border: "1px solid rgba(232,96,62,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏃</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: T.text }}>Morning Run</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: T.muted, marginTop: 2 }}>London · Today 6:30 AM</div>
            </div>
            <div style={{ background: "rgba(232,96,62,.1)", border: "1px solid rgba(232,96,62,.2)", borderRadius: 20, padding: "3px 10px" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: "#E8603E", fontWeight: 700 }}>🏅 PB Pace</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[
              { v: "8.4",  l: "KM",      color: "#E8603E" },
              { v: "5:42", l: "MIN/KM",  color: "#FFB347" },
              { v: "47:58",l: "MOVING",  color: "#84CC16" },
            ].map((s, i) => (
              <div key={i} style={{ background: T.faint, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: s.color, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 8, color: T.muted, fontWeight: 600, letterSpacing: 1, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* VO₂ Max card */}
        <div style={{ width: "100%", maxWidth: 500, ...CARD, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: T.text }}>VO₂ Max estimate</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: T.muted, marginTop: 3 }}>Calculated from your last 10 runs</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: "rgba(132,204,22,.1)", border: "1px solid rgba(132,204,22,.2)", borderRadius: 20, padding: "3px 10px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#84CC16" }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#84CC16", fontWeight: 700 }}>Very Good</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, color: "#FFB347", lineHeight: 1 }}>52</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: T.muted, letterSpacing: 0.5, fontWeight: 600 }}>ML/KG/MIN</span>
          </div>
        </div>

      </div>
    </div>
  );
}