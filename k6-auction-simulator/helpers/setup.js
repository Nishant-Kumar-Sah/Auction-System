import http from 'k6/http';
import { config } from '../config.js';
import { postJSON } from './utils.js';

export function setup() {
  // reset all tables
  const reset = postJSON(`${config.baseUrl}/test/reset`, {});
  console.log(`Reset status: ${reset.status}`);

  // create users
  const userIds = [];
  for (let i = 0; i < config.users; i++) {
    const res = postJSON(`${config.baseUrl}/users`, { email: `user${i}@test.com` });
    const body = JSON.parse(res.body);
    if (body.user) userIds.push(body.user.id);
  }
  console.log(`Created ${userIds.length} users`);

  // create auctions
  const auctionIds = [];
  for (let i = 0; i < config.auctions; i++) {
    const res = postJSON(`${config.baseUrl}/auctions`, { title: `Auction ${i}`, starting_bid: 10 });
    const body = JSON.parse(res.body);
    if (body.auction) auctionIds.push(body.auction.id);
  }
  console.log(`Created ${auctionIds.length} auctions`);

  return { userIds, auctionIds };
}