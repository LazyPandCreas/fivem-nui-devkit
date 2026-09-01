# How Frontend (React) and Backend (Lua) Communicate

This guide explains the pattern to follow when adding a new end-to-end action:
from the button clicked in the UI to the database query, and back. If you follow
this schema for every new feature, the code stays testable across all three modes
(mock, bridge, in-game) without modifications.

## Two Communication Channels

FiveM NUI uses **two separate and independent channels**. Not confusing them is
the key to understanding everything else:

1. **Frontend → Backend** (request): the frontend calls `fetchNui('action', data)`.
   This generates a `fetch()` to `https://<resource>/action`, which FiveM automatically
   routes to the corresponding `RegisterNUICallback('action', ...)`
   on the client side Lua. It's **always a request-response**:
   the frontend waits for a response (the Lua `cb()`).

2. **Backend → Frontend** (push): Lua calls `SendNUIMessage({ action = ..., data = ... })`
   at any time, even without the frontend asking for anything
   (e.g., "your money has changed"). The frontend intercepts it with
   `useNuiEvent('action', callback)`. There's no response: it's a message
   "fired" into the UI.

```
FRONTEND (React)                         BACKEND (Lua)
──────────────────                       ──────────────
fetchNui('getPlayerData')  ────POST────▶  RegisterNUICallback('getPlayerData')
                                              │
                                              ▼
                            ◀───cb(result)─── TriggerServerEvent → Actions.getPlayerData() → DB
useNuiEvent('updatePlayer') ◀────push─────  SendNUIMessage({ action = 'updatePlayer', ... })
```

## Naming Convention (very important)

Use **exactly the same name** in three places:

| Where | Example |
|---|---|
| Frontend: `fetchNui(...)` | `fetchNui('getPlayerData')` |
| Frontend mock: `mockData.ts` | `getPlayerData: () => ({...})` |
| Lua client: `RegisterNUICallback(...)` | `RegisterNUICallback('getPlayerData', ...)` |
| Lua logic: `Actions.*` | `Actions.getPlayerData = function(...)` |

If these four names don't match exactly, the call silently fails —
it's the most common error when working with these interfaces. For push events
(`SendNUIMessage` / `useNuiEvent`) the same rule applies.

## The "Single Source of Truth" Principle (`Actions.*`)

The central point of this devkit is `resources/bridge/server/actions.lua`.
**Never write business logic inside `RegisterServerEvent` or
inside the bridge HTTP handler.** Write it once in `Actions`, with this fixed signature:

```lua
Actions.actionName = function(source, payload)
    -- ... DB queries, calculations, etc ...
    return { something = "result" }
end
```

Both the normal in-game flow (`server/events.lua`) and the development bridge
(`server/bridge.lua`) call `Actions[actionName](source, payload)`.
This guarantees that when you test in bridge mode, you're **really**
executing the same code that will run in production — not a simplified copy.

## Step-by-Step Guide: Adding a New Action

Example: you want to add `sellItem`, which sells an object and updates money.

**1. Logic in `Actions` (once only)**
```lua
-- resources/bridge/server/actions.lua
Actions.sellItem = function(source, payload)
    local price = payload.price or 0
    MySQL.update.await('UPDATE players SET money = money + ? WHERE id = ?', { price, source })
    local result = MySQL.query.await('SELECT money FROM players WHERE id = ?', { source })
    return { ok = true, newBalance = result[1].money }
end
```

**2. NUI callback on the client** (in your real interface resource,
following the pattern of `client/example_client.lua`)
```lua
RegisterNUICallback('sellItem', function(data, cb)
    requestCounter = requestCounter + 1
    local requestId = requestCounter
    pendingRequests[requestId] = cb
    TriggerServerEvent('bridge:action', 'sellItem', data, requestId)
end)
```

**3. Mock for pure browser development**
```ts
// packages/nui-core/src/mockData.ts
sellItem: (payload) => ({ ok: true, newBalance: 4200 + (payload?.price ?? 0) }),
```

**4. Call from the frontend**
```ts
const result = await fetchNui<{ ok: boolean; newBalance: number }>('sellItem', {
  itemId: 'gold_watch',
  price: 250,
});
```

Done: the same `fetchNui('sellItem', ...)` call now works in all
three modes, without ever touching `App.tsx` again when you switch modes.

## What About Data That Arrives WITHOUT an Explicit Request?

Example: another player robs you and your money changes while the UI
is already open. There's no `fetchNui` triggering anything here — it's the server
that decides to notify the UI on its own:

```lua
-- from anywhere in the server code, when needed
TriggerClientEvent('bridge:pushToNui', targetSource, 'updatePlayer', { money = newAmount })
```
```lua
-- on the client, a single generic handler for pushes
RegisterNetEvent('bridge:pushToNui')
AddEventHandler('bridge:pushToNui', function(action, data)
    SendNUIMessage({ action = action, data = data })
end)
```
```ts
// on the frontend, in any component
useNuiEvent<{ money: number }>('updatePlayer', (data) => setMoney(data.money));
```

In dev, you can simulate exactly this scenario with the `DevPanel` (which
calls `simulateNuiMessage`, the exact same function that triggers
`useNuiEvent` — so the behavior is indistinguishable from a real Lua push).

## Common Mistakes to Avoid

- **Names that don't match** between `fetchNui`, `RegisterNUICallback` and `Actions` — see table above.
- **Business logic duplicated** inside `events.lua` instead of in `Actions` — loses the main advantage of the bridge.
- **Forgetting `SetVisible`/`setVisible` on the client**: `VisibilityProvider` reacts to the `setVisible` event, but the native `SetNuiFocus(true, true)` still needs to be called in Lua when you open the interface, otherwise the mouse won't work in game (this aspect cannot be simulated from the browser, only verify at level 4 — in-game testing).
- **Non-serializable payloads**: `SendNUIMessage`/`fetchNui` always go through JSON — no functions, no circular references in the data you exchange.
