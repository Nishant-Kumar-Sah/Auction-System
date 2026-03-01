const express = require('express');
const router = express.Router();
const { placeBid,placeBidV2 } = require('../controllers/bidController');
router.post('/v1', placeBid)
router.post('/v2', placeBidV2);

module.exports = router;