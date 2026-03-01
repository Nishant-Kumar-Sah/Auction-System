const express = require('express');
const router = express.Router();
const { createAuction } = require('../controllers/auctionController');

router.post('/', createAuction);

module.exports = router;