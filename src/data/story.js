// src/data/story.js
// Pure data — story text KEYS (no Phaser imports; the text lives in src/i18n).
// "Look at me!" — Seoli or Bomi crosses the house to reach the Owner,
// who is locked away in the attic laboratory. Magatia homage:
// two rival toy-alchemist guilds, the Gearists and the Plushists.
// {player} placeholders are filled by the scene when it calls t().

export const STORY = {
  intro: [
    'story.intro1',
    'story.intro2',
    'story.intro3',
    'story.intro4',
    'story.intro5',
    'story.intro6',
    'story.intro7',
  ],
  ending: [
    'story.ending1',
    'story.ending2',
    'story.ending3',
    'story.ending4',
    'story.ending5',
  ],
  hiddenPortalHint: 'story.hiddenPortalHint',
  portalOpenedHint: 'story.portalOpenedHint',
  bossWarning: {
    hugGuardian: 'story.bossWarning.hugGuardian',
    vacuumKing: 'story.bossWarning.vacuumKing',
    drEmbrace: 'story.bossWarning.drEmbrace',
    biggie: 'story.bossWarning.biggie',
  },
  // Shown (with a camera shake) when a defeated boss comes back while the
  // player is still in its map
  bossRespawn: {
    hugGuardian: 'story.bossRespawn.hugGuardian',
    vacuumKing: 'story.bossRespawn.vacuumKing',
    drEmbrace: 'story.bossRespawn.drEmbrace',
    biggie: 'story.bossRespawn.biggie',
  },
  biggieFriend: [
    'story.biggieFriend1',
    'story.biggieFriend2',
  ],
};
