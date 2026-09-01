import { useState } from 'react';
import { fetchNui, useNuiEvent, VisibilityProvider, DevPanel } from '@devkit/nui-core';
import { Button } from '@devkit/ui-kit';

interface PlayerData {
  name: string;
  money: number;
  job: string;
}

// This component works IDENTICALLY in three different contexts, without
// changing a single line: browser mock, browser+bridge (real Lua/DB), in-game.
// Only VITE_NUI_MODE in the .env file changes — see docs/FRONTEND-BACKEND-EVENTS.md
export default function App() {
  const [player, setPlayer] = useState<PlayerData | null>(null);

  // Receives data "pushed" from Lua (SendNUIMessage) or simulated by DevPanel.
  useNuiEvent<PlayerData>('updatePlayer', (data) => setPlayer(data));

  const loadPlayer = async () => {
    const data = await fetchNui<PlayerData>('getPlayerData');
    setPlayer(data);
  };

  const buyItem = async () => {
    const result = await fetchNui<{ ok: boolean; newBalance: number }>('buyItem', {
      itemId: 'water',
      price: 10,
    });
    if (result.ok && player) {
      setPlayer({ ...player, money: result.newBalance });
    }
  };

  return (
    <VisibilityProvider>
      <div className="p-4 text-slate-100 w-64 bg-slate-900/80 rounded-lg m-4">
        <h1 className="text-lg font-bold mb-2">Example HUD</h1>
        {player ? (
          <div className="space-y-1 text-sm mb-3">
            <div>Name: {player.name}</div>
            <div>Money: €{player.money}</div>
            <div>Job: {player.job}</div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 mb-3">No data loaded.</p>
        )}
        <div className="flex gap-2">
          <Button onClick={loadPlayer}>Load Data</Button>
          <Button variant="secondary" onClick={buyItem}>
            Buy Water
          </Button>
        </div>
      </div>

      {import.meta.env.DEV && (
        <DevPanel
          scenarios={[
            {
              label: 'Simulate updatePlayer',
              action: 'updatePlayer',
              data: { name: 'John Green', money: 999, job: 'mechanic' },
            },
            { label: 'Simulate setVisible(false)', action: 'setVisible', data: false },
          ]}
        />
      )}
    </VisibilityProvider>
  );
}
