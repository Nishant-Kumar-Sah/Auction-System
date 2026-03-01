const auctionRepository = require('./auctionRepository');
const userRepository = require('./userRepository');
const testRepository = require('./testRepository')

module.exports = { ...auctionRepository, ...userRepository, ...testRepository };