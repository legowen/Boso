// src/utils/constants.js
// Boso RPG - Global constants

// ===== Game settings =====
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;
export const GRAVITY = 900;

// ===== Player settings =====
export const PLAYER = {
  SPEED: 220,
  JUMP_VELOCITY: -450,
  WIDTH: 40,
  HEIGHT: 56,
  COLOR: 0xF39C12,
  ATTACK_RANGE: 60,
  ATTACK_WIDTH: 50,
  ATTACK_HEIGHT: 40,
  ATTACK_DURATION: 200,
  ATTACK_COOLDOWN: 400,
  MAX_HP: 100,
  MAX_MP: 50,
  BASE_ATTACK: 15,
};

// ===== Platform settings =====
export const PLATFORM = {
  COLOR: 0x5D6D7E,
  PASS_THROUGH_DELAY: 200, // Collision ignore duration for drop-through (ms)
};

// ===== Monster settings (expand in Phase 3) =====
export const MONSTER = {
  COLOR: 0xE74C3C,
  WIDTH: 36,
  HEIGHT: 44,
  RESPAWN_TIME: 10000,
};

// ===== Portal settings =====
export const PORTAL = {
  WIDTH: 48,
  HEIGHT: 64,
  COLOR: 0x8E44AD,
  GLOW_COLOR: 0xBB8FCE,
  ACTIVATE_DISTANCE: 50,
};

// ===== Rope settings =====
export const ROPE = {
  WIDTH: 8,
  COLOR: 0xC4A265,
  HIGHLIGHT_COLOR: 0xD4B878,
  CLIMB_SPEED: 150,
  GRAB_RANGE: 20,
};

// ===== NPC settings =====
export const NPC = {
  WIDTH: 36,
  HEIGHT: 52,
  COLOR: 0x27AE60,
  INTERACT_DISTANCE: 60,
};

// ===== UI settings =====
export const UI = {
  HUD_HEIGHT: 80,
  HP_BAR_WIDTH: 200,
  HP_BAR_HEIGHT: 16,
  MP_BAR_WIDTH: 200,
  MP_BAR_HEIGHT: 12,
  EXP_BAR_WIDTH: 300,
  EXP_BAR_HEIGHT: 8,
  HP_COLOR: 0xE74C3C,
  HP_BG_COLOR: 0x641E16,
  MP_COLOR: 0x3498DB,
  MP_BG_COLOR: 0x1B4F72,
  EXP_COLOR: 0xF1C40F,
  EXP_BG_COLOR: 0x7D6608,
  FONT_FAMILY: 'Arial',
  FONT_COLOR: '#ECF0F1',
};

// ===== Damage text =====
export const DAMAGE_TEXT = {
  FONT_SIZE: '18px',
  COLOR: '#FFFFFF',
  CRITICAL_COLOR: '#FF6B6B',
  FLOAT_DISTANCE: 40,
  DURATION: 800,
};

// ===== Camera =====
export const CAMERA = {
  LERP: 0.1,
  DEADZONE_WIDTH: 100,
  DEADZONE_HEIGHT: 50,
};

// ===== Scene names =====
export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  CHARACTER_SELECT: 'CharacterSelectScene',
  GAME: 'GameScene',
  ENDING: 'EndingScene',
};

// ===== Depth (z-order) =====
export const DEPTH = {
  BACKGROUND: 0,
  PLATFORMS: 10,
  ROPES: 12,
  PORTALS: 15,
  NPCS: 20,
  MONSTERS: 25,
  PLAYER: 30,
  EFFECTS: 40,
  UI: 100,
};
