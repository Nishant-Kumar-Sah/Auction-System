import { check, sleep } from 'k6';
import { config } from '../config.js';
import { setup as setupData } from '../helpers/setup.js';
import { postJSON, randomAmount, randomItem } from '../helpers/utils.js';

export const options = {
  vus: 50,
  duration: '30s',
};

export function setup() {
  return setupData();
}

export default function (data) {
  const { userIds, auctionIds } = data;

  const user_id = randomItem(userIds);
  const auction_id = randomItem(auctionIds);
  const amount = randomAmount(100, 10000);

  const res = postJSON(`${config.baseUrl}/bids/${config.version}`, {
    user_id,
    auction_id,
    amount,
  });

  check(res, {
    'status 201 or 400': (r) => r.status === 201 || r.status === 400,
  });

  sleep(0.5);
}