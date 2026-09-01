type MockHandler = (payload: any) => any;

// Register fake data here for every "action" that the frontend calls with fetchNui.
// The name must match EXACTLY with what's registered on Lua with
// RegisterNUICallback('actionName', ...) — see docs/FRONTEND-BACKEND-EVENTS.md.
export const mockData: Record<string, MockHandler> = {
  getPlayerData: () => ({
    name: 'John Smith (mock)',
    money: 4200,
    job: 'police',
  }),
  buyItem: (payload) => ({
    ok: true,
    newBalance: 4200 - (payload?.price ?? 0),
  }),
};
