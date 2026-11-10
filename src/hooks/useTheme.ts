import { createLocalStore } from "@/lib/localStore";
import { useEffect } from "react";
import { useLocalStore } from "./useLocalStore";

export type Theme = "light" | "dark";

export const themeStore = createLocalStore<Theme | null>("cc:theme", null, (raw) =>
  raw === "light" || raw === "dark" ? raw : null,
);

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Inline script run before paint, so the page never flashes the wrong theme. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=JSON.parse(localStorage.getItem("cc:theme"));if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t}catch(e){}})();`;

export function useTheme() {
  const saved = useLocalStore(themeStore);
  const theme: Theme = saved ?? (typeof window === "undefined" ? "light" : systemTheme());

  useEffect(() => {
    const root = document.documentElement;
    const t = saved ?? systemTheme();
    root.classList.toggle("dark", t === "dark");
    root.style.colorScheme = t;
  }, [saved]);

  return {
    theme,
    toggle: () => themeStore.set(document.documentElement.classList.contains("dark") ? "light" : "dark"),
  };
}
