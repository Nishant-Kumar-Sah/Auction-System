const { createUser } = require('./userService');
const { createAuction } = require('./auctionService');
const { placeBid } = require('./bidService');

module.exports = { createUser, createAuction, placeBid };