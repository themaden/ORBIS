// Basit tema yönetimi: koyu (varsayılan) / açık.
// `html.light` sınıfı eklenince index.css'teki açık tema kuralları devreye girer.
const SETTINGS_KEY = "orbis.settings";

export function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("light", !dark);
}

// Uygulama açılışında kayıtlı tercihi uygula (varsayılan: koyu)
export function initTheme() {
  let dark = true;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) dark = JSON.parse(saved).dark !== false;
  } catch {
    /* yok say */
  }
  applyTheme(dark);
}
