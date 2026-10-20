// src/utils/format.js
// Pure display helpers (no Phaser) shared by menu scenes and tests.

// Play time as "1h 05m" (or "12m" under an hour).
export function formatPlayTime(totalSec) {
  const sec = Number.isFinite(totalSec) && totalSec > 0 ? Math.floor(totalSec) : 0;
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m`;
}

// ISO timestamp as a short local date/time, or '-' when unparseable.
export function formatSavedAt(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}
