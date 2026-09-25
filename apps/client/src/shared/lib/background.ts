import { useEffect, useState } from "react";

/** Фоны кабинета. Выбор живёт на устройстве — это оформление, а не данные аккаунта. */
export const BACKGROUNDS = [
  { id: "milk", label: "Молочный", swatch: "#f4efed" },
  { id: "white", label: "Белый", swatch: "#fcf9f9" },
  { id: "peach", label: "Персиковый", swatch: "linear-gradient(160deg,#ffd9bf,#fff3ea)" },
  {
    id: "glow",
    label: "Стекло",
    swatch:
      "radial-gradient(90% 70% at 85% 10%,#ffb48f,transparent),radial-gradient(80% 70% at 0% 60%,#ffd29a,transparent),#fcf9f9",
  },
  { id: "graphite", label: "Графит", swatch: "#262323" },
] as const;

export type BackgroundId = (typeof BACKGROUNDS)[number]["id"];

const KEY = "loal.client.bg";
const DEFAULT: BackgroundId = "milk";

function read(): BackgroundId {
  try {
    const value = localStorage.getItem(KEY);
    return BACKGROUNDS.some((item) => item.id === value) ? (value as BackgroundId) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Ставит фон на <html> — вызывается до первой отрисовки, чтобы экран не мигал. */
export function applyStoredBackground() {
  document.documentElement.dataset.bg = read();
}

export function useBackground() {
  const [background, setBackground] = useState<BackgroundId>(read);
  useEffect(() => {
    document.documentElement.dataset.bg = background;
    try {
      localStorage.setItem(KEY, background);
    } catch {
      /* приватный режим — фон просто не запомнится */
    }
  }, [background]);
  return [background, setBackground] as const;
}
