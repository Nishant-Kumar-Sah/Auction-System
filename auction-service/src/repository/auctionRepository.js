const pool = require('../clients/postgres');

const { Auction, Bid } = require('../models');

async function fetchMaximumBid(auction_id) {
  const result = await pool.query(
    'SELECT current_highest_bid FROM auctions WHERE id = $1',
    [auction_id]
  );
  return result.rows[0]?.current_highest_bid || 0;
}

async function fetchAuctionById(auction_id) {
  const result = await pool.query(
    'SELECT * FROM auctions WHERE id = $1',
    [auction_id]
  );
  if (!result.rows[0]) return null;
  return new Auction(result.rows[0]);
}

async function createAuction(title, starting_bid) {
  const result = await pool.query(
    'INSERT INTO auctions (title, current_highest_bid) VALUES ($1, $2) RETURNING *',
    [title, starting_bid]
  );
  return new Auction(result.rows[0]);
}

async function updateHighestBid(auction_id, amount) {
  await pool.query(
    'UPDATE auctions SET current_highest_bid = $1, version = version + 1 WHERE id = $2',
    [amount, auction_id]
  );
}

async function insertBid(auction_id, user_id, amount) {
  const result = await pool.query(
    'INSERT INTO bids (auction_id, user_id, amount) VALUES ($1, $2, $3) RETURNING *',
    [auction_id, user_id, amount]
  );
  return new Bid(result.rows[0]);
}


//  V2 Implementation with Locks on the row

async function placeBidWithLock(auction_id, user_id, amount_bid) {
    console.log(`[repo][v2] acquiring lock on auction=${auction_id}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'SELECT current_highest_bid FROM auctions WHERE id=$1 FOR UPDATE',
        [auction_id]
      );
      if (!result.rows[0]) throw new Error(`Auction ${auction_id} Not found`);
  
      const current_highest_bid = result.rows[0].current_highest_bid;
      console.log(`[repo][v2] lock acquired, current highest bid: ${current_highest_bid}`);
  
      if (amount_bid <= current_highest_bid) {
        console.log(`[repo][v2] bid rejected: ${amount_bid} <= ${current_highest_bid}`);
        throw new Error(`Bid must be greater than the current highest bid ${current_highest_bid}`);
      }
  
      await client.query(
        'UPDATE auctions SET current_highest_bid=$1, version = version + 1 WHERE id = $2',
        [amount_bid, auction_id]
      );
      const bidResult = await client.query(
        'INSERT INTO bids (auction_id, user_id, amount) VALUES ($1, $2, $3) RETURNING *',
        [auction_id, user_id, amount_bid]
      );
      await client.query('COMMIT');
      console.log(`[repo][v2] transaction committed, winning bid: ${amount_bid}`);
      return new Bid(bidResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.log(`[repo][v2] transaction rolled back: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }
module.exports = { fetchMaximumBid, fetchAuctionById, createAuction, updateHighestBid, insertBid,placeBidWithLock };