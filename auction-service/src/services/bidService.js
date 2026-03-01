const { fetchMaximumBid, updateHighestBid, insertBid, fetchAuctionById, placeBidWithLock } = require('../repository');

async function placeBid(auction_id, user_id, bid_amount) {
  console.log(`[v1] placeBid called: auction=${auction_id} user=${user_id} amount=${bid_amount}`);
  const auction = await fetchAuctionById(auction_id);
  if (!auction) throw new Error(`Auction ${auction_id} not found`);

  const current_highest_bid = await fetchMaximumBid(auction_id);
  console.log(`[v1] current highest bid: ${current_highest_bid}`);
  if (bid_amount <= current_highest_bid) {
    throw new Error(`Bid amount must be greater than current highest bid ${current_highest_bid}`);
  }

  await updateHighestBid(auction_id, bid_amount);
  const bid = await insertBid(auction_id, user_id, bid_amount);
  console.log(`[v1] bid placed successfully: ${JSON.stringify(bid)}`);
  return bid;
}

async function placeBidV2(auction_id, user_id, bid_amount) {
  console.log(`[v2] placeBidV2 called: auction=${auction_id} user=${user_id} amount=${bid_amount}`);
  const bid = await placeBidWithLock(auction_id, user_id, bid_amount);
  console.log(`[v2] bid placed successfully: ${JSON.stringify(bid)}`);
  return bid;
}
module.exports = { placeBid, placeBidV2 };