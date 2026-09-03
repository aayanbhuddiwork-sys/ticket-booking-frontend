import { useEffect, useState } from 'react';
import client from '../api/client';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  function loadBookings() {
    client
      .get('/api/bookings/me')
      .then((res) => setBookings(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleCancel(id) {
    setMessage('');
    try {
      await client.delete(`/api/bookings/${id}`);
      setMessage('Booking cancelled — seat is available again.');
      loadBookings();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not cancel booking.');
    }
  }

  if (loading) return <p style={{ padding: 16 }}>Loading your bookings...</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2>My Bookings</h2>
      {message && <p>{message}</p>}
      {bookings.length === 0 && <p>No bookings yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bookings.map((b) => (
          <div key={b.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12 }}>
            <strong>{b.event_name}</strong> — Seat {b.seat_number}
            <div style={{ fontSize: 13, color: '#666' }}>
              Status: {b.status} · Booked {new Date(b.created_at).toLocaleString()}
            </div>
            {b.status !== 'cancelled' && (
              <button onClick={() => handleCancel(b.id)} style={{ marginTop: 8 }}>
                Cancel booking
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}