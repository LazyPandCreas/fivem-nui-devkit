import { useEffect, useRef } from 'react';

interface NuiMessageEvent<T = any> {
  action: string;
  data: T;
}

/**
 * Listens to messages that Lua sends to the UI with SendNUIMessage.
 * In dev, it also listens to messages simulated by DevPanel (which uses
 * the exact same channel: window.postMessage).
 */
export function useNuiEvent<T = any>(
  action: string,
  handler: (data: T) => void
) {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    const listener = (event: MessageEvent<NuiMessageEvent<T>>) => {
      const { action: eventAction, data } = event.data ?? {};
      if (eventAction === action) {
        savedHandler.current(data);
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [action]);
}

// Used by DevPanel to simulate a SendNUIMessage without the game.
export function simulateNuiMessage<T = any>(action: string, data: T) {
  window.postMessage({ action, data }, '*');
}
