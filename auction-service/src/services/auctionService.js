const { createAuction: insertAuction } = require('../repository/auctionRepository');

async function createAuction(title, starting_bid) {
  return await insertAuction(title, starting_bid);
}

module.exports = { createAuction };