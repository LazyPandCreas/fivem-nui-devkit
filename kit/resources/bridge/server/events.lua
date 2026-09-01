-- ============================================================
-- Normal in-game flow: the client calls TriggerServerEvent,
-- here we call the corresponding function in Actions and
-- respond to the client (which in turn responds to the NUI).
--
-- Naming convention: always "resourcename:actionName" to
-- avoid collisions with events from other resources.
-- ============================================================

RegisterServerEvent('bridge:action')
AddEventHandler('bridge:action', function(actionName, payload, requestId)
    local source = source
    local handler = Actions[actionName]

    if not handler then
        print(('[bridge] Unknown action: %s'):format(actionName))
        return
    end

    local result = handler(source, payload or {})

    -- Send the result back to the client, which will pass it to the NUI with the cb()
    -- from RegisterNUICallback in pending state (see client/example_client.lua)
    TriggerClientEvent('bridge:actionResult', source, requestId, result)
end)
