// The Last Semester
// majority of the code was written by AI (except a few parts) - the comments, concept, logic, design, and assets were all created by us.
// the game, player, levels, quiz, and drawing are all in here

// game is the main object that controls everything happening on screen
// the other vars hold images and quiz data that everything else needs
let game;
let questionPayload;
let playerSprites;
let uiImages;
let fullscreenRequested = false;

// player_art stores the pixel heights for each pose so the drawing stays conistent
const PLAYER_ART = {
  commuteHeight: 118,
  crouchHeight: 82,
  introHeight: 220
};

// this returns the backup questions from config if the json file hasnt loaded yet
function getQuestionFallbackSet() {
  return typeof QUESTION_FALLBACK !== "undefined" && Array.isArray(QUESTION_FALLBACK)
    ? QUESTION_FALLBACK
    : [];
}

// once the real questions.json loads, this function puts them into the game
function applyQuestionPayload(payload) {
  if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
    return;
  }
  questionPayload = payload;
  if (game) {
    game.questions = payload.questions;
  }
}

// this fetches the quiz questions from the json file, tries two paths just in case
// cache no-store makes sure we always get the newest version and not a old cached one
function loadQuestionPayload(pathIndex = 0) {
  const questionPaths = ["assets/data/questions.json", "questions.json"];
  if (typeof fetch !== "function" || pathIndex >= questionPaths.length) {
    return;
  }
  fetch(questionPaths[pathIndex], { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Question fetch failed: ${questionPaths[pathIndex]}`);
      }
      return response.json();
    })
    .then((payload) => {
      applyQuestionPayload(payload);
    })
    .catch(() => {
      loadQuestionPayload(pathIndex + 1);
    });
}

// loadPlayerImage wraps p5 loadImage with a silent error handler so missing files dont crash
function loadPlayerImage(path) {
  return loadImage(path, undefined, function handlePlayerImageError() {});
}

// loadUiImage does the same thing but for interface pictures like buttons and stickers
function loadUiImage(path) {
  return loadImage(path, undefined, function handleUiImageError() {});
}

// this loads all the ui images at once and bundles them into one object
// that way any part of the game can grab them by name insted of loading them again
function loadUiImageSet() {
  return {
    answerCorrect: loadUiImage("assets/ui/answer_correct.jpg"),
    answerWrong: loadUiImage("assets/ui/answer_wrong.jpg"),
    instagramLogo: loadUiImage("assets/ui/instagram-logo.svg"),
    diplomaPassedSticker: loadUiImage("assets/ui/diploma_sticker.png"),
    diplomaFailedSticker: loadUiImage("assets/ui/diploma_failed.jpg")
  };
}

// this tries to go fullscreen when the player clicks start
// the flag makes sure we only ask once so the browser dosnt block it
function requestGameFullscreen() {
  if (fullscreenRequested || typeof document === "undefined") {
    return;
  }
  const rootElement = document.documentElement;
  if (!rootElement) {
    return;
  }
  const activeFullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
  if (activeFullscreenElement) {
    fullscreenRequested = true;
    return;
  }
  const requestFullscreen = rootElement.requestFullscreen || rootElement.webkitRequestFullscreen || rootElement.msRequestFullscreen;
  if (typeof requestFullscreen !== "function") {
    return;
  }
  try {
    const requestResult = requestFullscreen.call(rootElement);
    fullscreenRequested = true;
    if (requestResult && typeof requestResult.catch === "function") {
      requestResult.catch(() => {
        fullscreenRequested = false;
      });
    }
  } catch (error) {
    fullscreenRequested = false;
  }
}

// this loads every player animation frame and groups them by pose name
function loadPlayerSpriteSet() {
  return {
    crouch: loadPlayerImage("assets/player/crouch.png"),
    idle: loadPlayerImage("assets/player/idle.png"),
    jump: loadPlayerImage("assets/player/jump.png"),
    landing: loadPlayerImage("assets/player/landing_from_jump.png"),
    readyToJump: loadPlayerImage("assets/player/ready_to_jump.png"),
    walk: [
      loadPlayerImage("assets/player/walk_1.png"),
      loadPlayerImage("assets/player/walk_2.png")
    ]
  };
}

// this scans the image pixels to find the non-transparent area
// that way the hitbox matches the actual art and not the whole image rectangle
function getOpaqueBounds(sprite) {
  if (!sprite || !sprite.width || !sprite.height) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  sprite.loadPixels();
  let minX = sprite.width;
  let minY = sprite.height;
  let maxX = -1;
  let maxY = -1;
  for (let pixelY = 0; pixelY < sprite.height; pixelY += 1) {
    for (let pixelX = 0; pixelX < sprite.width; pixelX += 1) {
      const alphaIndex = (pixelY * sprite.width + pixelX) * 4 + 3;
      if (sprite.pixels[alphaIndex] > 8) {
        minX = Math.min(minX, pixelX);
        minY = Math.min(minY, pixelY);
        maxX = Math.max(maxX, pixelX);
        maxY = Math.max(maxY, pixelY);
      }
    }
  }
  if (maxX < 0 || maxY < 0) {
    return { x: 0, y: 0, width: sprite.width, height: sprite.height };
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

// this takes a raw loaded image and figures out the bounds and aspect ratio for it
function preparePlayerSprite(sprite) {
  if (!sprite || !sprite.width || !sprite.height) {
    return null;
  }
  const bounds = getOpaqueBounds(sprite);
  return {
    image: sprite,
    bounds,
    aspectRatio: bounds.width / Math.max(bounds.height, 1)
  };
}

// runs preparePlayerSprite on every frame in the set so they are all ready to draw
function preparePlayerSpriteSet(spriteSet) {
  return {
    crouch: preparePlayerSprite(spriteSet.crouch),
    idle: preparePlayerSprite(spriteSet.idle),
    jump: preparePlayerSprite(spriteSet.jump),
    landing: preparePlayerSprite(spriteSet.landing),
    readyToJump: preparePlayerSprite(spriteSet.readyToJump),
    walk: spriteSet.walk.map((sprite) => preparePlayerSprite(sprite)).filter(Boolean)
  };
}

// draws a single player sprite at the given position and height, keeping the aspect ratio correct
function drawPlayerSprite(spriteData, positionX, floorY, targetHeight, options = {}) {
  if (!spriteData || !spriteData.image) {
    return false;
  }
  const { opacity = 255, offsetX = 0, offsetY = 0 } = options;
  const drawWidth = targetHeight * spriteData.aspectRatio;
  const drawX = positionX - drawWidth / 2 + offsetX;
  const drawY = floorY - targetHeight + offsetY;
  push();
  imageMode(CORNER);
  tint(255, opacity);
  image(
    spriteData.image,
    drawX,
    drawY,
    drawWidth,
    targetHeight,
    spriteData.bounds.x,
    spriteData.bounds.y,
    spriteData.bounds.width,
    spriteData.bounds.height
  );
  pop();
  return true;
}

// preload runs before anything else in p5, we use it to kick off all the image loading
function preload() {
  questionPayload = { questions: getQuestionFallbackSet() };
  playerSprites = loadPlayerSpriteSet();
  uiImages = loadUiImageSet();
}

function setup() {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const gameRoot = typeof document !== "undefined" ? document.getElementById("game-root") : null;
  if (gameRoot) {
    canvas.parent(gameRoot);
  }
  pixelDensity(1);
  noSmooth();
  frameRate(60);
  textFont("monospace");
  playerSprites = preparePlayerSpriteSet(playerSprites);
  loadQuestionPayload();
  const loadedQuestions = questionPayload && questionPayload.questions ? questionPayload.questions : getQuestionFallbackSet();
  game = new Game(loadedQuestions);
}

// draw runs 60 times per second and just tells the game to update then paint the frame
function draw() {
  game.update();
  game.render();
}

// p5 calls keyPressed whenever a key goes down, we hand it off to the game object
function keyPressed() {
  game.handleKeyPressed(key, keyCode);
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, ENTER].includes(keyCode)) {
    return false;
  }
  return true;
}

function keyReleased() {
  game.handleKeyReleased(key, keyCode);
  if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(keyCode)) {
    return false;
  }
  return true;
}

function mousePressed() {
  game.handleMousePressed(mouseX, mouseY);
  return false;
}

// clampValue makes sure a number doesnt go below the min or above the max
function clampValue(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

// rectsOverlap checks if two rectangles are touching each other, used for collision
function rectsOverlap(firstRect, secondRect) {
  return firstRect.left < secondRect.right &&
    firstRect.right > secondRect.left &&
    firstRect.top < secondRect.bottom &&
    firstRect.bottom > secondRect.top;
}

// drawPixelText draws bold text with a small dark shadow behind it so it pops off the background
function drawPixelText(label, positionX, positionY, size, fillColor, alignMode = LEFT) {
  push();
  textAlign(alignMode, BASELINE);
  textSize(size);
  textStyle(BOLD);
  noStroke();
  fill(COLORS.ink);
  text(label, positionX + 3, positionY + 3);
  fill(fillColor);
  text(label, positionX, positionY);
  pop();
}

// drawFlatPixelText is the same but without the shadow, used for places that dont need depth
function drawFlatPixelText(label, positionX, positionY, size, fillColor, alignMode = LEFT, verticalAlign = BASELINE) {
  push();
  textAlign(alignMode, verticalAlign);
  textSize(size);
  textStyle(BOLD);
  noStroke();
  fill(fillColor);
  text(label, positionX, positionY);
  pop();
}

// drawPanel draws a dark rounded box with a border and inner line to look like a game card
function drawPanel(positionX, positionY, panelWidth, panelHeight, fillColor = COLORS.panel) {
  push();
  stroke(COLORS.ink);
  strokeWeight(5);
  fill(fillColor);
  rect(positionX, positionY, panelWidth, panelHeight, 4);
  stroke(COLORS.paper);
  strokeWeight(2);
  noFill();
  rect(positionX + 7, positionY + 7, panelWidth - 14, panelHeight - 14, 2);
  pop();
}

// drawPixelButton draws a clickable button that can be selected, normal, or greyed out
function drawPixelButton(positionX, positionY, buttonWidth, buttonHeight, label, selected = false, disabled = false) {
  push();
  const baseColor = disabled ? "#5f6470" : selected ? COLORS.gold : COLORS.blue;
  const topColor = disabled ? "#777b86" : selected ? "#fff07a" : "#5c8df0";
  stroke(COLORS.ink);
  strokeWeight(5);
  fill(baseColor);
  rect(positionX, positionY, buttonWidth, buttonHeight, 4);
  noStroke();
  fill(topColor);
  rect(positionX + 7, positionY + 7, buttonWidth - 14, Math.max(8, buttonHeight * 0.24), 2);
  fill(COLORS.ink);
  textAlign(CENTER, CENTER);
  let buttonTextSize = 22;
  textSize(buttonTextSize);
  while (textWidth(label) > buttonWidth - 24 && buttonTextSize > 13) {
    buttonTextSize -= 1;
    textSize(buttonTextSize);
  }
  textStyle(BOLD);
  text(label, positionX + buttonWidth / 2 + 2, positionY + buttonHeight / 2 + 2);
  fill(disabled ? "#d6d6d6" : COLORS.paper);
  text(label, positionX + buttonWidth / 2, positionY + buttonHeight / 2);
  pop();
}

// drawArrowKeyGlyph draws a little arrow shape to show the player what key to press
function drawArrowKeyGlyph(positionX, positionY, direction, size, fillColor) {
  push();
  translate(positionX, positionY);
  if (direction === "down") {
    rotate(PI);
  }
  rectMode(CENTER);
  noStroke();
  fill(fillColor);
  rect(0, size * 0.08, size * 0.18, size * 0.46, 2);
  triangle(-size * 0.34, -size * 0.04, size * 0.34, -size * 0.04, 0, -size * 0.48);
  pop();
}

// drawEnterKeyGlyph draws the enter arrow symbol for the legend at the botom of the title screen
function drawEnterKeyGlyph(positionX, positionY, size, fillColor) {
  push();
  translate(positionX, positionY);
  stroke(fillColor);
  strokeWeight(6);
  strokeCap(SQUARE);
  strokeJoin(MITER);
  noFill();
  beginShape();
  vertex(-size * 0.34, -size * 0.24);
  vertex(size * 0.22, -size * 0.24);
  vertex(size * 0.22, size * 0.16);
  vertex(-size * 0.04, size * 0.16);
  endShape();
  noStroke();
  fill(fillColor);
  triangle(-size * 0.04, size * 0.16, -size * 0.04, size * 0.42, -size * 0.34, size * 0.16);
  pop();
}

// draws one key icon in the control legend, the type decides if its an arrow or enter
function drawControlLegendKey(positionX, positionY, controlType, label) {
  const keyWidth = 90;
  const keyHeight = 66;
  push();
  stroke(COLORS.ink);
  strokeWeight(4);
  fill("#25324d");
  rect(positionX - keyWidth / 2, positionY, keyWidth, keyHeight, 6);
  noStroke();
  fill("#456493");
  rect(positionX - keyWidth / 2 + 6, positionY + 6, keyWidth - 12, 13, 3);
  fill("#8fd7ff");
  rect(positionX - keyWidth / 2 + 14, positionY + 11, keyWidth - 28, 4, 2);

  if (controlType === "up" || controlType === "down") {
    drawArrowKeyGlyph(positionX, positionY + keyHeight / 2 + 7, controlType, 36, COLORS.paper);
  } else if (controlType === "enter") {
    drawEnterKeyGlyph(positionX, positionY + keyHeight / 2 + 5, 42, COLORS.paper);
  }

  drawPixelText(label, positionX, positionY + keyHeight + 30, 18, COLORS.paper, CENTER);
  pop();
}

// draws the whole row of key hints at the bottom of the title screen
function drawTitleControlLegend(positionX, positionY) {
  const controls = [
    { type: "up", label: "Jump" },
    { type: "down", label: "Crouch" },
    { type: "enter", label: "Confirm" }
  ];
  const keyGap = 164;
  const startX = positionX - keyGap;
  for (let controlIndex = 0; controlIndex < controls.length; controlIndex += 1) {
    const control = controls[controlIndex];
    drawControlLegendKey(startX + controlIndex * keyGap, positionY, control.type, control.label);
  }
}

// drawProgressBar shows a filled bar that grows from 0 to full based on the amount value
function drawProgressBar(positionX, positionY, barWidth, barHeight, amount, fillColor) {
  push();
  stroke(COLORS.ink);
  strokeWeight(4);
  fill(COLORS.panelDark);
  rect(positionX, positionY, barWidth, barHeight, 3);
  noStroke();
  fill(fillColor);
  rect(positionX + 5, positionY + 5, (barWidth - 10) * clampValue(amount, 0, 1), barHeight - 10, 2);
  pop();
}

// drawWrappedText breaks long text into multiple lines so it fits in the given box width
function drawWrappedText(label, positionX, positionY, boxWidth, lineHeight, size, fillColor, alignMode = LEFT) {
  push();
  textSize(size);
  textStyle(BOLD);
  textAlign(alignMode, TOP);
  noStroke();
  const words = label.split(" ");
  let line = "";
  let currentY = positionY;
  for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
    const testLine = line.length > 0 ? `${line} ${words[wordIndex]}` : words[wordIndex];
    if (textWidth(testLine) > boxWidth && line.length > 0) {
      fill(COLORS.ink);
      text(line, positionX + 2, currentY + 2);
      fill(fillColor);
      text(line, positionX, currentY);
      line = words[wordIndex];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  fill(COLORS.ink);
  text(line, positionX + 2, currentY + 2);
  fill(fillColor);
  text(line, positionX, currentY);
  pop();
}

// AudioManager makes simple beep sounds using the web audio api so we dont need sound files
class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  ensureReady() {
    if (!this.enabled || this.context) {
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.context = new AudioContextClass();
    }
  }

  playTone(frequency, duration, type = "square", volume = 0.045) {
    if (!this.enabled || !this.context) {
      return;
    }
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }

  menu() {
    this.playTone(540, 0.08, "square", 0.035);
  }

  jump() {
    this.playTone(720, 0.1, "square", 0.04);
  }

  hit() {
    this.playTone(150, 0.16, "sawtooth", 0.055);
  }

  correct() {
    this.playTone(740, 0.08, "square", 0.035);
    setTimeout(() => this.playTone(990, 0.1, "square", 0.035), 70);
  }

  wrong() {
    this.playTone(260, 0.12, "triangle", 0.045);
  }

  success() {
    this.playTone(660, 0.08, "square", 0.04);
    setTimeout(() => this.playTone(880, 0.08, "square", 0.04), 80);
    setTimeout(() => this.playTone(1180, 0.14, "square", 0.04), 160);
  }

  fail() {
    this.playTone(240, 0.18, "triangle", 0.05);
    setTimeout(() => this.playTone(180, 0.22, "triangle", 0.045), 150);
  }

  countdown() {
    this.playTone(520, 0.04, "square", 0.025);
  }
}

// Game is the main class, it keeps track of what screen youre on and moves the game forward
class Game {
  constructor(questions) {
    this.questions = Array.isArray(questions) ? questions : getQuestionFallbackSet();
    // audio, ui, and keys are all set up at the start so they are ready to go
    this.audio = new AudioManager();
    this.ui = new UIManager(this);
    this.keys = { up: false, down: false };
    this.hotspots = [];
    // state tells the render function which screen to draw right now
    this.state = "title";
    this.previousState = "title";
    this.titlePulse = 0;
    this.screenShake = 0;
    this.loading = null;
    this.transitionTimer = 0;
    this.selectedDifficulty = DIFFICULTIES[1];
    this.resetRunValues();
  }

  resetRunValues() {
    // clears everything from the previous run so a new game starts fresh
    this.currentWeekIndex = 0;
    this.totalCredits = 0;
    this.weekLostCredits = 0;
    this.weekQuizCredits = 0;
    this.lastWeekStatus = "Ready";
    this.level = null;
    this.player = null;
    this.quiz = null;
    this.quizCountdownMarker = null;
  }

  get currentWeek() {
    return WEEK_CONFIGS[this.currentWeekIndex];
  }

  setState(nextState) {
    this.previousState = this.state;
    this.state = nextState;
    this.hotspots = [];
  }

  startLoading(nextState, label, durationFrames = 72, onDone = null) {
    // loading screen plays for a set number of frames then moves to nextState
    this.loading = {
      nextState,
      label,
      durationFrames,
      frame: 0,
      onDone
    };
    this.setState("loading");
  }

  startNewRun() {
    this.resetRunValues();
    this.startLoading("intro", "Loading semester files", 76);
  }

  startCommute() {
    this.weekLostCredits = 0;
    this.weekQuizCredits = 0;
    this.player = new Player();
    this.level = new LevelManager(this.currentWeek);
    this.setState("commute");
  }

  startDoorTransition() {
    this.transitionTimer = 0;
    this.setState("door-transition");
    this.audio.menu();
  }

  startQuiz() {
    // filters the full question list to only the questions for this week
    const weekQuestions = this.questions.filter((question) => question.week === this.currentWeek.id);
    this.quiz = new QuizManager(weekQuestions, this.currentWeek.id);
    this.quizCountdownMarker = null;
    this.setState("quiz");
  }

  finishQuiz() {
    this.weekQuizCredits = this.quiz.correctCount;
    this.totalCredits += this.weekQuizCredits;
    this.lastWeekStatus = this.buildWeekStatus();
    this.setState("week-summary");
  }

  buildWeekStatus() {
    const weeksRemaining = MAX_WEEKS - this.currentWeek.id;
    const maxRemaining = weeksRemaining * QUESTIONS_PER_WEEK;
    if (this.totalCredits >= this.selectedDifficulty.targetCredits) {
      return "Graduation target reached";
    }
    if (this.totalCredits + maxRemaining < this.selectedDifficulty.targetCredits) {
      return "Graduation is out of reach";
    }
    const expectedPace = (this.selectedDifficulty.targetCredits / MAX_WEEKS) * this.currentWeek.id;
    if (this.totalCredits >= expectedPace) {
      return "On track";
    }
    return "At risk";
  }

  advanceFromSummary() {
    if (this.currentWeekIndex < MAX_WEEKS - 1) {
      this.currentWeekIndex += 1;
      const label = this.currentWeek.loadingText;
      this.startLoading("week-intro", label, 72);
      return;
    }
    if (this.totalCredits >= this.selectedDifficulty.targetCredits) {
      this.setState("ending-success");
      this.audio.success();
    } else {
      this.setState("ending-fail");
      this.audio.fail();
    }
  }

  spendCreditPenalty() {
    // hitting an obstacle takes one credit and shakes the screen to show the damage
    this.totalCredits -= 1;
    this.weekLostCredits += 1;
    this.screenShake = 12;
    this.audio.hit();
  }

  update() {
    // titlePulse animates the start button bobbing up and down
    this.titlePulse += 0.04;
    if (this.screenShake > 0) {
      this.screenShake -= 1;
    }
    if (this.state === "loading") {
      this.loading.frame += 1;
      if (this.loading.frame >= this.loading.durationFrames) {
        const doneAction = this.loading.onDone;
        const nextState = this.loading.nextState;
        this.loading = null;
        if (doneAction) {
          doneAction();
        }
        this.setState(nextState);
      }
    }
    if (this.state === "commute") {
      this.player.update(this.keys, this.audio);
      this.level.update(this.player, this);
      if (this.level.complete) {
        this.startDoorTransition();
      }
    }
    if (this.state === "door-transition") {
      this.transitionTimer += 1;
      if (this.transitionTimer > 96) {
        this.startQuiz();
      }
    }
    if (this.state === "quiz") {
      this.quiz.update(deltaTime / 1000);
      if (this.quiz.timer <= 10 && this.quiz.timer > 0) {
        const marker = Math.ceil(this.quiz.timer);
        if (marker !== this.quizCountdownMarker) {
          this.quizCountdownMarker = marker;
          this.audio.countdown();
        }
      }
      if (this.quiz.complete) {
        this.finishQuiz();
      }
    }
  }

  render() {
    // clear hotspots each frame so old click areas dont linger
    this.hotspots = [];
    push();
    // screen shake translates the whole frame by a small random amount
    if (this.screenShake > 0) {
      translate(random(-4, 4), random(-3, 3));
    }
    if (this.state === "title") {
      this.renderTitle();
    } else if (this.state === "difficulty-select") {
      this.renderDifficultySelect();
    } else if (this.state === "intro") {
      this.renderIntro();
    } else if (this.state === "loading") {
      this.renderLoading();
    } else if (this.state === "week-intro") {
      this.renderWeekIntro();
    } else if (this.state === "commute") {
      this.level.render();
      this.player.render();
      this.ui.renderCommuteHud();
    } else if (this.state === "door-transition") {
      this.renderDoorTransition();
    } else if (this.state === "quiz") {
      this.renderQuiz();
    } else if (this.state === "week-summary") {
      this.renderWeekSummary();
    } else if (this.state === "ending-success") {
      this.renderEnding(true);
    } else if (this.state === "ending-fail") {
      this.renderEnding(false);
    }
    pop();
  }

  renderTitle() {
    drawTitleClassroomBackdrop(frameCount * 0.8);
    drawBlackboard(210, 76, 860, 356);
    drawPixelText("THE LAST", 640, 202, 64, COLORS.paper, CENTER);
    drawPixelText("SEMESTER", 640, 288, 76, COLORS.gold, CENTER);
    drawPixelText("5 WEEKS TO GRADUATION", 640, 360, 24, "#8fd7ff", CENTER);
    const pulseOffset = Math.sin(this.titlePulse) * 5;
    drawPixelButton(490, 485 + pulseOffset, 300, 64, "START", false);
    this.addHotspot("start", 490, 470, 300, 92, () => {
      requestGameFullscreen();
      this.audio.menu();
      this.setState("difficulty-select");
    });
    drawTitleControlLegend(640, 574);
  }

  renderDifficultySelect() {
    drawMenuBackdrop("#5fa8ff", "#183b73");
    noStroke();
    fill(17, 24, 39, 150);
    rect(226, 82, 828, 126, 4);
    drawPixelText("CHOOSE GRADUATION TARGET", 285, 118, 42, COLORS.gold, LEFT);
    drawPixelText("Credits can drop during the commute. Quizzes earn them back.", 287, 166, 22, COLORS.paper, LEFT);
    const cardWidth = 280;
    const cardHeight = 286;
    const cardGap = 30;
    const cardsStartX = (CANVAS_WIDTH - cardWidth * DIFFICULTIES.length - cardGap * (DIFFICULTIES.length - 1)) / 2;
    const cardY = 220;
    for (let difficultyIndex = 0; difficultyIndex < DIFFICULTIES.length; difficultyIndex += 1) {
      const difficulty = DIFFICULTIES[difficultyIndex];
      const cardX = cardsStartX + difficultyIndex * (cardWidth + cardGap);
      const isSelected = this.selectedDifficulty.id === difficulty.id;
      drawPanel(cardX, cardY, cardWidth, cardHeight, isSelected ? "#3c4f7e" : "#202b45");
      drawPixelText(difficulty.label.toUpperCase(), cardX + 40, cardY + 64, 30, isSelected ? COLORS.gold : COLORS.paper, LEFT);
      drawPixelText(`${difficulty.targetCredits} CREDITS`, cardX + 40, cardY + 112, 24, "#8fd7ff", LEFT);
      drawWrappedText(difficulty.description, cardX + 40, cardY + 150, cardWidth - 80, 27, 18, COLORS.paper, LEFT);
      drawPixelButton(cardX + 42, cardY + 218, cardWidth - 84, 50, `${difficultyIndex + 1}`, isSelected);
      this.addHotspot(`difficulty-${difficulty.id}`, cardX, cardY, cardWidth, cardHeight, () => {
        this.selectedDifficulty = difficulty;
        this.audio.menu();
      });
    }
    drawPixelButton(470, 582, 340, 62, "BEGIN", true);
    this.addHotspot("begin-run", 470, 582, 340, 62, () => {
      requestGameFullscreen();
      this.audio.menu();
      this.startNewRun();
    });
  }

  renderIntro() {
    const portraitCenterX = 930;
    const portraitShadowY = 472;
    const portraitFloorY = 468;
    const briefingTextX = 282;
    const briefingTextWidth = 468;
    drawClassroomBackdrop();
    drawPanel(176, 112, 928, 462, "#19273e");
    drawPanel(818, 156, 224, 332, "#213250");
    noStroke();
    fill(12, 21, 36, 90);
    rect(834, 172, 192, 300, 4);
    fill(12, 17, 30, 110);
    ellipse(portraitCenterX, portraitShadowY, 118, 18);
    drawPlayerSprite(playerSprites.idle, portraitCenterX, portraitFloorY, PLAYER_ART.introHeight);
    drawPixelText("SEMESTER BRIEFING", briefingTextX, 180, 42, COLORS.gold, LEFT);
    drawWrappedText("Survive five weeks of auto-running commutes, dodge student-life distractions, and answer COD 208 quiz questions before the timer runs out.", briefingTextX, 245, briefingTextWidth, 34, 25, COLORS.paper, LEFT);
    drawWrappedText(`Target: ${this.selectedDifficulty.targetCredits} credits on ${this.selectedDifficulty.label}. Each week quiz is worth 6 credits.`, briefingTextX, 432, briefingTextWidth, 32, 23, "#8fd7ff", LEFT);
    drawWrappedText("Obstacles cost 1 credit.", briefingTextX, 496, briefingTextWidth, 32, 23, COLORS.red, LEFT);
    drawPixelButton(464, 610, 352, 58, "WEEK 1", true);
    this.addHotspot("intro-next", 464, 610, 352, 58, () => {
      requestGameFullscreen();
      this.audio.menu();
      this.startLoading("week-intro", this.currentWeek.loadingText, 72);
    });
  }

  renderLoading() {
    const progress = this.loading ? this.loading.frame / this.loading.durationFrames : 1;
    drawLoadingStudyScene(progress);
    drawPixelText("OPENING COURSE BOOK", 640, 120, 38, COLORS.gold, CENTER);
    drawWrappedText(this.loading ? this.loading.label.toUpperCase() : "READY", 640, 162, 620, 28, 22, COLORS.paper, CENTER);
    drawProgressBar(392, 612, 496, 34, progress, COLORS.green);
  }

  renderWeekIntro() {
    drawEnvironmentPreview(this.currentWeek, frameCount * 0.4);
    drawPanel(238, 126, 804, 430, "#17243a");
    drawPixelText(`WEEK ${this.currentWeek.id}`, 514, 205, 62, COLORS.gold, LEFT);
    drawPixelText(this.currentWeek.title.toUpperCase(), 334, 276, 34, COLORS.paper, LEFT);
    drawWrappedText(this.currentWeek.subtitle, 334, 326, 610, 28, 22, "#8fd7ff", LEFT);
    drawPixelText(`CREDITS: ${this.totalCredits} / ${this.selectedDifficulty.targetCredits}`, 392, 412, 25, COLORS.paper, LEFT);
    drawPixelButton(468, 592, 344, 58, "COMMUTE", true);
    this.addHotspot("week-start", 468, 592, 344, 58, () => {
      requestGameFullscreen();
      this.audio.menu();
      this.startCommute();
    });
  }

  renderDoorTransition() {
    this.level.render();
    this.player.render();
    const progress = clampValue(this.transitionTimer / 96, 0, 1);
    const wipeWidth = CANVAS_WIDTH * progress;
    noStroke();
    fill(12, 17, 30, 220);
    rect(0, 0, wipeWidth, CANVAS_HEIGHT);
    drawPanel(376, 238, 528, 198, "#13243d");
    drawPixelText("CLASSROOM FOUND", 434, 315, 36, COLORS.gold, LEFT);
    drawProgressBar(450, 365, 380, 30, progress, "#8fd7ff");
  }

  renderQuiz() {
    drawClassroomBackdrop();
    this.ui.renderQuizHud();
    this.quiz.render(this);
  }

  renderWeekSummary() {
    drawEnvironmentPreview(this.currentWeek, frameCount * 0.2);
    drawPanel(246, 112, 788, 480, "#182641");
    drawPixelText(`WEEK ${this.currentWeek.id} COMPLETE`, 364, 188, 40, COLORS.gold, LEFT);
    drawPixelText(`QUIZ CREDITS: +${this.weekQuizCredits}`, 382, 265, 28, COLORS.paper, LEFT);
    drawPixelText(`COMMUTE LOSSES: -${this.weekLostCredits}`, 382, 315, 28, this.weekLostCredits > 0 ? COLORS.red : COLORS.green, LEFT);
    drawPixelText(`TOTAL: ${this.totalCredits} / ${this.selectedDifficulty.targetCredits}`, 382, 365, 28, "#8fd7ff", LEFT);
    drawProgressBar(382, 404, 516, 34, this.totalCredits / this.selectedDifficulty.targetCredits, COLORS.gold);
    drawPixelText(this.lastWeekStatus.toUpperCase(), 382, 476, 24, COLORS.paper, LEFT);
    drawPixelButton(466, 620, 348, 58, this.currentWeekIndex < MAX_WEEKS - 1 ? "NEXT WEEK" : "RESULTS", true);
    this.addHotspot("summary-next", 466, 620, 348, 58, () => {
      this.audio.menu();
      this.advanceFromSummary();
    });
  }

  renderEnding(succeeded) {
    drawEndingBackdrop(succeeded, frameCount);
    drawDiplomaDocument(248, 72, 784, 504, succeeded, this.totalCredits, this.selectedDifficulty.targetCredits, this.selectedDifficulty.label);
    drawPixelButton(344, 616, 264, 58, succeeded ? "NEW RUN" : "RETRY", true);
    this.addHotspot("ending-retry", 344, 616, 264, 58, () => {
      this.audio.menu();
      this.startNewRun();
    });
    drawPixelButton(672, 616, 264, 58, "MAIN MENU", false);
    this.addHotspot("ending-menu", 672, 616, 264, 58, () => {
      this.audio.menu();
      this.resetRunValues();
      this.setState("title");
    });
  }

  addHotspot(id, positionX, positionY, hotspotWidth, hotspotHeight, onClick) {
    this.hotspots.push({ id, positionX, positionY, hotspotWidth, hotspotHeight, onClick });
  }

  activatePrimary() {
    if (this.state === "title") {
      requestGameFullscreen();
      this.setState("difficulty-select");
      this.audio.menu();
    } else if (this.state === "difficulty-select") {
      requestGameFullscreen();
      this.startNewRun();
      this.audio.menu();
    } else if (this.state === "intro") {
      requestGameFullscreen();
      this.startLoading("week-intro", this.currentWeek.loadingText, 72);
      this.audio.menu();
    } else if (this.state === "week-intro") {
      requestGameFullscreen();
      this.startCommute();
      this.audio.menu();
    } else if (this.state === "week-summary") {
      this.advanceFromSummary();
      this.audio.menu();
    } else if (this.state === "ending-success" || this.state === "ending-fail") {
      this.startNewRun();
      this.audio.menu();
    }
  }

  handleKeyPressed(pressedKey, pressedKeyCode) {
    this.audio.ensureReady();
    if (pressedKeyCode === UP_ARROW) {
      this.keys.up = true;
      if (this.state === "commute" && this.player.jump()) {
        this.audio.jump();
      }
    }
    if (pressedKeyCode === DOWN_ARROW) {
      this.keys.down = true;
    }
    if (pressedKeyCode === ENTER) {
      this.activatePrimary();
    }
    if (this.state === "difficulty-select") {
      const difficultyIndex = Number(pressedKey) - 1;
      if (difficultyIndex >= 0 && difficultyIndex < DIFFICULTIES.length) {
        this.selectedDifficulty = DIFFICULTIES[difficultyIndex];
        this.audio.menu();
      }
    }
    if (this.state === "quiz") {
      const answerIndex = Number(pressedKey) - 1;
      if (answerIndex >= 0 && answerIndex < 4) {
        this.quiz.answer(answerIndex, this.audio);
      }
    }
  }

  handleKeyReleased(releasedKey, releasedKeyCode) {
    if (releasedKeyCode === UP_ARROW) {
      this.keys.up = false;
    }
    if (releasedKeyCode === DOWN_ARROW) {
      this.keys.down = false;
    }
  }

  handleMousePressed(pointerX, pointerY) {
    // wake up audio on first click since browsers need user interaction first
    this.audio.ensureReady();
    // loop backwards so the last added hotspot wins if two overlap
    for (let hotspotIndex = this.hotspots.length - 1; hotspotIndex >= 0; hotspotIndex -= 1) {
      const hotspot = this.hotspots[hotspotIndex];
      const insideX = pointerX >= hotspot.positionX && pointerX <= hotspot.positionX + hotspot.hotspotWidth;
      const insideY = pointerY >= hotspot.positionY && pointerY <= hotspot.positionY + hotspot.hotspotHeight;
      if (insideX && insideY) {
        hotspot.onClick();
        return;
      }
    }
  }
}

// Player handles jumping, crouching, gravity, and which sprite frame to show
class Player {
  constructor() {
    // player starts near the left side of the screen and stays at ground level
    this.positionX = 218;
    this.positionY = GROUND_Y;
    this.width = 54;
    this.standingHeight = 88;
    this.crouchHeight = 52;
    this.velocityY = 0;
    this.grounded = true;
    this.crouching = false;
    // invulnerableFrames count down after a hit so the player cant take damage again right away
    this.invulnerableFrames = 0;
    this.jumpTakeoffFrames = 0;
    this.landingFrames = 0;
    this.runFrame = 0;
  }

  get height() {
    return this.crouching ? this.crouchHeight : this.standingHeight;
  }

  jump() {
    // cant jump again if already in the air
    if (!this.grounded) {
      return false;
    }
    this.velocityY = -19.5;
    this.grounded = false;
    this.crouching = false;
    this.jumpTakeoffFrames = 6;
    this.landingFrames = 0;
    return true;
  }

  update(keys) {
    const wasGrounded = this.grounded;
    // only cycle the walk animation when on the ground and not crouching
    const runningOnGround = this.grounded && !keys.down && playerSprites.walk.length > 0;
    this.runFrame = runningOnGround
      ? (this.runFrame + 0.12) % playerSprites.walk.length
      : 0;
    if (this.grounded) {
      this.crouching = keys.down;
    }
    this.velocityY += this.velocityY < 0 ? 0.95 : 1.2;
    this.velocityY = clampValue(this.velocityY, -22, 24);
    this.positionY += this.velocityY;
    if (this.positionY >= GROUND_Y) {
      this.positionY = GROUND_Y;
      this.velocityY = 0;
      this.grounded = true;
      if (!wasGrounded) {
        this.landingFrames = 7;
      }
    } else {
      this.grounded = false;
    }
    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames -= 1;
    }
    if (this.jumpTakeoffFrames > 0) {
      this.jumpTakeoffFrames -= 1;
    }
    if (this.landingFrames > 0 && this.grounded) {
      this.landingFrames -= 1;
    }
  }

  hit() {
    // 60 frames is one second of invulnerability after getting hit
    this.invulnerableFrames = 60;
  }

  getBounds() {
    const currentHeight = this.height;
    return {
      left: this.positionX - this.width / 2,
      right: this.positionX + this.width / 2,
      top: this.positionY - currentHeight,
      bottom: this.positionY
    };
  }

  getCurrentSprite() {
    if (this.landingFrames > 0 && this.grounded && playerSprites.landing) {
      return playerSprites.landing;
    }
    if (this.crouching && this.grounded) {
      return playerSprites.crouch;
    }
    if (!this.grounded) {
      if (this.jumpTakeoffFrames > 0 && playerSprites.readyToJump) {
        return playerSprites.readyToJump;
      }
      if (playerSprites.jump) {
        return playerSprites.jump;
      }
    }
    if (!playerSprites.walk.length) {
      return null;
    }
    const walkFrameIndex = Math.floor(this.runFrame) % playerSprites.walk.length;
    return playerSprites.walk[walkFrameIndex];
  }

  getSpriteHeight() {
    return this.crouching && this.grounded ? PLAYER_ART.crouchHeight : PLAYER_ART.commuteHeight;
  }

  renderFallback(bounds) {
    push();
    translate(bounds.left, bounds.top);
    stroke(COLORS.ink);
    strokeWeight(4);
    fill("#f4f1e8");
    rect(0, 0, this.width, this.height, 2);
    noStroke();
    fill("#c9d7ee");
    rect(7, 8, this.width - 14, this.height - 16, 1);
    fill(COLORS.blue);
    rect(10, this.height - 12, 12, 8, 1);
    rect(this.width - 22, this.height - 12, 12, 8, 1);
    fill(COLORS.gold);
    const stepOffset = this.grounded ? Math.floor(Math.sin(this.runFrame) * 3) : -3;
    rect(10, this.height - 2 + stepOffset, 12, 8, 1);
    rect(this.width - 22, this.height - 2 - stepOffset, 12, 8, 1);
    pop();
  }

  render() {
    const bounds = this.getBounds();
    // flicker makes the player flash when invulnerable so you can see the hit
    const flicker = this.invulnerableFrames > 0 && frameCount % 6 < 3;
    if (flicker) {
      return;
    }
    const currentSprite = this.getCurrentSprite();
    if (currentSprite) {
      push();
      noStroke();
      fill(12, 17, 30, this.grounded ? 92 : 48);
      ellipse(this.positionX, this.positionY + 4, this.crouching ? 58 : 70, this.crouching ? 14 : 18);
      pop();
      if (drawPlayerSprite(currentSprite, this.positionX, this.positionY + 2, this.getSpriteHeight())) {
        return;
      }
    }
    this.renderFallback(bounds);
  }
}

// LevelManager scrolls the world, places obstacles, and knows when the door is reached
class LevelManager {
  constructor(weekConfig) {
    this.weekConfig = weekConfig;
    this.scroll = 0;
    this.complete = false;
    this.obstacles = this.buildObstacles();
    this.doorWorldX = weekConfig.length;
  }

  buildObstacles() {
    const obstacles = [];
    // start placing obstacles a good distance in so the player has time to settle
    let worldX = 920;
    let patternIndex = 0;
    while (worldX < this.weekConfig.length - 600) {
      const patternName = this.weekConfig.patterns[patternIndex % this.weekConfig.patterns.length];
      const pattern = PATTERN_LIBRARY[patternName];
      let patternSpan = 0;
      for (let obstacleIndex = 0; obstacleIndex < pattern.length; obstacleIndex += 1) {
        const entry = pattern[obstacleIndex];
        const obstacleWorldX = worldX + entry.offset;
        if (obstacleWorldX < this.weekConfig.length - 500) {
          obstacles.push(new Obstacle(entry.type, obstacleWorldX));
        }
        patternSpan = Math.max(patternSpan, entry.offset);
      }
      const recoveryGap = pattern.length > 1 ? 140 : 0;
      worldX += patternSpan + this.weekConfig.spacing + recoveryGap + (patternIndex % 3) * 65;
      patternIndex += 1;
    }
    return obstacles;
  }

  update(player, gameInstance) {
    this.scroll += this.weekConfig.speed;
    for (let obstacleIndex = 0; obstacleIndex < this.obstacles.length; obstacleIndex += 1) {
      const obstacle = this.obstacles[obstacleIndex];
      obstacle.update(this.scroll);
      if (!obstacle.damaged && player.invulnerableFrames <= 0 && rectsOverlap(player.getBounds(), obstacle.getBounds())) {
        obstacle.damaged = true;
        player.hit();
        gameInstance.spendCreditPenalty();
      }
    }
    const doorX = this.doorWorldX - this.scroll;
    if (doorX < player.positionX + 56) {
      this.complete = true;
    }
  }

  render() {
    drawWeekBackground(this.weekConfig, this.scroll);
    drawWeekGround(this.weekConfig, this.scroll);
    for (let obstacleIndex = 0; obstacleIndex < this.obstacles.length; obstacleIndex += 1) {
      this.obstacles[obstacleIndex].render(this.scroll, this.weekConfig.palette);
    }
    drawClassroomDoor(this.doorWorldX - this.scroll, this.weekConfig.palette);
  }

  getProgress() {
    // returns 0 at the start and 1 when the level is done, used for the progress bar
    return clampValue(this.scroll / this.weekConfig.length, 0, 1);
  }
}

// Obstacle stores the type, world position, and whether the player already hit it
class Obstacle {
  constructor(type, worldX) {
    this.type = type;
    this.worldX = worldX;
    this.def = OBSTACLE_DEFS[type];
    this.damaged = false;
    this.screenX = worldX;
  }

  update(scroll) {
    this.screenX = this.worldX - scroll;
  }

  getPositionY() {
    if (this.type === "disco") {
      return GROUND_Y - 160;
    }
    return GROUND_Y - this.def.height;
  }

  getBounds() {
    const inset = this.def.colliderInset;
    const positionY = this.getPositionY();
    return {
      left: this.screenX + inset,
      right: this.screenX + this.def.width - inset,
      top: positionY + inset,
      bottom: positionY + this.def.height - inset
    };
  }

  render(scroll, palette) {
    this.update(scroll);
    if (this.screenX < -180 || this.screenX > CANVAS_WIDTH + 180) {
      return;
    }
    if (this.type === "bed") {
      drawBedObstacle(this.screenX, this.getPositionY(), this.damaged);
    } else if (this.type === "disco") {
      drawDiscoObstacle(this.screenX, this.getPositionY(), this.damaged, palette.accent);
    } else if (this.type === "phone") {
      drawPhoneObstacle(this.screenX, this.getPositionY(), this.damaged);
    }
  }
}

// QuizManager runs the timed quiz at the end of each commute week
// it handles the questions, the timer, detecting right answers, and showing the feedback
class QuizManager {
  constructor(questions, weekNumber) {
    this.questions = questions.slice(0, QUESTIONS_PER_WEEK);
    const fallbackQuestions = getQuestionFallbackSet();
    while (this.questions.length < QUESTIONS_PER_WEEK) {
      const fallback = fallbackQuestions.find((question) => question.week === weekNumber);
      if (!fallback) {
        break;
      }
      this.questions.push(fallback);
    }
    this.weekNumber = weekNumber;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.timer = QUIZ_SECONDS;
    this.complete = false;
    this.feedbackFrames = 0;
    this.selectedIndex = null;
  }

  get currentQuestion() {
    return this.questions[this.currentIndex];
  }

  update(deltaSeconds) {
    if (this.complete) {
      return;
    }
    this.timer -= deltaSeconds;
    if (this.timer <= 0) {
      this.timer = 0;
      this.complete = true;
      return;
    }
    if (this.feedbackFrames > 0) {
      this.feedbackFrames -= 1;
      if (this.feedbackFrames === 0) {
        this.currentIndex += 1;
        this.selectedIndex = null;
        if (this.currentIndex >= this.questions.length) {
          this.complete = true;
        }
      }
    }
  }

  answer(answerIndex, audio) {
    if (this.complete || this.feedbackFrames > 0) {
      return;
    }
    this.selectedIndex = answerIndex;
    const correct = this.isCorrectAnswer(answerIndex);
    if (correct) {
      this.correctCount += 1;
      audio.correct();
    } else {
      audio.wrong();
    }
    this.feedbackFrames = 24;
  }

  isCorrectAnswer(answerIndex) {
    // correctIndex can be a number or an array of numbers, both cases handeld here
    const { correctIndex } = this.currentQuestion;
    if (Array.isArray(correctIndex)) {
      return correctIndex.includes(answerIndex);
    }
    return answerIndex === correctIndex;
  }

  render(gameInstance) {
    const questionBoxY = 162;
    const questionBoxHeight = 132;
    const answerStartY = 348;
    const showingFeedback = this.feedbackFrames > 0;
    const correct = showingFeedback && this.isCorrectAnswer(this.selectedIndex);
    const feedbackImage = uiImages && (correct ? uiImages.answerCorrect : uiImages.answerWrong);
    drawPanel(140, 134, 1000, 452, "#f4f1e8");
    fill("#14213a");
    noStroke();
    rect(166, questionBoxY, 948, questionBoxHeight, 3);
    drawPixelText(`QUESTION ${this.currentIndex + 1} / ${this.questions.length}`, 188, 202, 22, COLORS.gold, LEFT);
    drawWrappedText(this.currentQuestion.prompt, 188, 228, showingFeedback ? 690 : 890, 30, 23, COLORS.paper, LEFT);
    if (showingFeedback) {
      drawQuizFeedbackImage(1008, 228, 88, feedbackImage, correct ? COLORS.green : COLORS.red);
    }
    for (let answerIndex = 0; answerIndex < this.currentQuestion.options.length; answerIndex += 1) {
      const buttonX = 188 + (answerIndex % 2) * 456;
      const buttonY = answerStartY + Math.floor(answerIndex / 2) * 104;
      let selected = false;
      let disabled = false;
      if (showingFeedback) {
        selected = this.isCorrectAnswer(answerIndex);
        disabled = !this.isCorrectAnswer(answerIndex);
      } else {
        selected = answerIndex === this.selectedIndex;
      }
      drawPixelButton(buttonX, buttonY, 410, 72, `${answerIndex + 1}. ${this.currentQuestion.options[answerIndex]}`, selected, disabled);
      gameInstance.addHotspot(`answer-${answerIndex}`, buttonX, buttonY, 410, 72, () => {
        this.answer(answerIndex, gameInstance.audio);
      });
    }
    if (showingFeedback) {
      drawPixelText(correct ? "CORRECT" : "MISSED", 548, 548, 26, correct ? COLORS.green : COLORS.red, LEFT);
    }
  }
}

// UIManager draws the score and timer panels on top of the game so they dont get mixed in with the world
class UIManager {
  constructor(gameInstance) {
    this.game = gameInstance;
  }

  renderCommuteHud() {
    drawPanel(24, 22, 288, 74, "#111827");
    drawPixelText(`W${this.game.currentWeek.id}`, 48, 69, 26, COLORS.gold, LEFT);
    drawPixelText(`CREDITS ${this.game.totalCredits}/${this.game.selectedDifficulty.targetCredits}`, 110, 69, 22, COLORS.paper, LEFT);
    drawPanel(960, 22, 292, 74, "#111827");
    drawPixelText(this.game.selectedDifficulty.label.toUpperCase(), 990, 69, 22, COLORS.gold, LEFT);
    drawProgressBar(1100, 48, 118, 22, this.game.level.getProgress(), COLORS.green);
  }

  renderQuizHud() {
    drawPanel(24, 22, 348, 74, "#111827");
    drawPixelText(`WEEK ${this.game.currentWeek.id}`, 48, 69, 24, COLORS.gold, LEFT);
    drawPixelText(`CREDITS ${this.game.totalCredits}/${this.game.selectedDifficulty.targetCredits}`, 168, 69, 21, COLORS.paper, LEFT);
    drawPanel(980, 22, 272, 74, "#111827");
    const timerColor = this.game.quiz.timer <= 10 ? COLORS.red : COLORS.paper;
    drawPixelText(`TIME ${Math.ceil(this.game.quiz.timer)}`, 1020, 69, 26, timerColor, LEFT);
  }
}

// draws the small image card next to the question that shows correct or wrong after you anser
function drawQuizFeedbackImage(centerX, centerY, imageSize, feedbackImage, accentColor) {
  const frameSize = imageSize + 18;
  push();
  rectMode(CENTER);
  noStroke();
  fill(10, 15, 26, 55);
  rect(centerX + 6, centerY + 6, frameSize, frameSize, 8);
  stroke(accentColor);
  strokeWeight(4);
  fill(COLORS.paper);
  rect(centerX, centerY, frameSize, frameSize, 8);
  if (feedbackImage && feedbackImage.width && feedbackImage.height) {
    imageMode(CENTER);
    image(feedbackImage, centerX, centerY, imageSize, imageSize);
  }
  pop();
}

// from here down is all the drawing functions for backgrounds, obstacles, and the diploma
function drawSkyGradient(topColor, bottomColor) {
  for (let row = 0; row < CANVAS_HEIGHT; row += 4) {
    const amount = row / CANVAS_HEIGHT;
    stroke(lerpColor(color(topColor), color(bottomColor), amount));
    strokeWeight(4);
    line(0, row, CANVAS_WIDTH, row);
  }
}

function drawMenuBackdrop(topColor, bottomColor) {
  drawSkyGradient(topColor, bottomColor);
  noStroke();
  fill("#1f6f37");
  rect(0, 586, CANVAS_WIDTH, 134);
  fill("#c78b4b");
  rect(0, 624, CANVAS_WIDTH, 96);
  fill("#8a5b2f");
  for (let tileX = -20; tileX < CANVAS_WIDTH; tileX += 36) {
    for (let tileY = 636; tileY < CANVAS_HEIGHT; tileY += 28) {
      rect(tileX + (tileY % 56), tileY, 14, 8);
    }
  }
  drawClouds(frameCount * 0.2);
}

function drawTitleClassroomBackdrop(scroll) {
  background("#d7e4ef");
  noStroke();
  fill("#91aeca");
  rect(0, 0, CANVAS_WIDTH, 160);
  fill("#b7c7d8");
  for (let windowIndex = 0; windowIndex < 5; windowIndex += 1) {
    const windowX = 74 + windowIndex * 258;
    rect(windowX, 34, 130, 86, 2);
    fill("#f4f1e8");
    rect(windowX + 61, 34, 6, 86);
    rect(windowX, 74, 130, 6);
    fill("#b7c7d8");
  }
  fill("#c78b4b");
  rect(0, 534, CANVAS_WIDTH, 186);
  fill("#8a5b2f");
  for (let boardIndex = 0; boardIndex < 12; boardIndex += 1) {
    rect(boardIndex * 126 - (scroll * 0.2) % 126, 588, 92, 12);
    rect(boardIndex * 126 + 48 - (scroll * 0.2) % 126, 652, 74, 10);
  }
  fill("#a36a3c");
  for (let deskIndex = 0; deskIndex < 6; deskIndex += 1) {
    const deskX = 64 + deskIndex * 224 - (scroll * 0.12) % 224;
    rect(deskX, 530, 140, 42, 2);
    rect(deskX + 12, 572, 18, 92);
    rect(deskX + 108, 572, 18, 92);
  }
  drawFlyingPapers(scroll);
}

function drawBlackboard(positionX, positionY, boardWidth, boardHeight) {
  push();
  stroke(COLORS.ink);
  strokeWeight(6);
  fill("#9d6536");
  rect(positionX, positionY, boardWidth, boardHeight, 4);
  fill("#234f3e");
  rect(positionX + 22, positionY + 22, boardWidth - 44, boardHeight - 54, 2);
  noStroke();
  fill("#f4f1e8");
  rect(positionX + 60, positionY + boardHeight - 24, 190, 8, 1);
  fill("#d94a4a");
  rect(positionX + boardWidth - 210, positionY + boardHeight - 34, 132, 18, 2);
  fill(255, 255, 255, 35);
  for (let chalkIndex = 0; chalkIndex < 7; chalkIndex += 1) {
    rect(positionX + 86 + chalkIndex * 112, positionY + 58 + (chalkIndex % 3) * 48, 58, 5, 2);
  }
  pop();
}

function drawFlyingPapers(scroll) {
  for (let paperIndex = 0; paperIndex < 12; paperIndex += 1) {
    const driftSpeed = 1.15 + (paperIndex % 4) * 0.22;
    const paperX = ((paperIndex * 173 + scroll * driftSpeed) % (CANVAS_WIDTH + 180)) - 90;
    const paperY = 96 + (paperIndex % 5) * 72 + Math.sin(scroll * 0.035 + paperIndex) * 14;
    const paperScale = 0.72 + (paperIndex % 3) * 0.16;
    const angle = Math.sin(scroll * 0.025 + paperIndex * 1.7) * 0.18;
    if (paperIndex % 3 === 0) {
      drawPaperPlane(paperX, paperY, paperScale, angle);
    } else {
      drawLoosePaper(paperX, paperY, paperScale, angle);
    }
  }
}

function drawPaperPlane(positionX, positionY, scaleAmount, angle) {
  push();
  translate(positionX, positionY);
  rotate(angle);
  scale(scaleAmount);
  stroke(COLORS.ink);
  strokeWeight(3);
  fill("#f4f1e8");
  triangle(-30, -10, 34, 0, -28, 18);
  fill("#d7e4ef");
  triangle(-28, -9, 4, 3, -12, 10);
  line(4, 3, -18, 17);
  pop();
}

function drawLoosePaper(positionX, positionY, scaleAmount, angle) {
  push();
  translate(positionX, positionY);
  rotate(angle);
  scale(scaleAmount);
  stroke(COLORS.ink);
  strokeWeight(3);
  fill("#f4f1e8");
  rect(-22, -16, 44, 34, 2);
  stroke("#8fd7ff");
  strokeWeight(2);
  line(-12, -5, 12, -5);
  line(-12, 5, 8, 5);
  pop();
}

// each week gets a different background layer that scrolls at different speeds
function drawTitleLandscape(scroll) {
  drawClouds(scroll * 0.18);
  noStroke();
  fill("#1d4d6e");
  for (let buildingIndex = 0; buildingIndex < 9; buildingIndex += 1) {
    const buildingX = buildingIndex * 160 - (scroll * 0.18) % 160;
    rect(buildingX, 410 - buildingIndex % 3 * 18, 100, 170 + buildingIndex % 2 * 25);
    fill("#f3c94a");
    for (let windowY = 430; windowY < 540; windowY += 30) {
      rect(buildingX + 18, windowY, 16, 12);
      rect(buildingX + 58, windowY, 16, 12);
    }
    fill("#1d4d6e");
  }
  drawGround({ groundTop: "#3fbf5f", groundFace: "#c78b4b", groundShadow: "#8a5b2f" }, scroll * 1.4);
}

function drawEnvironmentPreview(weekConfig, scroll) {
  drawWeekBackground(weekConfig, scroll);
  drawWeekGround(weekConfig, scroll);
}

function drawWeekBackground(weekConfig, scroll) {
  if (weekConfig.id === 1) {
    drawSkyGradient(weekConfig.palette.skyTop, weekConfig.palette.skyBottom);
    drawClouds(scroll * 0.16);
    drawCampusLayer(scroll, weekConfig.palette);
  } else if (weekConfig.id === 2) {
    background("#d9e2ec");
    drawDormLayer(scroll, weekConfig.palette);
  } else if (weekConfig.id === 3) {
    background("#e9c7a7");
    drawNightlifeLayer(scroll, weekConfig.palette);
  } else if (weekConfig.id === 4) {
    background("#dfd8c4");
    drawLibraryLayer(scroll, weekConfig.palette);
  } else {
    background("#d9dfeb");
    drawFinalLayer(scroll, weekConfig.palette);
  }
}

function drawClouds(scroll) {
  noStroke();
  fill(255, 255, 255, 210);
  for (let cloudIndex = 0; cloudIndex < 6; cloudIndex += 1) {
    const cloudX = ((cloudIndex * 270 - scroll) % 1500 + 1500) % 1500 - 120;
    const cloudY = 70 + (cloudIndex % 3) * 46;
    rect(cloudX, cloudY, 110, 24, 12);
    rect(cloudX + 34, cloudY - 16, 74, 34, 16);
    rect(cloudX + 86, cloudY + 2, 88, 24, 12);
  }
}

function drawCampusLayer(scroll, palette) {
  noStroke();
  fill(palette.far);
  for (let hillIndex = 0; hillIndex < 5; hillIndex += 1) {
    const hillX = hillIndex * 360 - (scroll * 0.08) % 360;
    ellipse(hillX + 180, 470, 420, 190);
  }
  fill("#e9ddc3");
  for (let buildingIndex = 0; buildingIndex < 5; buildingIndex += 1) {
    const buildingX = buildingIndex * 320 - (scroll * 0.18) % 320;
    rect(buildingX + 30, 258, 210, 228);
    fill("#c3a46d");
    rect(buildingX + 18, 244, 236, 22);
    fill("#5f7697");
    for (let windowX = buildingX + 56; windowX < buildingX + 216; windowX += 46) {
      for (let windowY = 292; windowY < 418; windowY += 42) {
        rect(windowX, windowY, 24, 28, 2);
      }
    }
    fill("#7f5634");
    rect(buildingX + 112, 372, 46, 114, 3);
    fill(palette.accent);
    rect(buildingX + 74, 212, 118, 26, 3);
    drawFlatPixelText("OZU", buildingX + 133, 231, 17, COLORS.ink, CENTER);
    fill("#e9ddc3");
  }
  fill("#4b7f52");
  for (let treeIndex = 0; treeIndex < 8; treeIndex += 1) {
    const treeX = treeIndex * 170 - (scroll * 0.28) % 170;
    rect(treeX + 72, 404, 14, 82);
    ellipse(treeX + 78, 374, 74, 74);
  }
  fill("#f4f1e8");
  for (let lampIndex = 0; lampIndex < 7; lampIndex += 1) {
    const lampX = lampIndex * 190 - (scroll * 0.34) % 190;
    rect(lampX + 94, 320, 8, 138);
    rect(lampX + 80, 320, 36, 16, 2);
  }
}

function drawDormLayer(scroll, palette) {
  noStroke();
  fill("#bcc8d6");
  rect(0, 0, CANVAS_WIDTH, 150);
  fill("#edf0e8");
  rect(0, 150, CANVAS_WIDTH, 400);
  fill("#8ea3bb");
  for (let lightIndex = 0; lightIndex < 6; lightIndex += 1) {
    rect(72 + lightIndex * 210, 50, 126, 24, 3);
    fill("#f4f1e8");
    rect(80 + lightIndex * 210, 58, 110, 10, 2);
    fill("#8ea3bb");
  }
  for (let lockerIndex = 0; lockerIndex < 7; lockerIndex += 1) {
    const lockerX = lockerIndex * 200 - (scroll * 0.18) % 200;
    fill(lockerIndex % 2 === 0 ? "#7087a8" : "#8ca0bc");
    rect(lockerX + 8, 248, 152, 238, 4);
    fill("#61758f");
    rect(lockerX + 56, 248, 6, 238);
    rect(lockerX + 104, 248, 6, 238);
    fill("#d6dde7");
    rect(lockerX + 44, 310, 8, 28, 2);
    rect(lockerX + 92, 310, 8, 28, 2);
    rect(lockerX + 140, 310, 8, 28, 2);
  }
  for (let posterIndex = 0; posterIndex < 5; posterIndex += 1) {
    const posterX = posterIndex * 290 - (scroll * 0.24) % 290;
    fill(posterIndex % 2 === 0 ? palette.accent : "#d94a4a");
    rect(posterX + 110, 174, 112, 58, 3);
    drawFlatPixelText(posterIndex % 2 === 0 ? "OZU" : "WEEK", posterX + 166, 210, 18, COLORS.ink, CENTER);
  }
  fill("#4e637d");
  for (let doorwayIndex = 0; doorwayIndex < 5; doorwayIndex += 1) {
    const doorwayX = doorwayIndex * 260 - (scroll * 0.12) % 260;
    rect(doorwayX + 152, 276, 86, 210, 3);
    fill("#dce5ef");
    rect(doorwayX + 172, 304, 44, 68, 2);
    fill("#4e637d");
  }
}

function drawNightlifeLayer(scroll, palette) {
  noStroke();
  fill("#bc8f6c");
  rect(0, 0, CANVAS_WIDTH, 114);
  for (let windowIndex = 0; windowIndex < 5; windowIndex += 1) {
    const windowX = 48 + windowIndex * 246;
    for (let row = 0; row < 90; row += 4) {
      const amount = row / 90;
      fill(lerpColor(color("#88b8ff"), color("#f7c675"), amount));
      rect(windowX, 42 + row, 156, 4);
    }
    fill(255, 255, 255, 64);
    rect(windowX, 42, 156, 90, 3);
    fill("#f4f1e8");
    rect(windowX - 6, 34, 168, 8, 2);
    rect(windowX - 6, 132, 168, 8, 2);
    rect(windowX - 6, 42, 8, 90, 2);
    rect(windowX + 154, 42, 8, 90, 2);
  }
  fill("#f0d2af");
  rect(0, 132, CANVAS_WIDTH, 400);
  fill("#7f4c2b");
  for (let boardIndex = 0; boardIndex < 4; boardIndex += 1) {
    const boardX = boardIndex * 320 - (scroll * 0.14) % 320;
    rect(boardX + 54, 176, 120, 44, 3);
    fill(palette.accent);
    rect(boardX + 66, 186, 96, 22, 2);
    drawFlatPixelText("OZU CAFE", boardX + 114, 202, 16, COLORS.ink, CENTER);
    fill("#7f4c2b");
  }
  fill("#4b6186");
  for (let vendingIndex = 0; vendingIndex < 5; vendingIndex += 1) {
    const vendingX = vendingIndex * 256 - (scroll * 0.22) % 256;
    rect(vendingX + 8, 248, 74, 188, 3);
    fill("#d4e7ff");
    rect(vendingX + 22, 266, 46, 62, 2);
    fill("#d94a4a");
    rect(vendingX + 22, 344, 46, 30, 2);
    fill("#4b6186");
  }
  fill("#9d6536");
  for (let tableIndex = 0; tableIndex < 7; tableIndex += 1) {
    const tableX = tableIndex * 196 - (scroll * 0.34) % 196;
    rect(tableX + 26, 420, 132, 18, 2);
    rect(tableX + 40, 438, 12, 54);
    rect(tableX + 132, 438, 12, 54);
    fill("#50657f");
    rect(tableX + 12, 450, 26, 40, 2);
    rect(tableX + 146, 450, 26, 40, 2);
    fill("#9d6536");
  }
  fill("#ffe7b8");
  for (let lampIndex = 0; lampIndex < 6; lampIndex += 1) {
    const lampX = lampIndex * 214 - (scroll * 0.12) % 214;
    rect(lampX + 98, 130, 8, 68);
    ellipse(lampX + 102, 204, 44, 26);
  }
}

function drawLibraryLayer(scroll, palette) {
  noStroke();
  fill("#c7b79e");
  rect(0, 0, CANVAS_WIDTH, 132);
  fill("#efe8d5");
  rect(0, 132, CANVAS_WIDTH, 420);
  fill("#e5d39a");
  for (let lightIndex = 0; lightIndex < 5; lightIndex += 1) {
    rect(100 + lightIndex * 240, 62, 112, 18, 3);
  }
  for (let shelfIndex = 0; shelfIndex < 6; shelfIndex += 1) {
    const shelfX = shelfIndex * 220 - (scroll * 0.18) % 220;
    fill("#7b5b40");
    rect(shelfX + 16, 214, 172, 292, 3);
    fill("#5b422d");
    rect(shelfX + 16, 282, 172, 8);
    rect(shelfX + 16, 350, 172, 8);
    rect(shelfX + 16, 418, 172, 8);
    for (let bookColumn = 0; bookColumn < 7; bookColumn += 1) {
      const colorSet = ["#d94a4a", "#4c6aa4", "#f3c94a", "#56a86c"];
      fill(colorSet[(shelfIndex + bookColumn) % colorSet.length]);
      rect(shelfX + 26 + bookColumn * 22, 226, 16, 44, 1);
      rect(shelfX + 26 + bookColumn * 22, 294, 16, 44, 1);
      rect(shelfX + 26 + bookColumn * 22, 362, 16, 44, 1);
    }
  }
  fill("#9a7b54");
  for (let deskIndex = 0; deskIndex < 4; deskIndex += 1) {
    const deskX = deskIndex * 320 - (scroll * 0.28) % 320;
    rect(deskX + 42, 420, 180, 24, 2);
    rect(deskX + 60, 444, 14, 54);
    rect(deskX + 190, 444, 14, 54);
    fill("#f0e08f");
    rect(deskX + 112, 372, 12, 54);
    ellipse(deskX + 118, 366, 52, 26);
    fill("#9a7b54");
  }
  fill(palette.accent);
  rect(494, 160, 292, 34, 3);
  drawFlatPixelText("OZU LIBRARY", 640, 184, 20, COLORS.ink, CENTER);
}

function drawFinalLayer(scroll, palette) {
  noStroke();
  fill("#c3cedb");
  rect(0, 0, CANVAS_WIDTH, 118);
  fill("#eef2f7");
  rect(0, 118, CANVAS_WIDTH, 434);
  fill("#9cb0c6");
  for (let lightIndex = 0; lightIndex < 6; lightIndex += 1) {
    rect(84 + lightIndex * 206, 44, 118, 24, 3);
    fill("#f4f1e8");
    rect(94 + lightIndex * 206, 52, 98, 12, 2);
    fill("#9cb0c6");
  }
  for (let bannerIndex = 0; bannerIndex < 5; bannerIndex += 1) {
    const bannerX = bannerIndex * 280 - (scroll * 0.14) % 280;
    fill(bannerIndex % 2 === 0 ? palette.accent : "#d94a4a");
    rect(bannerX + 48, 144, 154, 54, 4);
    drawFlatPixelText(bannerIndex % 2 === 0 ? "OZU" : "FINALS", bannerX + 125, 178, 18, COLORS.ink, CENTER);
  }
  fill("#607693");
  for (let doorIndex = 0; doorIndex < 6; doorIndex += 1) {
    const doorX = doorIndex * 214 - (scroll * 0.22) % 214;
    rect(doorX + 18, 244, 86, 242, 3);
    rect(doorX + 120, 244, 86, 242, 3);
    fill("#dbe7f3");
    rect(doorX + 42, 278, 38, 64, 2);
    rect(doorX + 144, 278, 38, 64, 2);
    fill("#607693");
    rect(doorX + 72, 352, 10, 10, 2);
    rect(doorX + 174, 352, 10, 10, 2);
  }
  fill("#7d90a8");
  for (let arrowIndex = 0; arrowIndex < 7; arrowIndex += 1) {
    const arrowX = arrowIndex * 180 - (scroll * 0.34) % 180;
    triangle(arrowX + 48, 430, arrowX + 108, 462, arrowX + 48, 494);
  }
}

function drawWeekGround(weekConfig, scroll) {
  if (weekConfig.id === 1) {
    drawGround(weekConfig.palette, scroll);
    return;
  }
  if (weekConfig.id === 2) {
    drawHallwayGround(weekConfig.palette, scroll);
    return;
  }
  if (weekConfig.id === 3) {
    drawCommonsGround(weekConfig.palette, scroll);
    return;
  }
  if (weekConfig.id === 4) {
    drawLibraryGround(weekConfig.palette, scroll);
    return;
  }
  drawFinalHallGround(weekConfig.palette, scroll);
}

// drawGround and its variants paint the floor for each week with their own tile patterns
function drawHallwayGround(palette, scroll) {
  noStroke();
  fill("#3b556f");
  rect(0, GROUND_Y, CANVAS_WIDTH, 20);
  fill("#d3d7dd");
  rect(0, GROUND_Y + 20, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 20);
  fill("#c4c9d1");
  for (let tileX = -64 - (scroll % 64); tileX < CANVAS_WIDTH + 80; tileX += 64) {
    rect(tileX, GROUND_Y + 48, 58, 10);
    rect(tileX + 12, GROUND_Y + 108, 42, 8);
  }
  fill(palette.accent);
  rect(0, GROUND_Y + 34, CANVAS_WIDTH, 10);
}

function drawCommonsGround(palette, scroll) {
  noStroke();
  fill("#5f4a39");
  rect(0, GROUND_Y, CANVAS_WIDTH, 20);
  fill("#d5b18e");
  rect(0, GROUND_Y + 20, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 20);
  fill("#c58f69");
  for (let tileX = -52 - (scroll % 52); tileX < CANVAS_WIDTH + 60; tileX += 52) {
    rect(tileX, GROUND_Y + 44, 44, 12);
    rect(tileX + 18, GROUND_Y + 104, 28, 10);
  }
  fill("#a85239");
  rect(0, GROUND_Y + 80, CANVAS_WIDTH, 8);
}

function drawLibraryGround(palette, scroll) {
  noStroke();
  fill("#4d664f");
  rect(0, GROUND_Y, CANVAS_WIDTH, 18);
  fill("#8f6c4e");
  rect(0, GROUND_Y + 18, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 18);
  fill("#7b5b40");
  for (let plankX = -76 - (scroll % 76); plankX < CANVAS_WIDTH + 80; plankX += 76) {
    rect(plankX, GROUND_Y + 44, 64, 10);
    rect(plankX + 22, GROUND_Y + 100, 42, 10);
  }
  fill(palette.accent);
  rect(110, GROUND_Y + 32, CANVAS_WIDTH - 220, 14, 3);
}

function drawFinalHallGround(palette, scroll) {
  noStroke();
  fill("#3f5976");
  rect(0, GROUND_Y, CANVAS_WIDTH, 18);
  fill("#94a1b2");
  rect(0, GROUND_Y + 18, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 18);
  fill(palette.accent);
  for (let markerX = -120 - (scroll % 120); markerX < CANVAS_WIDTH + 140; markerX += 120) {
    triangle(markerX + 18, GROUND_Y + 74, markerX + 78, GROUND_Y + 98, markerX + 18, GROUND_Y + 122);
  }
  fill("#8491a4");
  rect(0, GROUND_Y + 42, CANVAS_WIDTH, 8);
  rect(0, GROUND_Y + 138, CANVAS_WIDTH, 8);
}

function drawGround(palette, scroll) {
  noStroke();
  fill(palette.groundTop);
  rect(0, GROUND_Y, CANVAS_WIDTH, 24);
  fill(palette.groundFace);
  rect(0, GROUND_Y + 24, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 24);
  fill(palette.groundShadow);
  for (let tileX = -64 - (scroll % 64); tileX < CANVAS_WIDTH + 80; tileX += 64) {
    rect(tileX, GROUND_Y + 50, 36, 14);
    rect(tileX + 28, GROUND_Y + 92, 26, 12);
    rect(tileX + 12, GROUND_Y + 132, 42, 12);
  }
  fill("#1f6f37");
  for (let grassX = -24 - (scroll % 48); grassX < CANVAS_WIDTH + 48; grassX += 48) {
    rect(grassX, GROUND_Y - 8, 34, 12);
    rect(grassX + 24, GROUND_Y - 14, 18, 18);
  }
}

// drawBedObstacle, drawDiscoObstacle, drawPhoneObstacle each draw one type of distraction
// the damaged flag changes the colors to show the player already hit this one
function drawBedObstacle(positionX, positionY, damaged) {
  push();
  stroke(COLORS.ink);
  strokeWeight(4);
  fill(damaged ? "#8d9bb0" : "#8fd7ff");
  rect(positionX, positionY + 14, 118, 38, 2);
  fill("#f4f1e8");
  rect(positionX + 10, positionY + 4, 42, 22, 2);
  fill(damaged ? "#b86666" : "#d94a4a");
  rect(positionX + 48, positionY + 8, 62, 34, 2);
  fill(COLORS.ink);
  rect(positionX + 8, positionY + 50, 12, 16);
  rect(positionX + 96, positionY + 50, 12, 16);
  pop();
}

function drawDiscoObstacle(positionX, positionY, damaged, accentColor) {
  const centerX = positionX + 41;
  const centerY = positionY + 46;
  const radius = 41;
  const spin = frameCount * 0.05;
  const burstColors = damaged
    ? ["#697385", "#8f98a7", "#b5bcc8"]
    : [accentColor, "#ff5f91", "#64efff", "#ffe47a", "#9d80ff"];
  const shadowTileColor = color(damaged ? "#6f7685" : "#8b95ab");
  const highlightTileColor = color(damaged ? "#d1d5dc" : "#f4f7ff");

  push();
  rectMode(CENTER);
  stroke(COLORS.ink);
  strokeWeight(4);
  line(centerX, 0, centerX, positionY + 6);
  fill(damaged ? "#707785" : "#6e7a92");
  rect(centerX, positionY + 10, 16, 10, 2);

  noStroke();
  for (let beamIndex = 0; beamIndex < 10; beamIndex += 1) {
    const beamAngle = spin + beamIndex * (TWO_PI / 10);
    const beamColor = color(burstColors[beamIndex % burstColors.length]);
    const stepCount = 3 + beamIndex % 3;
    for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
      const beamDistance = radius + 10 + stepIndex * 12;
      const pixelSize = stepIndex === 0 ? 10 : stepIndex === stepCount - 1 ? 6 : 8;
      const offsetX = Math.round((Math.cos(beamAngle) * beamDistance) / 4) * 4;
      const offsetY = Math.round((Math.sin(beamAngle) * beamDistance) / 4) * 4;
      const alpha = damaged ? 34 - stepIndex * 6 : 118 - stepIndex * 18;
      if (alpha <= 0) {
        continue;
      }
      fill(red(beamColor), green(beamColor), blue(beamColor), alpha);
      rect(centerX + offsetX, centerY + offsetY, pixelSize, pixelSize, 1);
    }
  }

  noStroke();
  fill(damaged ? "#7b808c" : "#95a0b8");
  ellipse(centerX, centerY, radius * 2, radius * 2);

  for (let tileY = -26; tileY <= 26; tileY += 10) {
    for (let tileX = -26; tileX <= 26; tileX += 10) {
      if (tileX * tileX + tileY * tileY > 29 * 29) {
        continue;
      }
      const rotatedX = tileX * Math.cos(spin) - tileY * Math.sin(spin);
      const shimmer = (Math.sin(rotatedX * 0.18 + spin * 4) + Math.cos(tileY * 0.22 - spin * 3) + 2) / 4;
      fill(lerpColor(shadowTileColor, highlightTileColor, shimmer));
      rect(centerX + tileX, centerY + tileY, 8, 8, 1);
    }
  }

  push();
  translate(centerX, centerY);
  rotate(spin);
  stroke(damaged ? "#c9ced6" : "#dfe7ff");
  strokeWeight(2);
  noFill();
  ellipse(0, 0, 54, 54);
  line(-24, 0, 24, 0);
  line(0, -24, 0, 24);
  line(-17, -17, 17, 17);
  line(-17, 17, 17, -17);
  pop();

  stroke(COLORS.ink);
  strokeWeight(3);
  noFill();
  ellipse(centerX, centerY, radius * 2, radius * 2);
  noStroke();
  fill(damaged ? "#f0f1f3" : "#ffffff");
  rect(centerX - 14, centerY - 14, 10, 10, 1);
  rect(centerX - 2, centerY - 24, 8, 8, 1);
  fill(damaged ? "#cfd5df" : "#dff8ff");
  rect(centerX + 12, centerY - 4, 6, 6, 1);
  pop();
}

function drawPhoneObstacle(positionX, positionY, damaged) {
  push();
  stroke(COLORS.ink);
  strokeWeight(4);
  fill(damaged ? "#6c7485" : "#2e5fd6");
  rect(positionX, positionY, 70, 86, 6);
  fill("#f4f1e8");
  rect(positionX + 10, positionY + 12, 50, 54, 3);
  const logoImage = uiImages && uiImages.instagramLogo;
  if (logoImage && logoImage.width && logoImage.height) {
    imageMode(CENTER);
    image(logoImage, positionX + 35, positionY + 39, 30, 30);
  } else {
    drawPhoneAppIcon(positionX + 35, positionY + 39, damaged);
  }
  noStroke();
  fill(COLORS.red);
  rect(positionX + 46, positionY - 8, 24, 24, 12);
  drawPixelText("!", positionX + 53, positionY + 10, 16, COLORS.paper, LEFT);
  pop();
}

function drawPhoneAppIcon(centerX, centerY, damaged) {
  push();
  noFill();
  stroke(damaged ? "#9ba4b6" : COLORS.red);
  strokeWeight(5);
  ellipse(centerX, centerY, 29, 29);
  point(centerX + 11, centerY - 12);
  pop();
}

// drawClassroomDoor draws the door at the end of each commute run
// the player runs into it to trigger the door transition and start the quiz
function drawClassroomDoor(positionX, palette) {
  if (positionX < -160 || positionX > CANVAS_WIDTH + 220) {
    return;
  }
  push();
  stroke(COLORS.ink);
  strokeWeight(5);
  fill("#70472d");
  rect(positionX, GROUND_Y - 176, 112, 176, 2);
  fill("#f4f1e8");
  rect(positionX + 18, GROUND_Y - 152, 76, 42, 2);
  drawPixelText("COD", positionX + 32, GROUND_Y - 122, 20, COLORS.ink, LEFT);
  fill(palette.accent);
  ellipse(positionX + 88, GROUND_Y - 84, 12, 12);
  pop();
}

function drawClassroomBackdrop() {
  background("#d6e1ee");
  noStroke();
  fill("#9cb4c9");
  rect(0, 0, CANVAS_WIDTH, 190);
  fill("#2f6c4f");
  rect(160, 70, 960, 170, 3);
  stroke("#f4f1e8");
  strokeWeight(4);
  line(190, 190, 1060, 190);
  noStroke();
  fill("#c78b4b");
  rect(0, 592, CANVAS_WIDTH, 128);
  fill("#8a5b2f");
  for (let deskIndex = 0; deskIndex < 6; deskIndex += 1) {
    rect(80 + deskIndex * 220, 598, 148, 38, 2);
    rect(92 + deskIndex * 220, 636, 16, 66);
    rect(196 + deskIndex * 220, 636, 16, 66);
  }
}

function drawLoadingStudyScene(progress) {
  drawClassroomBackdrop();
  noStroke();
  fill(13, 20, 39, 136);
  rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  fill("#173d32");
  rect(160, 68, 960, 176, 3);
  drawFlyingPapers(frameCount * 0.95);
  fill("#a86a3b");
  rect(0, 468, CANVAS_WIDTH, 252);
  fill("#6f4227");
  for (let plankIndex = 0; plankIndex < 10; plankIndex += 1) {
    rect(plankIndex * 148 - (frameCount * 0.3) % 148, 556, 118, 10);
    rect(plankIndex * 148 + 52 - (frameCount * 0.3) % 148, 648, 86, 8);
  }
  drawLoadingBook(progress);
}

function drawLoadingBook(progress) {
  const openAmount = Math.sin(clampValue(progress, 0, 1) * HALF_PI);
  const pageLift = Math.sin(clampValue(progress, 0, 1) * PI);
  push();
  translate(640, 418);
  stroke(COLORS.ink);
  strokeWeight(6);
  fill("#8f2f3d");
  rect(-348, -56, 696, 236, 8);
  fill("#5f2430");
  rect(-24, -56, 48, 236, 2);
  fill("#f4f1e8");
  quad(-22, -124, -318 - openAmount * 10, -80, -318, 142, -22, 184);
  quad(22, -124, 318 + openAmount * 10, -80, 318, 142, 22, 184);
  stroke("#d2c6aa");
  strokeWeight(3);
  for (let lineIndex = 0; lineIndex < 6; lineIndex += 1) {
    line(-260, -42 + lineIndex * 30, -66, -12 + lineIndex * 30);
    line(68, -12 + lineIndex * 30, 260, -42 + lineIndex * 30);
  }
  stroke(COLORS.ink);
  strokeWeight(5);
  fill("#fff8dc");
  const pageWidth = 38 + openAmount * 214;
  quad(0, -118, pageWidth, -92 - pageLift * 26, pageWidth, 128 - pageLift * 16, 0, 178);
  noStroke();
  fill(COLORS.gold);
  rect(20, 154, 38, 94, 2);
  fill("#8fd7ff");
  rect(-250 + progress * 500, 194 - pageLift * 28, 44, 18, 2);
  pop();
}

function drawLoadingPlatform(progress) {
  noStroke();
  fill("#213d5f");
  rect(0, 520, CANVAS_WIDTH, 200);
  fill("#3fbf5f");
  for (let platformIndex = 0; platformIndex < 9; platformIndex += 1) {
    const platformX = platformIndex * 170 - (frameCount * 2) % 170;
    rect(platformX, 520 + (platformIndex % 2) * 25, 122, 20, 2);
  }
  fill(COLORS.gold);
  rect(160 + progress * 880, 450 - Math.sin(progress * PI) * 85, 32, 32, 2);
}

// these ending functions build the diploma and result screen for pass or fail
function drawEndingBackdrop(succeeded, sceneFrame) {
  drawClassroomBackdrop();
  noStroke();
  fill(succeeded ? "#203f68" : "#211b2b");
  rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (succeeded) {
    for (let confettiIndex = 0; confettiIndex < 70; confettiIndex += 1) {
      const confettiX = (confettiIndex * 71 + sceneFrame * (1 + confettiIndex % 4)) % CANVAS_WIDTH;
      const confettiY = (confettiIndex * 43 + sceneFrame * 2) % CANVAS_HEIGHT;
      fill(confettiIndex % 3 === 0 ? COLORS.gold : confettiIndex % 3 === 1 ? COLORS.red : COLORS.green);
      rect(confettiX, confettiY, 10, 14);
    }
  } else {
    fill(255, 255, 255, 28);
    for (let paperIndex = 0; paperIndex < 16; paperIndex += 1) {
      rect((paperIndex * 97 + sceneFrame * 0.6) % CANVAS_WIDTH, 70 + (paperIndex % 6) * 72, 42, 28, 2);
    }
  }
}

function drawDiplomaDocument(positionX, positionY, documentWidth, documentHeight, succeeded, totalCredits, targetCredits, difficultyLabel) {
  push();
  stroke(COLORS.ink);
  strokeWeight(7);
  fill("#dac496");
  rect(positionX + 18, positionY + 22, documentWidth, documentHeight, 5);
  fill("#f4f1e8");
  rect(positionX, positionY, documentWidth, documentHeight, 5);
  stroke(succeeded ? COLORS.gold : COLORS.red);
  strokeWeight(5);
  noFill();
  rect(positionX + 28, positionY + 28, documentWidth - 56, documentHeight - 56, 2);
  stroke(COLORS.ink);
  strokeWeight(3);
  line(positionX + 96, positionY + 200, positionX + documentWidth - 96, positionY + 200);
  line(positionX + 150, positionY + 338, positionX + documentWidth - 150, positionY + 338);
  pop();

  drawFlatPixelText("OZU", positionX + documentWidth / 2, positionY + 96, 46, COLORS.ink, CENTER);
  drawFlatPixelText("THE LAST SEMESTER", positionX + documentWidth / 2, positionY + 154, 34, succeeded ? COLORS.gold : COLORS.red, CENTER);
  drawFlatPixelText(succeeded ? "DIPLOMA OF SURVIVAL" : "ACADEMIC WARNING", positionX + documentWidth / 2, positionY + 238, 30, COLORS.ink, CENTER);
  drawFlatPixelText(`${totalCredits} / ${targetCredits} CREDITS`, positionX + documentWidth / 2, positionY + 292, 27, "#2e5fd6", CENTER);
  drawFlatPixelText(`${difficultyLabel.toUpperCase()} TARGET`, positionX + documentWidth / 2, positionY + 386, 22, COLORS.ink, CENTER);
  drawOzuSeal(positionX + 148, positionY + 382, succeeded);
  drawDiplomaSticker(positionX + documentWidth - 180, positionY + 40, succeeded);
}

function drawOzuSeal(positionX, positionY, succeeded) {
  push();
  stroke(COLORS.ink);
  strokeWeight(5);
  fill(succeeded ? COLORS.gold : "#b7becd");
  ellipse(positionX, positionY, 104, 104);
  fill("#f4f1e8");
  ellipse(positionX, positionY, 70, 70);
  drawFlatPixelText("OZU", positionX, positionY + 11, 22, COLORS.ink, CENTER);
  pop();
}

function drawStamp(positionX, positionY, succeeded) {
  push();
  translate(positionX, positionY);
  rotate(succeeded ? -0.16 : 0.13);
  stroke(succeeded ? COLORS.green : COLORS.red);
  strokeWeight(7);
  noFill();
  rect(-84, -40, 168, 80, 2);
  drawFlatPixelText(succeeded ? "PASSED" : "FAIL", 0, 12, succeeded ? 40 : 48, succeeded ? COLORS.green : COLORS.red, CENTER);
  pop();
}

function drawDiplomaSticker(positionX, positionY, succeeded) {
  const stickerImage = uiImages && (succeeded ? uiImages.diplomaPassedSticker : uiImages.diplomaFailedSticker);
  const stickerSize = 128;
  if (!stickerImage || !stickerImage.width || !stickerImage.height) {
    drawStamp(positionX + stickerSize / 2, positionY + stickerSize / 2, succeeded);
    return;
  }

  push();
  translate(positionX + stickerSize / 2, positionY + stickerSize / 2);
  rotate(succeeded ? 0.08 : -0.08);
  rectMode(CENTER);
  noStroke();
  fill(18, 24, 36, 42);
  rect(8, 8, stickerSize, stickerSize, 10);
  stroke(succeeded ? COLORS.green : COLORS.red);
  strokeWeight(4);
  fill(COLORS.paper);
  rect(0, 0, stickerSize, stickerSize, 10);
  imageMode(CENTER);
  image(stickerImage, 0, 0, stickerSize - 12, stickerSize - 12);
  pop();
}

function drawDiplomaScene(sceneFrame) {
  for (let confettiIndex = 0; confettiIndex < 60; confettiIndex += 1) {
    const confettiX = (confettiIndex * 71 + sceneFrame * (1 + confettiIndex % 4)) % CANVAS_WIDTH;
    const confettiY = (confettiIndex * 43 + sceneFrame * 2) % CANVAS_HEIGHT;
    fill(confettiIndex % 3 === 0 ? COLORS.gold : confettiIndex % 3 === 1 ? COLORS.red : COLORS.green);
    noStroke();
    rect(confettiX, confettiY, 10, 14);
  }
  push();
  translate(390, 350);
  stroke(COLORS.ink);
  strokeWeight(5);
  fill("#f4f1e8");
  rect(0, 0, 500, 150, 4);
  fill(COLORS.gold);
  ellipse(250, 74, 76, 76);
  fill(COLORS.red);
  rect(210, 100, 80, 16);
  drawPixelText("DIPLOMA", 184, 70, 32, COLORS.ink, LEFT);
  pop();
}

function drawFailDeskScene() {
  drawClassroomBackdrop();
  push();
  translate(430, 360);
  stroke(COLORS.ink);
  strokeWeight(5);
  fill("#c78b4b");
  rect(0, 110, 420, 58, 2);
  fill("#f4f1e8");
  for (let stackIndex = 0; stackIndex < 5; stackIndex += 1) {
    rect(70 + stackIndex * 52, 78 - stackIndex * 16, 130, 22, 1);
  }
  fill(COLORS.red);
  rect(220, 30, 120, 80, 3);
  drawPixelText("RETRY", 240, 80, 22, COLORS.paper, LEFT);
  pop();
}