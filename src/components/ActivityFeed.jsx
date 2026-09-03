import { useEffect, useRef, useState } from 'react';
import { subscribe } from '../api/activityLog';

const MAX_ENTRIES = 50;

export default function ActivityFeed() {
  const [entries, setEntries] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribe((entry) => {
      setEntries((prev) => [...prev.slice(-(MAX_ENTRIES - 1)), entry]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div style={{ background: '#0d1117', color: '#c9d1d9', fontFamily: 'monospace', fontSize: 12, padding: 12, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ color: '#8b949e', marginBottom: 8 }}>SYSTEM ACTIVITY — live, from real API responses</div>
      {entries.length === 0 && <div style={{ color: '#8b949e' }}>Waiting for activity...</div>}
      {entries.map((e, i) => (
        <div key={i} style={{ marginBottom: 4, color: e.ok ? '#7ee787' : '#ff7b72' }}>
          [{e.time}] {e.status} {e.text}
          {e.duration != null && <span style={{ color: '#8b949e' }}> ({e.duration}ms)</span>}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}