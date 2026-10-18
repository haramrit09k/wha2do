import { useEffect } from 'react';

// Browser preview stand-in for the native time picker: immediately "picks" 09:45.
export default function DateTimePicker({ onChange }) {
  useEffect(() => {
    const d = new Date();
    d.setHours(9, 45, 0, 0);
    onChange({ type: 'set' }, d);
  }, [onChange]);
  return null;
}
