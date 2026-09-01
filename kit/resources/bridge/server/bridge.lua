-- ============================================================
-- DEVELOPMENT BRIDGE: exposes via HTTP the same logic as
-- Actions.*, so your React app in the browser (Vite dev) can
-- call real Lua + DB WITHOUT opening the game.
--
-- Use ONLY on a local/headless FXServer dedicated to
-- development. Never include/start this resource in production.
-- In the frontend: set VITE_NUI_MODE=bridge in the .env file.
-- ============================================================

local FAKE_SOURCE = 1 -- fake "player" id, corresponds to the test row in db/seed.sql

SetHttpHandler(function(req, res)
    if req.method ~= 'POST' or req.path ~= '/action' then
        res.writeHead(404)
        res.send('Not found')
        return
    end

    req.setDataHandler(function(body)
        local ok, parsed = pcall(json.decode, body)

        if not ok or not parsed or not parsed.action then
            res.writeHead(400, { ['Content-Type'] = 'application/json' })
            res.send(json.encode({ error = 'Invalid request: missing "action"' }))
            return
        end

        local handler = Actions[parsed.action]

        if not handler then
            res.writeHead(404, { ['Content-Type'] = 'application/json' })
            res.send(json.encode({ error = ('Unknown action: %s'):format(parsed.action) }))
            return
        end

        local result = handler(FAKE_SOURCE, parsed.payload or {})

        res.writeHead(200, {
            ['Content-Type'] = 'application/json',
            -- dev only: allows the browser (Vite, different port) to call this API
            ['Access-Control-Allow-Origin'] = '*',
        })
        res.send(json.encode(result))
    end)
end)

print('[bridge] HTTP bridge active on this resource: POST /action')
print('[bridge] use VITE_NUI_MODE=bridge + VITE_BRIDGE_URL in the frontend to connect')
