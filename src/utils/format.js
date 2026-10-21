// src/utils/format.js
// Pure display helpers (no Phaser) shared by menu scenes and tests.
// Wording comes from the active locale (src/i18n).

import { t, getLang } from '../i18n/index.js';

// Play time as "1h 05m" (or "12m" under an hour); the Korean locale words it differently.
export function formatPlayTime(totalSec) {
  const sec = Number.isFinite(totalSec) && totalSec > 0 ? Math.floor(totalSec) : 0;
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours > 0) return t('time.hm', { hours, minutes: String(minutes).padStart(2, '0') });
  return t('time.m', { minutes });
}

// ISO timestamp as a short local date/time in the game's language, or '-'
// when unparseable.
export function formatSavedAt(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(getLang() === 'ko' ? 'ko-KR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
}
