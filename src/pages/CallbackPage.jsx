import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { exchangeCode } from "@/lib/strava";

/**
 * CallbackPage
 *
 * Strava redirects here after the user authorises (or denies) the app.
 * URL will look like:
 *   /callback?code=abc123&scope=read,activity:read_all&state=...
 *   /callback?error=access_denied
 *
 * We exchange the code for tokens and redirect to /dashboard.
 */
export default function CallbackPage() {
  const [params]         = useSearchParams();
  const navigate         = useNavigate();
  const { onAuthSuccess } = useAuth();
  const [status, setStatus] = useState("exchanging"); // "exchanging" | "error"
  const [errMsg, setErrMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    // StrictMode fires effects twice in dev — guard with ref
    if (ran.current) return;
    ran.current = true;

    const error = params.get("error");
    const code  = params.get("code");

    if (error) {
      setStatus("error");
      setErrMsg(
        error === "access_denied"
          ? "You declined the Strava authorisation. Please try again."
          : `Strava returned an error: ${error}`
      );
      return;
    }

    if (!code) {
      setStatus("error");
      setErrMsg("No authorisation code received from Strava.");
      return;
    }

    exchangeCode(code)
      .then((tokens) => {
        onAuthSuccess(tokens);
        navigate("/dashboard", { replace: true });
      })
      .catch((e) => {
        setStatus("error");
        setErrMsg(e.message ?? "Token exchange failed. Check your client secret.");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shared layout ──────────────────────────────────────────────────────────
  const Logo = () => (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 13,
        background: "#E8603E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 20px rgba(232,96,62,.45)",
        marginBottom: 24,
      }}
    >
      <svg width="26" height="26" viewBox="0 0 44 44" fill="none">
        <polygon points="6,4 14,4 26,16 18,16" fill="white" />
        <polygon points="6,40 14,40 26,28 18,28" fill="white" />
        <rect x="29" y="4" width="9" height="36" rx="1.5" fill="white" />
      </svg>
    </div>
  );

  const container = {
    minHeight: "100vh",
    background: "#08050A",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    padding: 24,
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (status === "exchanging") {
    return (
      <div style={container}>
        <Logo />
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid rgba(232,96,62,.2)",
            borderTopColor: "#E8603E",
            animation: "spin .8s linear infinite",
            marginBottom: 20,
          }}
        />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Connecting to Strava…
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>
          Exchanging authorisation tokens
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  return (
    <div style={container}>
      <Logo />
      <div
        style={{
          background: "rgba(244,63,94,.08)",
          border: "1px solid rgba(244,63,94,.25)",
          borderRadius: 14,
          padding: "20px 28px",
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#F43F5E",
            marginBottom: 10,
          }}
        >
          Authorisation Failed
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.6 }}>
          {errMsg}
        </div>
        <button
          onClick={() => navigate("/", { replace: true })}
          style={{
            marginTop: 20,
            background: "#E8603E",
            border: "none",
            borderRadius: 10,
            color: "#fff",
            padding: "10px 24px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
