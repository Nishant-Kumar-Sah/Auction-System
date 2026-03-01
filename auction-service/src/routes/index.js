const express = require('express');
const router = express.Router();

router.use('/users', require('./userRoutes'));
router.use('/auctions', require('./auctionRoutes'));
router.use('/bids', require('./bidRoutes'));
router.use('/test', require('./testRoutes'))

module.exports = router;