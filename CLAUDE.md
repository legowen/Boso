# 🎮 BOSO 게임 코딩 규칙

## 📋 목차
1. [파일 네이밍 규칙](#파일-네이밍-규칙)
2. [코드 스타일](#코드-스타일)
3. [Phaser 씬 구조](#phaser-씬-구조)
4. [에셋 관리](#에셋-관리)
5. [상수 정의](#상수-정의)

---

## 📁 파일 네이밍 규칙

### 씬 파일 (Scenes)
- **형식**: `PascalCase` + `Scene.js`
- **위치**: `src/scenes/`
- **예시**:
  ```
  ✅ GameScene.js
  ✅ MenuScene.js
  ✅ CharacterSelectScene.js
  ❌ game-scene.js
  ❌ gameScene.js
  ```

### 유틸리티 파일 (Utils)
- **형식**: `camelCase.js`
- **위치**: `src/utils/`
- **예시**:
  ```
  ✅ colorAnalyzer.js
  ✅ physicsHelper.js
  ✅ transitionEffects.js
  ❌ ColorAnalyzer.js
  ```

### 캐릭터 관련 파일
- **형식**: `PascalCase.js`
- **위치**: `src/characters/`
- **예시**:
  ```
  ✅ CharacterCreator.js
  ✅ CharacterStorage.js
  ✅ ColorAnalyzer.js
  ```

### 설정 파일
- **형식**: `camelCase.js`
- **위치**: `src/`
- **예시**:
  ```
  ✅ config.js
  ✅ constants.js
  ❌ Config.js
  ```

---

## 🎨 코드 스타일

### 1. 들여쓰기
- **2칸 스페이스** 사용 (탭 ❌)

### 2. 세미콜론
- **항상 사용** `;`

### 3. 따옴표
- **작은따옴표** `'` 우선 (문자열에 따옴표 포함 시 큰따옴표)

### 4. 변수명
```javascript
// ✅ Good
const gameSpeed = 3;
const playerHealth = 100;
const backgroundMusic = null;

// ❌ Bad
const GameSpeed = 3;
const player_health = 100;
const bgm = null; // 약어 피하기
```

### 5. 함수명
```javascript
// ✅ Good - 동사로 시작
function createObstacle() {}
function checkCollision() {}
function updateScore() {}

// ❌ Bad
function obstacle() {}
function collision() {}
function score() {}
```

### 6. 주석
```javascript
// ✅ Good - 설명적인 주석
// 플레이어가 점프할 때 점프 사운드 재생
if (cursors.space.isDown) {
  this.player.jump();
}

// ❌ Bad - 불필요한 주석
// 스페이스바를 누르면
if (cursors.space.isDown) {
  this.player.jump();
}
```

---

## 🎮 Phaser 씬 구조

**모든 씬은 동일한 구조를 따릅니다**:

```javascript
import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene'); // 씬 이름은 클래스명과 동일
  }

  // 1. 에셋 로딩
  preload() {
    // 이미지, 사운드 등 로드
  }

  // 2. 게임 오브젝트 생성
  create() {
    // 캐릭터, 배경, UI 생성
    this.initPlayer();
    this.initObstacles();
    this.initUI();
  }

  // 3. 매 프레임 업데이트
  update(time, delta) {
    // 게임 로직 업데이트
    this.updatePlayer();
    this.checkCollisions();
  }

  // 4. 커스텀 메서드들 (alphabetic order)
  checkCollisions() {}
  initObstacles() {}
  initPlayer() {}
  initUI() {}
  updatePlayer() {}
}
```

### 씬 메서드 순서 규칙
1. `constructor()`
2. `init()` (있다면)
3. `preload()`
4. `create()`
5. `update()`
6. **커스텀 메서드들 (알파벳 순)**

---

## 🖼️ 에셋 관리

### 폴더 구조
```
assets/
├── sprites/
│   ├── characters/
│   │   ├── cat_black.png
│   │   ├── cat_white.png
│   │   └── dog_white.png
│   ├── obstacles/
│   │   ├── fire.png
│   │   └── spike.png
│   └── items/
│       └── treat.png
├── sounds/
│   ├── music/
│   │   ├── stage1_dark.mp3
│   │   └── stage4_rainbow.mp3
│   └── sfx/
│       ├── jump.mp3
│       └── collect.mp3
└── fonts/
    └── pixel.ttf
```

### 네이밍 규칙
- **형식**: `snake_case.확장자`
- **의미**: `타입_색상_상태.확장자`
- **예시**:
  ```
  ✅ cat_black_idle.png
  ✅ cat_black_run.png
  ✅ obstacle_fire_01.png
  ✅ item_treat.png
  ❌ CatBlack.png
  ❌ fire1.png
  ```

### 에셋 로딩 코드
```javascript
preload() {
  // 스프라이트 로딩
  this.load.image('cat_black', 'assets/sprites/characters/cat_black.png');
  this.load.image('obstacle_fire', 'assets/sprites/obstacles/fire.png');
  
  // 오디오 로딩
  this.load.audio('jump_sound', 'assets/sounds/sfx/jump.mp3');
  this.load.audio('bg_music', 'assets/sounds/music/stage1_dark.mp3');
}
```

---

## 🔢 상수 정의

### constants.js 파일 구조
```javascript
// src/utils/constants.js

// ===== 게임 설정 =====
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const GRAVITY = 800;

// ===== 플레이어 설정 =====
export const PLAYER_SPEED = 200;
export const JUMP_VELOCITY = -400;
export const PLAYER_SIZE = 32;

// ===== 장애물 설정 =====
export const OBSTACLE_SPAWN_INTERVAL = 2000; // ms
export const OBSTACLE_SPEED = 150;

// ===== 스테이지 색상 (HEX) =====
export const STAGE_COLORS = {
  DARK: 0x2C3E50,      // 어두운 회색
  BLUE: 0x3498DB,      // 푸른빛
  WARM: 0xE67E22,      // 따뜻한 색
  RAINBOW: 0xFFFFFF    // 무지개 (흰색 베이스)
};

// ===== 애니메이션 프레임 레이트 =====
export const ANIMATION_FPS = {
  IDLE: 6,
  RUN: 10,
  JUMP: 8
};

// ===== 씬 이름 =====
export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  CHARACTER_SELECT: 'CharacterSelectScene',
  GAME: 'GameScene',
  ENDING: 'EndingScene'
};
```

### 사용 예시
```javascript
import { PLAYER_SPEED, JUMP_VELOCITY, STAGE_COLORS } from '../utils/constants.js';

// ✅ Good
this.player.setVelocityX(PLAYER_SPEED);
this.player.setVelocityY(JUMP_VELOCITY);
this.cameras.main.setBackgroundColor(STAGE_COLORS.DARK);

// ❌ Bad - 매직 넘버 사용
this.player.setVelocityX(200);
this.player.setVelocityY(-400);
this.cameras.main.setBackgroundColor(0x2C3E50);
```

---

## 🔄 Git 커밋 메시지 규칙

```bash
# 형식
[타입] 간단한 설명

# 예시
✅ [feat] 캐릭터 점프 기능 추가
✅ [fix] 충돌 감지 버그 수정
✅ [style] 코드 포매팅 정리
✅ [refactor] 장애물 생성 로직 개선
✅ [docs] README 업데이트
✅ [asset] 고양이 스프라이트 추가

# 타입 목록
feat     - 새 기능
fix      - 버그 수정
style    - 코드 스타일 (동작 변화 없음)
refactor - 리팩토링
docs     - 문서
asset    - 에셋 추가/수정
test     - 테스트
chore    - 기타 (설정 등)
```

---

## 📦 import 순서 규칙

```javascript
// 1. 외부 라이브러리
import Phaser from 'phaser';

// 2. 내부 유틸리티
import { PLAYER_SPEED, JUMP_VELOCITY } from '../utils/constants.js';
import { analyzeColor } from '../utils/colorAnalyzer.js';

// 3. 내부 클래스/컴포넌트
import CharacterCreator from '../characters/CharacterCreator.js';

// (빈 줄)

// 4. 클래스 정의 시작
export default class GameScene extends Phaser.Scene {
  // ...
}
```

---

## 🎯 코드 리뷰 체크리스트

코드 작성 후 확인:
- [ ] 변수/함수명이 의미 있는가?
- [ ] 매직 넘버를 constants.js에서 가져왔는가?
- [ ] 주석이 "왜"를 설명하는가?
- [ ] 씬 메서드 순서가 규칙을 따르는가?
- [ ] 에셋 이름이 snake_case인가?
- [ ] 세미콜론이 있는가?

---

## 💡 예시: 좋은 코드 vs 나쁜 코드

### ❌ Bad
```javascript
import Phaser from 'phaser'
export default class g extends Phaser.Scene {
  constructor() {
    super('g')
  }
  create() {
    this.p = this.physics.add.sprite(100, 450, 'player')
    this.p.setVelocityX(200)
  }
  update() {
    if (this.input.keyboard.addKey('SPACE').isDown) {
      this.p.setVelocityY(-400)
    }
  }
}
```

### ✅ Good
```javascript
import Phaser from 'phaser';
import { PLAYER_SPEED, JUMP_VELOCITY } from '../utils/constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.initPlayer();
    this.initControls();
  }

  update() {
    this.handlePlayerInput();
  }

  initPlayer() {
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setVelocityX(PLAYER_SPEED);
  }

  initControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  handlePlayerInput() {
    if (this.cursors.space.isDown) {
      this.player.setVelocityY(JUMP_VELOCITY);
    }
  }
}
```

---

## 🚀 시작 전 체크리스트

새로운 기능을 개발하기 전:
1. [ ] constants.js에 필요한 상수 추가
2. [ ] 파일명이 규칙에 맞는지 확인
3. [ ] 에셋 폴더 구조 확인
4. [ ] import 순서 확인

---

**이 규칙을 따르면 코드가 깔끔하고 유지보수하기 쉬워집니다!** 🎉
