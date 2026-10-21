// src/data/quests.js
// Pure data - quest definitions (no Phaser imports).
// giver is an NPC `id` from map data; text fields are locale keys
// (src/i18n); objective.target is a
// MONSTER_TYPES key or a BOSS_TYPES key (kill-count objectives).

export const QUESTS = [
  // === Shelter Isle (tutorial) ===
  {
    id: 'dustBusters',
    giver: 'keeper_tobi',
    titleKey: 'quest.dustBusters.title',
    offerKeys: [
      'quest.dustBusters.offer1',
      'quest.dustBusters.offer2',
    ],
    reminderKey: 'quest.dustBusters.reminder',
    completeKeys: ['quest.dustBusters.complete1'],
    objective: { target: 'dustmote', count: 3 },
    reward: { treats: 20, exp: 15, items: { cookie: 1 } },
  },
  // === Buddy House ===
  {
    id: 'sockRoundup',
    giver: 'granny_tabby',
    titleKey: 'quest.sockRoundup.title',
    offerKeys: [
      'quest.sockRoundup.offer1',
      'quest.sockRoundup.offer2',
    ],
    reminderKey: 'quest.sockRoundup.reminder',
    completeKeys: ['quest.sockRoundup.complete1'],
    objective: { target: 'sockslinker', count: 4 },
    reward: { treats: 90, exp: 70 },
  },
  {
    id: 'makeFriends',
    giver: 'granny_tabby',
    titleKey: 'quest.makeFriends.title',
    offerKeys: [
      'quest.makeFriends.offer1',
      'quest.makeFriends.offer2',
    ],
    reminderKey: 'quest.makeFriends.reminder',
    completeKeys: ['quest.makeFriends.complete1'],
    objective: { target: 'biggie', count: 1 },
    reward: { treats: 200, exp: 120, items: { milk: 1 } },
  },
  // === Home (original house) ===
  {
    id: 'popBubbles',
    giver: 'miyo',
    titleKey: 'quest.popBubbles.title',
    offerKeys: [
      'quest.popBubbles.offer1',
      'quest.popBubbles.offer2',
    ],
    reminderKey: 'quest.popBubbles.reminder',
    completeKeys: ['quest.popBubbles.complete1'],
    objective: { target: 'bangul', count: 5 },
    reward: { treats: 50, exp: 30 },
  },
  {
    id: 'gardenPatrol',
    giver: 'old_bell',
    titleKey: 'quest.gardenPatrol.title',
    offerKeys: [
      'quest.gardenPatrol.offer1',
      'quest.gardenPatrol.offer2',
    ],
    reminderKey: 'quest.gardenPatrol.reminder',
    completeKeys: ['quest.gardenPatrol.complete1'],
    objective: { target: 'nabi', count: 3 },
    reward: { treats: 80, exp: 60 },
  },
  {
    id: 'runawayPrototypes',
    giver: 'apprentice_bolt',
    titleKey: 'quest.runawayPrototypes.title',
    offerKeys: [
      'quest.runawayPrototypes.offer1',
      'quest.runawayPrototypes.offer2',
    ],
    reminderKey: 'quest.runawayPrototypes.reminder',
    completeKeys: ['quest.runawayPrototypes.complete1'],
    objective: { target: 'robo', count: 4 },
    reward: { treats: 120, exp: 100, items: { cookie: 2 } },
  },
  {
    id: 'softenGuardian',
    giver: 'plushist_sewmaster',
    titleKey: 'quest.softenGuardian.title',
    offerKeys: [
      'quest.softenGuardian.offer1',
      'quest.softenGuardian.offer2',
    ],
    reminderKey: 'quest.softenGuardian.reminder',
    completeKeys: ['quest.softenGuardian.complete1'],
    objective: { target: 'hugGuardian', count: 1 },
    reward: { treats: 300, exp: 150, items: { milk: 2 } },
  },
];
