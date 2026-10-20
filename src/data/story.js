// src/data/story.js
// Pure data — story text (no Phaser imports).
// "Look at me!" — Seoli or Bomi crosses the house to reach the Owner,
// who is locked away in the attic laboratory. Magatia homage:
// two rival toy-alchemist guilds, the Gearists and the Plushists.

export const STORY = {
  intro: [
    'A little one opens their eyes\nin a warm bed that smells of clean towels.',
    'Paw Shelter Clinic — where lost paws rest\nuntil someone comes looking.',
    '"Good morning, {player}.\nSomeone came looking for YOU today."',
    'His name is Owen. But Owen leaves on a long trip,\nso a friend\'s house will be home for a while...',
    'A big house. A high table above everything.\nAnd one VERY big dog.',
    'And someday, a house of your own —\nwith an attic that never sleeps.',
    'Little paws, big world.\nGo say hello!',
  ],
  ending: [
    'The whirring fades. Dust settles.',
    'Footsteps... coming down the attic stairs.',
    'The Owner finally turns around...',
    '"...{player}!"',
    'DEMO CLEAR — Thanks for playing!',
  ],
  hiddenPortalHint: 'A strange humming comes from the closet...',
  portalOpenedHint: 'A new path has opened!',
  bossWarning: {
    hugGuardian: 'The Hug Guardian wants a BIG hug!',
    vacuumKing: 'The Vacuum King awakens!',
    drEmbrace: 'Dr. Embrace has SO much love to give!',
    biggie: 'Biggie guards this yard. Show him what you are made of!',
  },
  // Shown (with a camera shake) when a defeated boss comes back while the
  // player is still in its map
  bossRespawn: {
    hugGuardian: 'The Hug Guardian is back for another hug!',
    vacuumKing: 'The Vacuum King returns!',
    drEmbrace: 'Dr. Embrace is back for a check-up!',
    biggie: 'Biggie bounds back in, tail wagging!',
  },
  biggieFriend: [
    'Biggie stops... and wags his tail!',
    'You made a friend!',
  ],
};
