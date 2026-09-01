-- ============================================================
-- REFERENCE EXAMPLE: how to intercept commands coming from
-- the NUI (React frontend) and forward them to the server.
--
-- Copy/adapt this pattern in your REAL interface resource
-- (e.g., resources/example-hud/client/nui.lua).
-- This file is NOT executed in bridge/headless mode.
-- ============================================================

local pendingRequests = {}
local requestCounter = 0

-- The frontend calls: fetchNui('getPlayerData')
-- -> fetch towards https://<resource>/getPlayerData
-- -> FiveM automatically routes here:
RegisterNUICallback('getPlayerData', function(data, cb)
    requestCounter = requestCounter + 1
    local requestId = requestCounter
    pendingRequests[requestId] = cb

    TriggerServerEvent('bridge:action', 'getPlayerData', data, requestId)
end)

RegisterNUICallback('buyItem', function(data, cb)
    requestCounter = requestCounter + 1
    local requestId = requestCounter
    pendingRequests[requestId] = cb

    TriggerServerEvent('bridge:action', 'buyItem', data, requestId)
end)

-- The server responds here: "close" the pending NUI callback
RegisterNetEvent('bridge:actionResult')
AddEventHandler('bridge:actionResult', function(requestId, result)
    local cb = pendingRequests[requestId]
    if cb then
        cb(result)
        pendingRequests[requestId] = nil
    end
end)

-- Example of sending data FROM the client TO the NUI (push, not a request):
-- SendNUIMessage({ action = 'updatePlayer', data = { name = 'Mario', money = 500, job = 'police' } })
