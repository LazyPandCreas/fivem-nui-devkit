// True when we're in a normal browser tab (Vite dev), false when
// we're inside the FiveM CEF client, where this native always exists.
export function isEnvBrowser(): boolean {
  return !(window as any).invokeNative;
}
