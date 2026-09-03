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

export function describeActivity(method, url, status) {
  const ok = status >= 200 && status < 300;

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