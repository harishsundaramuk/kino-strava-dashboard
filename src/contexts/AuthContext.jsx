import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  loadTokens,
  clearTokens,
  isAuthenticated,
  getAthlete,
} from "@/lib/strava";

// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [athlete, setAthlete]   = useState(null);   // Strava athlete object
  const [loading, setLoading]   = useState(true);   // initial auth check
  const [error,   setError]     = useState(null);

  /** Called after successful OAuth exchange (from CallbackPage). */
  const onAuthSuccess = useCallback(async (tokens) => {
    // tokens.athlete comes with the exchange response
    if (tokens?.athlete) {
      setAthlete(tokens.athlete);
    } else {
      // Fallback — fetch separately
      try {
        const a = await getAthlete();
        setAthlete(a);
      } catch (e) {
        setError(e.message);
      }
    }
  }, []);

  /** Logout — clear everything */
  const logout = useCallback(() => {
    clearTokens();
    setAthlete(null);
  }, []);

  // On mount: restore session if tokens present
  useEffect(() => {
    const boot = async () => {
      if (isAuthenticated()) {
        try {
          const stored = loadTokens();
          // Prefer cached athlete to avoid an extra API call on page load
          if (stored?.athlete) {
            setAthlete(stored.athlete);
          } else {
            const a = await getAthlete();
            setAthlete(a);
          }
        } catch (e) {
          // Token likely invalid / revoked
          clearTokens();
          setError(e.message);
        }
      }
      setLoading(false);
    };

    boot();
  }, []);

  const value = {
    athlete,
    loading,
    error,
    isLoggedIn: !!athlete,
    onAuthSuccess,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook — use anywhere inside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
