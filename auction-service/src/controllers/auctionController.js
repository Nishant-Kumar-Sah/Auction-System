const auctionService = require('../services/auctionService');

const createAuction = async (req, res) => {
  try {
    const { title, starting_bid } = req.body;
    if (!title || !starting_bid) return res.status(400).json({ status: 'error', message: 'title and starting_bid are required' });

    const auction = await auctionService.createAuction(title, starting_bid);
    res.status(201).json({ status: 'success', auction });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: 'error', message: e.message });
  }
};

module.exports = { createAuction };