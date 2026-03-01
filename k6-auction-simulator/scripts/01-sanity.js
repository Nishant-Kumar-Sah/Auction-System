import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config.js';
import { setup as setupData } from '../helpers/setup.js';
import { postJSON, randomAmount } from '../helpers/utils.js';

export const options = {
  vus: 1,
  iterations: 1,
};

export function setup() {
  return setupData();
}

export default function (data) {
  const { userIds, auctionIds } = data;

  const user_id = userIds[0];
  const auction_id = auctionIds[0];
  const amount = randomAmount(100, 500);

  console.log(`Placing bid: user=${user_id} auction=${auction_id} amount=${amount}`);

  const res = postJSON(`${config.baseUrl}/bids/${config.version}`, {
    user_id,
    auction_id,
    amount,
  });

  console.log(`Response: ${res.body}`);

  check(res, {
    'status is 201': (r) => r.status === 201,
    'bid placed': (r) => JSON.parse(r.body).status === 'bid placed',
  });
}