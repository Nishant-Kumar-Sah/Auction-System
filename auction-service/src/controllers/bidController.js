const bidService = require('../services/bidService');

const placeBid = async (req, res) => {
  try {
    const { user_id, auction_id, amount } = req.body;
    if (!user_id || !auction_id || !amount) return res.status(400).json({ status: 'error', message: 'user_id, auction_id and amount are required' });

    const bid = await bidService.placeBid(auction_id, user_id, amount);
    res.status(201).json({ status: 'bid placed', bid });
  } catch (e) {
    console.error(e);
    const isClientError = e.message.includes('not found') || e.message.includes('must be greater');
    res.status(isClientError ? 400 : 500).json({ status: 'error', message: e.message });
  }
};
const placeBidV2 = async (req, res) => {
  try {
    const { user_id, auction_id, amount } = req.body;
    if (!user_id || !auction_id || !amount) return res.status(400).json({ status: 'error', message: 'user_id, auction_id and amount are required' });

    const bid = await bidService.placeBidV2(auction_id, user_id, amount);
    res.status(201).json({ status: 'bid placed', bid });
  } catch (e) {
    console.error(e);
    const isClientError = e.message.includes('not found') || e.message.includes('must be greater');
    res.status(isClientError ? 400 : 500).json({ status: 'error', message: e.message });
  }
};

module.exports = { placeBid , placeBidV2};