import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { config } from '../config.js';
import { setup as setupData } from '../helpers/setup.js';
import { postJSON, randomAmount, randomItem } from '../helpers/utils.js';

const successfulBids = new Counter('successful_bids');
const rejectedBids = new Counter('rejected_bids');

export const options = {
  scenarios: {
    // all users hammer same auction simultaneously
    same_auction: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 100 },  // ramp up to 100 users
        { duration: '20s', target: 100 }, // hold
        { duration: '5s', target: 0 },    // ramp down
      ],
      tags: { scenario: 'same_auction' },
    },
    // users bid on random auctions
    random_auction: {
      executor: 'ramping-vus',
      startVUs: 0,
      startTime: '30s', // starts after same_auction
      stages: [
        { duration: '5s', target: 100 },
        { duration: '20s', target: 100 },
        { duration: '5s', target: 0 },
      ],
      tags: { scenario: 'random_auction' },
    },
  },
};

export function setup() {
  return setupData();
}

export default function (data) {
  const { userIds, auctionIds } = data;
  const scenario = __ENV.SCENARIO || 'same_auction';

  const user_id = randomItem(userIds);
  const auction_id = scenario === 'same_auction' ? auctionIds[0] : randomItem(auctionIds);
  const amount = randomAmount(100, 10000);

  const res = postJSON(`${config.baseUrl}/bids/${config.version}`, {
    user_id,
    auction_id,
    amount,
  });

  const body = JSON.parse(res.body);

  if (res.status === 201) {
    successfulBids.add(1);
    console.log(`[SUCCESS] auction=${auction_id} user=${user_id} amount=${amount}`);
  } else {
    rejectedBids.add(1);
    console.log(`[REJECTED] auction=${auction_id} amount=${amount} reason=${body.message}`);
  }

  check(res, {
    'status 201 or 400': (r) => r.status === 201 || r.status === 400,
  });
}