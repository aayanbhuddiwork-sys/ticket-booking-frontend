import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/api/events')
      .then((res) => setEvents(res.data))
      .catch(() => setError('Could not load events.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 16 }}>Loading events...</p>;
  if (error) return <p style={{ padding: 16, color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Events</h2>
      {events.length === 0 && <p>No events yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: 12,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <strong>{event.name}</strong>
            <div>{event.venue}</div>
            <div>{new Date(event.event_date).toLocaleString()}</div>
            <div>{event.available_seats} seats available</div>
          </Link>
        ))}
      </div>
    </div>
  );
}