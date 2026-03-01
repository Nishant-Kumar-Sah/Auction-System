const { createUser } = require('./userController');
const { createAuction } = require('./auctionController');
const { placeBid } = require('./bidController');

module.exports = { createUser, createAuction, placeBid };