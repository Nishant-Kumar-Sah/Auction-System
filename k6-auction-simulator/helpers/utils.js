import http from 'k6/http';

export function randomAmount(min = 100, max = 10000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function postJSON(url, body) {
  return http.post(url, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}