# FiveM NUI Devkit

Development environment for FiveM interfaces in React + TypeScript, designed
to never have to restart the game just to see a UI modification, and to be
able to test Lua logic and database without opening FiveM.

## Structure

```
packages/
  nui-core/    shared hooks and utilities (fetchNui, useNuiEvent, mock, dev panel)
  ui-kit/      shared React components (Button, Modal, ...)
apps/
  example-hud/ example app using nui-core + ui-kit
resources/
  bridge/      Lua resource: shared logic (Actions) + development HTTP bridge
docs/
  FRONTEND-BACKEND-EVENTS.md   guide to frontend↔backend communication pattern
scripts/
  watch-restart.js             targeted resource restart via RCON
docker-compose.yml              MariaDB + Adminer for development database
```

## Prerequisites

Install these tools before you start:

| Tool | Minimum Version | Verify Installation |
|---|---|---|
| [Node.js](https://nodejs.org) | 18+ | `node -v` |
| [pnpm](https://pnpm.io/installation) | 8+ | `pnpm -v` (if missing: `npm install -g pnpm`) |
| [Docker](https://www.docker.com/products/docker-desktop/) | any recent version | `docker -v` |
| A local [FXServer](https://runtime.fivem.net/artifacts/fivem/build_server_windows/master/) | recent build | only needed for Levels 3 and 4 |

If a command is not recognized, the installation was not completed correctly
or is not in your `PATH` — reinstall before proceeding.

## Three Development/Testing Levels

| Level | Command | What You Test | Need FXServer? | Need Docker? |
|---|---|---|---|---|
| **1. Mock** | `pnpm dev:hud` | UI only, zero dependencies | No | No |
| **3. Bridge** | `pnpm dev:hud` + `VITE_NUI_MODE=bridge` | Real Lua and DB, without opening the game | Yes (headless) | Yes |
| **4. In-game** | `pnpm build:hud` | Everything, final validation | Yes (with connected client) | Yes |

(Level 2, Lua unit tests with `busted`, is not included in this initial
scaffold — let me know if you need it and I'll add it.)

---

## Initial Setup (do once)

**1. Extract the package and enter the folder**
```bash
cd fivem-nui-devkit
```

**2. Install all monorepo dependencies** (pnpm installs both `packages/*`
and `apps/*` in one shot, thanks to `pnpm-workspace.yaml`)
```bash
pnpm install
```
You should see pnpm download packages and create symbolic links between
`@devkit/nui-core`, `@devkit/ui-kit` and `apps/example-hud` — this is how
the example app "sees" the shared packages without having to publish them
to npm.

**3. (Only if you'll use Level 3) Start the development database**
```bash
pnpm docker:up
```
Verify it started:
```bash
docker ps
```
You should see two active containers: `fivem-devkit-db` and
`fivem-devkit-adminer`. Open `http://localhost:8080` in your browser: it's
Adminer, a web interface to view the database without additional tools. Log in with:
- System: `MySQL`
- Server: `db`
- User: `devkit`
- Password: `devkit`
- Database: `fivem_devkit`

You should already see the `players` table with one test row — it was
created by `db/seed.sql` automatically at first startup.

---

## Level 1 — UI only, in mock (your daily starting point)

**1. Start the dev server**
```bash
pnpm dev:hud
```
You'll see output like:
```
  VITE v5.4.2  ready in 320 ms
  ➜  Local:   http://localhost:5173/
```

**2. Open that address in your browser.** You'll see the example HUD with two
buttons and, in the bottom right, the **Dev Panel**.

**3. Try the request→response flow**: click "Load data" — it calls
`fetchNui('getPlayerData')`, which in mock mode reads from
`packages/nui-core/src/mockData.ts` and returns fake data after ~150ms
(delay simulated on purpose, to get you used to the fact that it's async anyway).

**4. Try the push flow**: click "Simulate updatePlayer" in the Dev Panel.
It's internally calling:
```ts
simulateNuiMessage('updatePlayer', { name: 'John Smith', money: 999, job: 'mechanic' });
```
which is exactly the same function invoked when Lua does
`SendNUIMessage(...)` in game — the UI updates in exactly the same way.

**5. Modify something** — open `apps/example-hud/src/App.tsx`, change a
string or a Tailwind style, save. Vite updates the browser in less than
a second, without manual refresh.

**6. Add a new mock action** — if you're building a feature that doesn't
exist yet on Lua, add it here first to unblock yourself immediately:
```ts
// packages/nui-core/src/mockData.ts
export const mockData: Record<string, MockHandler> = {
  getPlayerData: () => ({ name: 'Mario Smith (mock)', money: 4200, job: 'police' }),
  buyItem: (payload) => ({ ok: true, newBalance: 4200 - (payload?.price ?? 0) }),

  // new action:
  getInventory: () => ([
    { id: 'water', label: 'Water Bottle', count: 3 },
    { id: 'bread', label: 'Bread', count: 1 },
  ]),
};
```
then use it in the component:
```tsx
const [inventory, setInventory] = useState<InventoryItem[]>([]);

const loadInventory = async () => {
  const items = await fetchNui<InventoryItem[]>('getInventory');
  setInventory(items);
};
```

---

## Level 3 — Real Lua and DB, Without Opening the Game

You need this level when the mock UI convinces you and you want to verify
that the real SQL query works, without having to open FiveM and log in as a player every time.

**1. Copy the resource to your local FXServer**
```bash
cp -r resources/bridge /path/to/your/fxserver/resources/bridge
```

**2. Adapt the DB connector in `fxmanifest.lua` to your framework.** The
scaffold assumes `oxmysql`:
```lua
server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/actions.lua',
    'server/events.lua',
    'server/bridge.lua',
}
```
If you use `mysql-async` or another connector, replace that first line
with the equivalent and adapt the `MySQL.query.await` /
`MySQL.update.await` calls in `server/actions.lua` to your connector's syntax.

**3. Configure the `server.cfg` of your development FXServer** — minimal example,
adjust as needed:
```cfg
# Connection to the DB started with "pnpm docker:up"
set mysql_connection_string "mysql://devkit:devkit@localhost:3306/fivem_devkit?charset=utf8mb4"

ensure oxmysql
ensure bridge

# RCON needed for targeted restart via script (Step 5)
rcon_password "change_this_password"

endpoint_add_tcp "0.0.0.0:30120"
endpoint_add_udp "0.0.0.0:30120"

sv_hostname "FiveM NUI Devkit - Dev Server"
sv_maxclients 1
```

**4. Start the FXServer.** You don't need to connect with the game: just leave
it running in a terminal, you only need it to execute Lua and talk to the DB.
You should see something like this in the log:
```
[bridge] HTTP bridge active on this resource: POST /action
[bridge] use VITE_NUI_MODE=bridge + VITE_BRIDGE_URL in the frontend to connect
```

**5. (Optional but recommended) Start the watcher for targeted restart**,
in another terminal — this way every change to a `.lua` file only restarts
`bridge`, not the entire server:
```bash
RCON_PASSWORD=change_this_password pnpm watch:bridge
```

**6. Configure the frontend to talk to the bridge** instead of mocks:
```bash
cd apps/example-hud
cp .env.example .env.local
```
then modify `.env.local`:
```
VITE_NUI_MODE=bridge
VITE_BRIDGE_URL=http://localhost:30125
```
> The exact port depends on how your FXServer exposes the HTTP endpoint
> registered with `SetHttpHandler` — normally it's the same port configured
> with `endpoint_add_tcp` in `server.cfg` (in the example above, `30120`).
> If `30125` doesn't respond, try `30120` and check the official FXServer
> documentation (`SetHttpHandler`) for the behavior of your build.

**7. Restart the frontend**
```bash
pnpm dev:hud
```
Now when you click "Load data", it really calls `Actions.getPlayerData` on
your FXServer, which does a real query on MariaDB and returns the real data
from the test row in `db/seed.sql`.

**8. Verify independently from the frontend (debugging)** — you can also
call the bridge directly from the terminal, useful to isolate if a problem
is in the frontend or backend:
```bash
curl -X POST http://localhost:30120/action \
  -H "Content-Type: application/json" \
  -d '{"action":"getPlayerData","payload":{}}'
```
Expected response:
```json
{"name":"Mario Smith (test)","money":4200,"job":"police"}
```

---

## Level 4 — build for real game

**1. Build the app**
```bash
pnpm build:hud
```
The output already goes into `resources/example-hud/web/build` (see
`build.outDir` in `apps/example-hud/vite.config.ts`), so no need to copy
anything manually.

**2. Create the real FiveM resource** (if it doesn't exist yet) next to the
`web/` folder, with a minimal `fxmanifest.lua`:
```lua
fx_version 'cerulean'
game 'gta5'

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/**/*',
}

client_scripts { 'client/nui.lua' }  -- the pattern from client/example_client.lua
server_scripts { 'server/actions.lua', 'server/events.lua' }  -- WITHOUT server/bridge.lua in production
```

**3. Copy `resources/example-hud` to your production/staging FiveM server**
and add in its `server.cfg`:
```cfg
ensure example-hud
```

**4. Enter the game and test manually** — this remains the only way to
verify `SetNuiFocus` and the actual behavior of mouse/keyboard, which
cannot be simulated from the browser.

---

## Adding a new interface from scratch

```bash
# 1. Duplicate the example app
cp -r apps/example-hud apps/inventory

# 2. Rename it in its package.json
```
```json
// apps/inventory/package.json
{
  "name": "inventory",
  ...
}
```
```bash
# 3. Update the outDir in its vite.config.ts
```
```ts
// apps/inventory/vite.config.ts
build: {
  outDir: '../../resources/inventory/web/build',
  emptyOutDir: true,
},
```
```bash
# 4. Reinstall so pnpm recognizes the new workspace
pnpm install

# 5. Start it
pnpm --filter inventory dev
```
From here, follow **`docs/FRONTEND-BACKEND-EVENTS.md`** to connect each
new action (e.g., `getInventory`, `moveItem`) to Lua/DB consistently
across all three modes — the guide includes a complete walkthrough
with code for every single step (mock → NUI callback → `Actions` → DB).

---

## Common Troubleshooting

| Problem | Likely Cause | Solution |
|---|---|---|
| `Cannot find module '@devkit/nui-core'` | You didn't run `pnpm install` from the root of the monorepo | Go to the main folder and re-run `pnpm install` |
| UI stays white in game but works in browser | `ui_page` in `fxmanifest.lua` doesn't point to the right file, or the build wasn't remade after a change | Verify the path and re-run `pnpm build:hud` |
| `fetchNui` in bridge mode gives CORS error | `Access-Control-Allow-Origin` header doesn't arrive, or the port in `.env.local` is wrong | Check `VITE_BRIDGE_URL` and try the direct call with `curl` (see Level 3, step 8) |
| DB in Adminer is empty | `db/seed.sql` is only executed at **first** Docker volume startup | `pnpm docker:down`, then `docker volume rm fivem-nui-devkit_db_data` and `pnpm docker:up` |
| `watch:bridge` doesn't restart anything | RCON not enabled or wrong password in `server.cfg` | Verify that `rcon_password` in `server.cfg` matches `RCON_PASSWORD` passed to the script |

## Important Notes

- The `bridge` resource **should never be run in production**: it exposes
  an open HTTP endpoint (CORS `*`) intended only for local development.
- `SetNuiFocus` (to give UI control of the mouse) must still be handled in the
  real Lua client — it cannot be simulated from the browser, always verify at
  Level 4 before release.
- Adapt the table/column names in `actions.lua` and `db/seed.sql` to your
  framework (ESX, QBCore or standalone) — the devkit structure remains
  identical, only the content of the queries changes.
