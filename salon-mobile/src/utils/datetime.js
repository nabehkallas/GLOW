function pad(n) {
  return String(n).padStart(2, '0');
}

// Formats a Date using its LOCAL wall-clock components (not UTC) — the backend
// treats scheduled_at/starts_at as plain local time with no timezone
// conversion (same convention the web apps' datetime-local inputs rely on),
// so Date#toISOString() would silently shift the time by the device's UTC offset.
export function toLocalDateTimeString(date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}
