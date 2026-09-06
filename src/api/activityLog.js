// A tiny pub-sub. Axios interceptors run outside the React component
// tree, so they can't call useState directly — this is the bridge:
// interceptors call `logActivity`, and the ActivityFeed component
// subscribes to receive each entry as it happens.

let listeners = [];

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function logActivity(entry) {
  listeners.forEach((fn) => fn(entry));
}

// Turns a raw method/url/status into a human-readable line that
// reflects what's actually happening on the backend for that call.
export function describeActivity(method, url, status) {
  const ok = status >= 200 && status < 300;

  // 401/403/429 mean "you're not authenticated/authorized/too fast" —
  // completely different problems from a business-logic rejection like
  // 409. Handling these first means every endpoint gets an honest label
  // instead of a guessed one.
  if (status === 401) return 'Unauthorized — missing or invalid login token';
  if (status === 403) return 'Forbidden — not allowed to do this';
  if (status === 429) return 'Rate limited — too many requests, slow down';

  if (url.includes('/auth/register')) return ok ? 'Auth: user registered, JWT issued' : 'Auth: registration failed';
  if (url.includes('/auth/login')) return ok ? 'Auth: login verified, JWT issued' : 'Auth: login rejected';
  if (url.includes('/bookings/hold')) return ok ? 'Redis: SET NX EX 180 — seat lock acquired' : 'Redis: lock rejected — seat already held';
  if (url.includes('/bookings/confirm')) return ok ? 'Postgres: booking committed → Kafka event published' : 'Confirm rejected — hold expired or not yours';
  if (url.includes('/bookings/release')) return ok ? 'Redis: lock released, seat freed' : 'Release failed';
  if (url.includes('/events') && url.includes('/seats')) return 'Fetched live seat map';
  if (url.match(/\/events\/?$/) && method === 'GET') return 'Fetched event list';
  if (url.includes('/bookings/me')) return 'Fetched booking history';

  return `${method} ${url}`;
}