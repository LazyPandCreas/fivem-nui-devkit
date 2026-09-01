fx_version 'cerulean'
game 'gta5'

name 'bridge'
description 'Development resource: exposes server logic via HTTP to test Lua + DB without game client. DO NOT run in production.'
author 'devkit'

server_scripts {
    '@oxmysql/lib/MySQL.lua', -- adapt to your DB connector (oxmysql, mysql-async, etc.)
    'server/actions.lua',
    'server/events.lua',
    'server/bridge.lua',
}

client_scripts {
    'client/example_client.lua', -- reference example, not used in headless mode
}
