import React, { useState } from 'react';
import { simulateNuiMessage } from './useNuiEvent';

interface ScenarioAction {
  label: string;
  action: string;
  data: unknown;
}

interface DevPanelProps {
  scenarios: ScenarioAction[];
}

/**
 * Simulation panel — include it ONLY in dev:
 *   {import.meta.env.DEV && <DevPanel scenarios={[...]} />}
 *
 * Each button simulates a real SendNUIMessage that Lua would send in-game,
 * so you can test flows (open panel, update data, etc.) without
 * touching the game.
 */
export function DevPanel({ scenarios }: DevPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 9999,
        background: '#111827',
        color: '#f9fafb',
        borderRadius: 10,
        padding: open ? 12 : 8,
        fontFamily: 'monospace',
        fontSize: 12,
        maxWidth: 260,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <strong>Dev Panel</strong>
        <span>{open ? '−' : '+'}</span>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {scenarios.map((s) => (
            <button
              key={s.label}
              onClick={() => simulateNuiMessage(s.action, s.data)}
              style={{
                background: '#374151',
                color: '#f9fafb',
                border: 'none',
                borderRadius: 6,
                padding: '6px 8px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
