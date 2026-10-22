/**
 * Страница открыта со старой выкатки, а части её кода на сервере уже новые: Turbopack не находит
 * модуль («module factory is not available», ChunkLoadError). Лечится свежей загрузкой — делаем её
 * сами, но не чаще раза в минуту, чтобы настоящая поломка не крутила перезагрузку по кругу.
 */
const STALE_BUILD = /module factory is not available|ChunkLoadError|Loading chunk [\w-]+ failed|Failed to load chunk/i;
const RELOAD_KEY = "loal.stale-reload";

export function reloadOnStaleBuild(message: unknown) {
  if (!STALE_BUILD.test(String(message ?? ""))) return;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 60_000) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return;
  }
  window.location.reload();
}
