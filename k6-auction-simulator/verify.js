const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'auction_db',
});

async function verify() {
  console.log('\n======= VERIFICATION REPORT =======\n');

  // total bids placed
  const totalBids = await pool.query('SELECT COUNT(*) FROM bids');
  console.log(`Total bids placed: ${totalBids.rows[0].count}`);

  // highest bid per auction
  const auctionResults = await pool.query(`
    SELECT 
      a.id as auction_id,
      a.title,
      a.current_highest_bid,
      a.version,
      MAX(b.amount) as max_bid_in_bids_table
    FROM auctions a
    LEFT JOIN bids b ON b.auction_id = a.id
    GROUP BY a.id, a.title, a.current_highest_bid, a.version
    ORDER BY a.id
  `);

  console.log('\n--- Auction Results ---');
  auctionResults.rows.forEach(row => {
    const consistent = Number(row.current_highest_bid) === Number(row.max_bid_in_bids_table);
    console.log(
      `Auction ${row.auction_id} | ${row.title} | ` +
      `highest_bid=${row.current_highest_bid} | ` +
      `max_in_bids=${row.max_bid_in_bids_table} | ` +
      `version=${row.version} | ` +
      `consistent=${consistent ? '✅' : '❌'}`
    );
  });

  // check for inconsistencies
  const inconsistent = auctionResults.rows.filter(
    row => Number(row.current_highest_bid) !== Number(row.max_bid_in_bids_table)
  );

  console.log('\n--- Summary ---');
  console.log(`Total auctions: ${auctionResults.rows.length}`);
  console.log(`Inconsistent auctions: ${inconsistent.length}`);
  if (inconsistent.length > 0) {
    console.log('❌ CONCURRENCY ISSUES DETECTED');
    inconsistent.forEach(row => {
      console.log(`  Auction ${row.auction_id}: highest_bid=${row.current_highest_bid} but max_bid=${row.max_bid_in_bids_table}`);
    });
  } else {
    console.log('✅ ALL AUCTIONS CONSISTENT');
  }

  console.log('\n===================================\n');
  await pool.end();
}

verify().catch(console.error);