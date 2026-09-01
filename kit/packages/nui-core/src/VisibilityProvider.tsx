import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNuiEvent } from './useNuiEvent';
import { isEnvBrowser } from './isEnvBrowser';

interface VisibilityContextValue {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

const VisibilityContext = createContext<VisibilityContextValue>({
  visible: true,
  setVisible: () => {},
});

export const useVisibility = () => useContext(VisibilityContext);

/**
 * Wraps the app: shows/hides in response to the "setVisible" event
 * sent by Lua, and closes with ESC (standard FiveM NUI behavior).
 * In the browser it's always visible by default, so you can work without
 * having to simulate anything to see the UI.
 */
export function VisibilityProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState<boolean>(isEnvBrowser() ? true : false);

  useNuiEvent<boolean>('setVisible', (v) => setVisible(v));

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        setVisible(false);
      }
    },
    [visible]
  );

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [handleKeyUp]);

  if (!visible) return null;

  return (
    <VisibilityContext.Provider value={{ visible, setVisible }}>
      {children}
    </VisibilityContext.Provider>
  );
}
