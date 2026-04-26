# KINŌ — Strava Health Dashboard

> Open-source analytics dashboard for your Strava activities.
> Beautiful dark/light UI, 52-week heatmap, VO₂ Max, heart rate zones, pace analysis.

![KINŌ brand color](https://img.shields.io/badge/KINŌ-%23E8603E?style=flat-square&logo=strava&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)

---

## Features

- **Strava OAuth 2.0** login with auto token refresh
- **52-week activity heatmap** (GitHub-style, with km on hover)
- **4 stat cards**: weekly km · active time · calories · elevation
- **Monthly trend area chart** (actual vs target)
- **Weekly goal rings**: distance, time, calories
- **VO₂ Max semicircle gauge**
- **Heart rate area chart** with zone breakdown
- **Pace distribution** bars
- **Week vs week** comparison bar chart
- **Personal bests**: 5K, 10K, Half Marathon, Full Marathon
- **Recent activities** feed
- **Dark / Light mode** with full token system (system preference aware)
- **Collapsible sidebar**

---

## Tech Stack

| Layer         | Choice                          |
| ------------- | ------------------------------- |
| Framework     | React 18 + Vite 5               |
| Routing       | React Router v6                 |
| Charts        | Recharts                        |
| Auth          | Strava OAuth 2.0                |
| Styling       | Inline styles + CSS keyframes   |
| Fonts         | Syne · DM Sans · Bebas Neue     |
| License       | MIT                             |

---

## Roadmap

- [ ] Chrome Extension (Manifest V3, PKCE flow)
- [ ] Safari Extension (via Xcode)
- [ ] React Native / Expo mobile app
- [ ] Serverless backend for token exchange (Vercel Edge)
- [ ] More sports: cycling, swimming, hiking

---

## Quick Start

### 1. Register your Strava App

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create a new application
3. Set **Authorization Callback Domain** to `localhost`
4. Copy your **Client ID** and **Client Secret**

### 2. Clone & install

```bash
git clone https://github.com/your-username/kino-strava-dashboard.git
cd kino-strava-dashboard
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_STRAVA_CLIENT_SECRET=your_client_secret
VITE_STRAVA_REDIRECT_URI=http://localhost:3000/callback
```

> ⚠️ **Security note**: The client secret is exposed in the browser for the MVP.
> Before shipping publicly, proxy the token exchange through a serverless function
> (e.g. Vercel Edge Functions, Cloudflare Workers) so the secret never touches
> the client bundle.

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
kino/
├── index.html
├── vite.config.js
├── .env.example
├── src/
│   ├── main.jsx                 # React entry
│   ├── App.jsx                  # Router + providers
│   ├── tokens/
│   │   └── theme.js             # DARK / LIGHT design tokens
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Global auth state
│   │   └── ThemeContext.jsx     # Dark/light theme
│   ├── lib/
│   │   └── strava.js            # OAuth + API client
│   ├── hooks/
│   │   └── useStrava.js         # Data fetching hook
│   ├── pages/
│   │   ├── LoginPage.jsx        # OAuth entry screen
│   │   ├── CallbackPage.jsx     # OAuth callback handler
│   │   └── DashboardPage.jsx    # Route guard + data layer
│   └── components/
│       └── KinoDashboard.jsx    # Full dashboard UI
```

---

## Strava API Endpoints Used

| Endpoint                         | Purpose                  |
| -------------------------------- | ------------------------ |
| `GET /athlete`                   | Profile + bio            |
| `GET /athlete/activities`        | Activity feed            |
| `GET /athletes/:id/stats`        | Totals (YTD + all-time)  |
| `GET /activities/:id/streams`    | HR + pace data per run   |

**Free tier limits**: 100 requests / 15 min · 1 000 / day

---

## Chrome Extension (next phase)

The extension will use **PKCE** (Proof Key for Code Exchange) so no client
secret is embedded. The flow:

1. Generate `code_verifier` + `code_challenge` (SHA-256)
2. Open Strava OAuth with `code_challenge` in the URL
3. Exchange code + `code_verifier` for tokens (no secret needed)

---

## Contributing

PRs welcome! Please open an issue first for large changes.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push + open a PR

---

## License

[MIT](LICENSE) © 2026 KINŌ Contributors
