import { createContext, useContext, useState, useEffect } from "react";
import { DARK, LIGHT, GOOGLE_FONTS_URL } from "@/tokens/theme";

const ThemeContext = createContext(null);

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { overflow-x: hidden; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  @keyframes fadeUp   { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes shimmer  { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
  @keyframes glow     { 0%,100% { box-shadow: 0 0 12px #E8603E40 } 50% { box-shadow: 0 0 26px #E8603E70 } }
  @keyframes spin     { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  .hov { transition: transform .18s ease, box-shadow .18s ease; cursor: pointer; }
  .hov:hover { transform: translateY(-2px); }
`;

function buildStyleSheet(scrollbarColor) {
  return (
    `@import url('${GOOGLE_FONTS_URL}');` +
    BASE_CSS +
    `::-webkit-scrollbar-thumb { background: ${scrollbarColor}; border-radius: 2px; }`
  );
}

function getSystemPreference() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("kino_theme");
    if (saved !== null) return saved === "dark";
    return false; // Default to light
  });

  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    let el = document.getElementById("kino-base-styles");
    if (!el) {
      el = document.createElement("style");
      el.id = "kino-base-styles";
      document.head.appendChild(el);
    }
    el.textContent = buildStyleSheet(T.scrollbar);

    // Apply theme to body
    document.body.style.background  = T.bg;
    document.body.style.color       = T.text;
    document.body.style.fontFamily  = "'DM Sans', sans-serif";
    document.body.style.transition  = "background .3s ease, color .3s ease";

    localStorage.setItem("kino_theme", dark ? "dark" : "light");
  }, [dark, T]);

  const toggle = () => setDark(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle, T }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}