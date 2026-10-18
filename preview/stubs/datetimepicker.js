/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';

// Browser stand-in for the native Android time picker.
// - Normally: a real <input type="time"> with Set / Cancel, so visitors of the web demo can pick any time.
// - With ?autotime in the URL (used by the screenshot and video tooling): immediately "picks" 09:45.
const AUTO =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('autotime');

const at = (hours, minutes) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export default function DateTimePicker({ onChange }) {
  const [text, setText] = useState('09:00');

  useEffect(() => {
    if (AUTO) {
      onChange({ type: 'set' }, at(9, 45));
    }
  }, [onChange]);

  if (AUTO) {
    return null;
  }

  const confirm = () => {
    const [h, m] = (text || '09:00').split(':').map(Number);
    onChange({ type: 'set' }, at(h, m));
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        fontFamily: 'inherit',
      }}
    >
      <input
        type="time"
        aria-label="Start time"
        value={text}
        onChange={e => setText(e.target.value)}
        style={{
          flex: 1,
          height: 44,
          fontSize: 16,
          padding: '0 10px',
          border: '1.5px solid #e3e7f5',
          borderRadius: 12,
        }}
      />
      <button
        type="button"
        onClick={confirm}
        style={{
          height: 44,
          padding: '0 16px',
          border: 0,
          borderRadius: 12,
          background: '#4154fe',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        Set
      </button>
      <button
        type="button"
        onClick={() => onChange({ type: 'dismissed' }, new Date())}
        style={{
          height: 44,
          padding: '0 12px',
          border: 0,
          background: 'none',
          color: '#6b7390',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </div>
  );
}
