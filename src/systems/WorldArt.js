import { DEPTH } from '../utils/constants.js';
import { MAP_ART, WORLD_THEMES } from '../data/worldArt.js';

export function addWorldBackground(scene, mapKey) {
  const theme = WORLD_THEMES[MAP_ART[mapKey] || 'garden'];
  scene.artTheme = theme;
  const { width, height } = scene.mapData;
  scene.physics.world.setBounds(0, 0, width, height);
  scene.cameras.main.setBackgroundColor(theme.color);
  if (!scene.textures.exists(theme.background)) return;
  const bg = scene.add.image(0, 0, theme.background).setOrigin(0, 0)
    .setScrollFactor(0).setDepth(DEPTH.BACKGROUND);
  const layout = () => {
    const scale = Math.max(scene.scale.width / bg.width, scene.scale.height / bg.height);
    bg.setScale(scale).setPosition((scene.scale.width - bg.displayWidth) / 2, (scene.scale.height - bg.displayHeight) / 2);
  };
  layout();
  scene.scale.on('resize', layout);
  scene.events.once('shutdown', () => scene.scale.off('resize', layout));
  // A quiet tint keeps interactive actors and ledges legible over rich scenery.
  scene.add.rectangle(0, 0, width, height, 0x17202B, 0.18)
    .setOrigin(0).setDepth(DEPTH.BACKGROUND + 1);
}

export function decoratePlatform(scene, data, terrainKey) {
  if (!scene.textures.exists(terrainKey)) return;
  scene.add.tileSprite(data.x, data.y, data.w, data.h, terrainKey)
    .setOrigin(0).setDepth(DEPTH.PLATFORMS + 1);
  // Pixel edge and underside distinguish actual landable ledges from scenery.
  scene.add.rectangle(data.x, data.y, data.w, 2, 0xFFF1C9, 0.75).setOrigin(0).setDepth(DEPTH.PLATFORMS + 2);
  scene.add.rectangle(data.x, data.y + data.h - 2, data.w, 2, 0x201B24, 0.7).setOrigin(0).setDepth(DEPTH.PLATFORMS + 2);
}
