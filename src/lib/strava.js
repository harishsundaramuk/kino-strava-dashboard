// ─────────────────────────────────────────────────────────────────────────────
// KINŌ — Strava OAuth 2.0 + API Client
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_ID     = import.meta.env.VITE_STRAVA_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
const REDIRECT_URI  = import.meta.env.VITE_STRAVA_REDIRECT_URI ?? "http://localhost:3000/callback";
const API_BASE      = import.meta.env.VITE_STRAVA_API_BASE ?? "https://www.strava.com/api/v3";
const STORAGE_KEY   = "kino_strava_tokens";

// ── Token storage ─────────────────────────────────────────────────────────────
export function saveTokens(tokens) { localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens)); }
export function loadTokens() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
export function clearTokens() { localStorage.removeItem(STORAGE_KEY); }
export function isAuthenticated() { const t = loadTokens(); return !!t?.access_token && t.expires_at * 1000 > Date.now() + 60_000; }

// ── OAuth ─────────────────────────────────────────────────────────────────────
export function buildAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all,profile:read_all",
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

export async function exchangeCode(code) {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, grant_type: "authorization_code" }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message ?? `Token exchange failed: ${res.status}`); }
  const tokens = await res.json();
  saveTokens(tokens);
  return tokens;
}

export async function refreshAccessToken() {
  const stored = loadTokens();
  if (!stored?.refresh_token) throw new Error("No refresh token stored.");
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: stored.refresh_token, grant_type: "refresh_token" }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const tokens = await res.json();
  saveTokens({ ...stored, ...tokens });
  return tokens.access_token;
}

// ── Core fetch ────────────────────────────────────────────────────────────────
async function apiFetch(path, params = {}) {
  let { access_token, expires_at } = loadTokens() ?? {};
  if (!access_token || expires_at * 1000 < Date.now() + 60_000) {
    access_token = await refreshAccessToken();
  }
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message ?? `API error ${res.status} on ${path}`); }
  return res.json();
}

// ── Standard endpoints ────────────────────────────────────────────────────────
export const getAthlete        = ()          => apiFetch("/athlete");
export const getActivities     = (opts = {}) => apiFetch("/athlete/activities", { per_page: 30, page: 1, ...opts });
export const getAthleteStats   = (id)        => apiFetch(`/athletes/${id}/stats`);
export const getActivityStreams = (id, keys = ["heartrate","velocity_smooth","distance"]) =>
  apiFetch(`/activities/${id}/streams`, { keys: keys.join(","), key_by_type: true });
export const getActivity = (id) => apiFetch(`/activities/${id}`);

// ── Leaderboard endpoints ─────────────────────────────────────────────────────

/**
 * GET /segments/starred — athlete's starred segments
 */
export const getStarredSegments = () => apiFetch("/segments/starred");

/**
 * GET /segments/{id}/leaderboard
 * @param {number} id       - segment ID
 * @param {object} opts     - { per_page, page, gender, age_group, weight_class, following, club_id, date_range }
 * Paid tier unlocks: gender, age_group, weight_class filters + full leaderboard
 */
export const getSegmentLeaderboard = (id, opts = {}) =>
  apiFetch(`/segments/${id}/leaderboard`, { per_page: 10, ...opts });

/**
 * GET /athlete/clubs — clubs the athlete is a member of
 */
export const getClubs = () => apiFetch("/athlete/clubs");

/**
 * GET /clubs/{id}/leaderboard — weekly club leaderboard
 * @param {number} id - club ID
 */
export const getClubLeaderboard = (id) => apiFetch(`/clubs/${id}/leaderboard`);

/**
 * GET /clubs/{id}/activities — recent club activity feed
 */
export const getClubActivities = (id, opts = {}) =>
  apiFetch(`/clubs/${id}/activities`, { per_page: 10, ...opts });