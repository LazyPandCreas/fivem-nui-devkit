import { isEnvBrowser } from './isEnvBrowser';
import { mockData } from './mockData';

type NuiMode = 'mock' | 'bridge';

const resourceName =
  (window as any).GetParentResourceName?.() ?? 'nui-devkit';

function getNuiMode(): NuiMode {
  const mode = (import.meta as any).env?.VITE_NUI_MODE as string | undefined;
  return mode === 'bridge' ? 'bridge' : 'mock';
}

const BRIDGE_URL =
  (import.meta as any).env?.VITE_BRIDGE_URL ?? 'http://localhost:30125';

/**
 * Calls a Lua backend action. It behaves differently depending on
 * where it's running:
 *
 * 1. In-game (real CEF client): makes the real NUI call to
 *    https://<resource>/<action>, which FiveM routes to the corresponding
 *    RegisterNUICallback in Lua.
 * 2. In the browser with VITE_NUI_MODE=bridge: calls the "bridge" resource
 *    on a local headless FXServer — real Lua and DB, without opening the game.
 * 3. In the browser with VITE_NUI_MODE=mock (default): returns fake data
 *    from mockData.ts, zero external dependencies.
 */
export async function fetchNui<T = any>(
  action: string,
  data: unknown = {}
): Promise<T> {
  if (!isEnvBrowser()) {
    const resp = await fetch(`https://${resourceName}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data),
    });
    return resp.json();
  }

  const mode = getNuiMode();

  if (mode === 'bridge') {
    const resp = await fetch(`${BRIDGE_URL}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload: data }),
    });
    if (!resp.ok) {
      throw new Error(`[bridge] errore su "${action}": HTTP ${resp.status}`);
    }
    return resp.json();
  }

  return new Promise<T>((resolve) => {
    setTimeout(() => {
      const handler = mockData[action];
      if (!handler) {
        console.warn(
          `[nui-core] Nessun mock registrato per "${action}" — aggiungilo in mockData.ts`
        );
      }
      resolve((handler ? handler(data) : {}) as T);
    }, 150);
  });
}
