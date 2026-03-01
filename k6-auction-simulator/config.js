export const config = {
    baseUrl: 'http://localhost:3001/api',
    version: __ENV.VERSION || 'v1',
    users: 100,
    auctions: 50,
  };


//# v1 (default)
// k6 run scripts/01-sanity.js

// # v2
// k6 run -e VERSION=v2 scripts/01-sanity.js