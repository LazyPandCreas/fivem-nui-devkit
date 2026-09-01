-- ============================================================
-- ACTIONS: single source of truth for business logic.
--
-- Every function here is called BOTH from the normal flow
-- client -> server (server/events.lua) AND from the HTTP
-- development bridge (server/bridge.lua). You don't write logic
-- twice: you test the exact same code that will run in production.
--
-- Standard signature: function(source, payload) -> table result
-- "source" is the real player id, or a fake id (1)
-- when the request comes from the development bridge.
-- ============================================================

Actions = {}

-- This action name MUST match what the frontend uses:
-- fetchNui('getPlayerData') and RegisterNUICallback('getPlayerData', ...)
Actions.getPlayerData = function(source, payload)
    local result = MySQL.query.await('SELECT name, money, job FROM players WHERE id = ?', { source })

    if not result or #result == 0 then
        return { name = 'Unknown', money = 0, job = 'unemployed' }
    end

    return result[1]
end

Actions.buyItem = function(source, payload)
    local price = payload.price or 0

    MySQL.update.await('UPDATE players SET money = money - ? WHERE id = ?', { price, source })

    local result = MySQL.query.await('SELECT money FROM players WHERE id = ?', { source })
    local newBalance = result and result[1] and result[1].money or 0

    return { ok = true, newBalance = newBalance }
end
