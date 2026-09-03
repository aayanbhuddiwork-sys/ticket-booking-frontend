import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';

const HOLD_SECONDS = 180;
const MAX_HOLDS = 3; // cap so one person can't lock out the whole venue

export default function EventDetail() {
  const { id: eventId } = useParams();
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [heldSeats, setHeldSeats] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const timersRef = useRef({});

  const [raceResult, setRaceResult] = useState(null);
  const [raceRunning, setRaceRunning] = useState(false);

  const [speedResult, setSpeedResult] = useState(null);
  const [speedRunning, setSpeedRunning] = useState(false);

  function loadSeats() {
    client
      .get(`/api/events/${eventId}/seats`)
      .then((res) => setSeats(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSeats();
    return () => Object.values(timersRef.current).forEach(clearInterval);
  }, [eventId]);

  function startCountdown(seatId, seconds) {
    setCountdowns((c) => ({ ...c, [seatId]: seconds }));
    clearInterval(timersRef.current[seatId]);
    timersRef.current[seatId] = setInterval(() => {
      setCountdowns((c) => {
        const next = (c[seatId] ?? 1) - 1;
        if (next <= 0) {
          clearInterval(timersRef.current[seatId]);
          delete timersRef.current[seatId];
          setHeldSeats((hs) => hs.filter((id) => id !== seatId));
          loadSeats();
          const { [seatId]: _drop, ...rest } = c;
          return rest;
        }
        return { ...c, [seatId]: next };
      });
    }, 1000);
  }

  async function handleHold(seat) {
    if (seat.status !== 'available') return;
    if (heldSeats.includes(seat.id)) return;
    if (heldSeats.length >= MAX_HOLDS) {
      setMessage(`You can hold up to ${MAX_HOLDS} seats at a time.`);
      return;
    }
    setMessage('');
    try {
      const res = await client.post('/api/bookings/hold', { eventId, seatId: seat.id });
      setHeldSeats((hs) => [...hs, seat.id]);
      startCountdown(seat.id, res.data.holdSeconds || HOLD_SECONDS);
      loadSeats();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not hold seat.');
      loadSeats();
    }
  }

  async function handleRelease(seatId) {
    try {
      await client.post('/api/bookings/release', { eventId, seatId });
    } finally {
      clearInterval(timersRef.current[seatId]);
      delete timersRef.current[seatId];
      setHeldSeats((hs) => hs.filter((id) => id !== seatId));
      setCountdowns((c) => {
        const { [seatId]: _drop, ...rest } = c;
        return rest;
      });
      loadSeats();
    }
  }

  async function handleConfirmAll() {
    let successCount = 0;
    for (const seatId of heldSeats) {
      try {
        await client.post('/api/bookings/confirm', { eventId, seatId });
        successCount++;
        clearInterval(timersRef.current[seatId]);
        delete timersRef.current[seatId];
      } catch {
        // leave this one in heldSeats so the user can see/retry it
      }
    }
    setHeldSeats((hs) => hs.filter((id) => timersRef.current[id] !== undefined));
    setMessage(`Booked ${successCount} of ${heldSeats.length} seat(s).`);
    loadSeats();
  }

  async function handleRaceDemo() {
    const target = seats.find((s) => s.status === 'available' && !heldSeats.includes(s.id));
    if (!target) {
      setMessage('No available seat to run the demo on right now.');
      return;
    }
    setRaceRunning(true);
    setRaceResult(null);

    const [resultA, resultB] = await Promise.allSettled([
      client.post('/api/bookings/hold', { eventId, seatId: target.id }),
      client.post('/api/bookings/hold', { eventId, seatId: target.id }),
    ]);

    const aWon = resultA.status === 'fulfilled';
    const bWon = resultB.status === 'fulfilled';

    setRaceResult({
      seatNumber: target.seat_number,
      a: aWon ? '200 — lock acquired' : `${resultA.reason?.response?.status ?? '?'} — rejected`,
      b: bWon ? '200 — lock acquired' : `${resultB.reason?.response?.status ?? '?'} — rejected`,
    });
    setRaceRunning(false);

    if (aWon || bWon) {
      setTimeout(() => {
        client.post('/api/bookings/release', { eventId, seatId: target.id }).finally(loadSeats);
      }, 3000);
    }
    loadSeats();
  }

  async function handleSpeedTest() {
    const available = seats.filter((s) => s.status === 'available' && !heldSeats.includes(s.id));
    if (available.length < 2) {
      setMessage('Need at least 2 available seats to run this comparison.');
      return;
    }
    const [seatA, seatB] = available;
    setSpeedRunning(true);
    setSpeedResult(null);

    try {
      const t1 = Date.now();
      await client.post('/api/bookings', { eventId, seatId: seatA.id });
      const phase1Ms = Date.now() - t1;

      const t2a = Date.now();
      await client.post('/api/bookings/hold', { eventId, seatId: seatB.id });
      const holdMs = Date.now() - t2a;

      const t2b = Date.now();
      await client.post('/api/bookings/confirm', { eventId, seatId: seatB.id });
      const confirmMs = Date.now() - t2b;

      setSpeedResult({
        seatA: seatA.seat_number,
        seatB: seatB.seat_number,
        phase1Ms,
        holdMs,
        confirmMs,
        phase2TotalMs: holdMs + confirmMs,
      });
    } catch (err) {
      setMessage(err.response?.data?.error || 'Speed test failed partway through.');
    } finally {
      setSpeedRunning(false);
      loadSeats();
    }
  }

  if (loading) return <p style={{ padding: 16 }}>Loading seats...</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Select up to {MAX_HOLDS} seats</h2>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
        <span>⬜ Available</span>
        <span>🟧 Your hold</span>
        <span>⬛ Sold</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, maxWidth: 500 }}>
        {seats.map((seat) => {
          const isMine = heldSeats.includes(seat.id);
          const bg = seat.status === 'sold' ? '#333' : isMine ? '#f5a623' : seat.status === 'held' ? '#ccc' : '#eee';
          return (
            <button
              key={seat.id}
              onClick={() => handleHold(seat)}
              disabled={seat.status !== 'available' && !isMine}
              style={{ height: 36, background: bg, border: '1px solid #999', borderRadius: 6 }}
            >
              {seat.seat_number}
            </button>
          );
        })}
      </div>

      {heldSeats.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
          {heldSeats.map((seatId) => {
            const seat = seats.find((s) => s.id === seatId);
            return (
              <p key={seatId}>
                Seat {seat?.seat_number} — expires in {countdowns[seatId] ?? '...'}s{' '}
                <button onClick={() => handleRelease(seatId)}>Release</button>
              </p>
            );
          })}
          <button onClick={handleConfirmAll}>Confirm {heldSeats.length} seat(s)</button>
        </div>
      )}

      {message && <p style={{ marginTop: 12 }}>{message}</p>}

      <div style={{ marginTop: 24, padding: 12, border: '1px dashed #999', borderRadius: 8, maxWidth: 500 }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Race condition demo</p>
        <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#555' }}>
          Fires two hold requests at the same available seat at the same instant.
          Only one can win the Redis lock — watch the internals feed on the right.
        </p>
        <button onClick={handleRaceDemo} disabled={raceRunning}>
          {raceRunning ? 'Racing...' : 'Run race condition demo'}
        </button>
        {raceResult && (
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <p>Seat {raceResult.seatNumber}:</p>
            <p>Request A → {raceResult.a}</p>
            <p>Request B → {raceResult.b}</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, padding: 12, border: '1px dashed #999', borderRadius: 8, maxWidth: 500 }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Phase 1 vs Phase 2 speed comparison</p>
        <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#555' }}>
          Books one seat via direct Postgres locking (Phase 1) and a different
          seat via the Redis hold/confirm flow (Phase 2), timing each real request.
          Note: this actually books both seats — cancel them from My Bookings after.
        </p>
        <button onClick={handleSpeedTest} disabled={speedRunning}>
          {speedRunning ? 'Running...' : 'Run speed comparison'}
        </button>
        {speedResult && (
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <p>Phase 1 — seat {speedResult.seatA}: <strong>{speedResult.phase1Ms}ms</strong></p>
            <p>
              Phase 2 — seat {speedResult.seatB}: hold {speedResult.holdMs}ms + confirm{' '}
              {speedResult.confirmMs}ms = <strong>{speedResult.phase2TotalMs}ms total</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}