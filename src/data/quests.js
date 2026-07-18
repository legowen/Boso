// src/data/quests.js
// Pure data - quest definitions (no Phaser imports).
// giver matches an NPC name in map data; objective.target is a
// MONSTER_TYPES key or a BOSS_TYPES key (kill-count objectives).

export const QUESTS = [
  // === Shelter Isle (tutorial) ===
  {
    id: 'dustBusters',
    giver: 'Keeper Tobi',
    title: 'Dust Busters',
    offer: [
      'Those dust motes make the patients sneeze all night.',
      'Swat 3 of them for me? CTRL is all it takes.',
    ],
    reminder: 'Three dust motes. They drift around the hallway - CTRL!',
    complete: ['Bless you, kitten! The ward can breathe again. Here, treats.'],
    objective: { target: 'dustmote', count: 3 },
    reward: { treats: 20, exp: 15, items: { cookie: 1 } },
  },
  // === Buddy House ===
  {
    id: 'sockRoundup',
    giver: 'Granny Tabby',
    title: 'Sock Roundup',
    offer: [
      'The laundry escaped again! Socks, slinking all over Sofa Ridge.',
      'Flatten 4 of them before they nest in the cushions.',
    ],
    reminder: 'Four Sock Slinkers, dear. Sofa Ridge, west of the village.',
    complete: ['Ha! Folded and filed. You earned every treat of this.'],
    objective: { target: 'sockslinker', count: 4 },
    reward: { treats: 90, exp: 70 },
  },
  {
    id: 'makeFriends',
    giver: 'Granny Tabby',
    title: 'The Big Dog',
    offer: [
      'Biggie guards the backyard gate. He is not mean - just... enormous.',
      'Go show him you belong here. Win him over!',
    ],
    reminder: 'Biggie waits past the Bookshelf Cliffs. Stand your ground!',
    complete: ['Friends with Biggie! Now THAT is a first. Welcome home, dear.'],
    objective: { target: 'biggie', count: 1 },
    reward: { treats: 200, exp: 120, items: { milk: 1 } },
  },
  // === Home (original house) ===
  {
    id: 'popBubbles',
    giver: 'Miyo the Cat',
    title: 'Pop the Bubbles',
    offer: [
      'Those Bangul bubbles have multiplied all over the living room...',
      'Pop 5 of them for me, will you?',
    ],
    reminder: 'How goes the bubble popping? 5 Bangul, remember.',
    complete: ['My whiskers thank you! Here - I buried these treats for a rainy day.'],
    objective: { target: 'bangul', count: 5 },
    reward: { treats: 50, exp: 30 },
  },
  {
    id: 'gardenPatrol',
    giver: 'Old Bell',
    title: 'Garden Patrol',
    offer: [
      'My old bones cannot patrol the garden anymore.',
      'Chase off 3 of those Nabi butterflies for me, pup.',
    ],
    reminder: 'The garden is west of here. 3 Nabi butterflies.',
    complete: ['Good pup! You would have made a fine yard dog in my day.'],
    objective: { target: 'nabi', count: 3 },
    reward: { treats: 80, exp: 60 },
  },
  {
    id: 'runawayPrototypes',
    giver: 'Apprentice Bolt',
    title: 'Runaway Prototypes',
    offer: [
      'The wind-up prototypes broke their leashes!',
      'Scrap 4 Robo units before the master finds out. Please!',
    ],
    reminder: 'Robo units. Four of them. Quickly, before the master notices!',
    complete: ['Phew! Take these from the emergency snack drawer. Our secret!'],
    objective: { target: 'robo', count: 4 },
    reward: { treats: 120, exp: 100, items: { cookie: 2 } },
  },
  {
    id: 'softenGuardian',
    giver: 'Plushist Sewmaster',
    title: 'Soften the Guardian',
    offer: [
      'Our Hug Guardian waits in the attic... it must be stopped. Gently.',
      'Defeat it - and remember: the green circle is the ONLY safe spot!',
    ],
    reminder: 'The Guardian is in the attic. Green circle. Do not forget.',
    complete: ['You freed it from its own love... Thank you, brave pup.'],
    objective: { target: 'hugGuardian', count: 1 },
    reward: { treats: 300, exp: 150, items: { milk: 2 } },
  },
];
