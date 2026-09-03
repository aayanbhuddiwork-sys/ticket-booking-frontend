import { useEffect, useState } from 'react';
import client from '../api/client';

// Render's free tier puts the API to sleep after inactivity. The first
// request after that takes 20-30s. Without this, a click would just
// hang with no explanation. This pings a lightweight endpoint on load
// and shows a status message until the server responds.
export default function WakeUpBanner() {
  const [status, setStatus] = useState('waking'); // 'waking' | 'ready' | 'error'

  useEffect(() => {
    client
      .get('/api/events')
      .then(() => setStatus('ready'))
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'ready') return null;

  return (
    <div style={{ padding: '10px 16px', fontSize: 14 }}>
      {status === 'waking'
        ? 'Waking up the server (free hosting sleeps when idle) — this can take up to 30s on the first load.'
        : "Couldn't reach the server. Try refreshing in a moment."}
    </div>
  );
}
