const pool = require('../clients/postgres');

async function resetAllTables() {
  await pool.query('TRUNCATE TABLE bids, auctions, users RESTART IDENTITY CASCADE');
}

module.exports = { resetAllTables };