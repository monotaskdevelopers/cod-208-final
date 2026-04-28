let game;
let questionPayload;

function preload() {
  questionPayload = loadJSON(
    "assets/data/questions.json",
    function handleQuestionLoad(payload) {
      questionPayload = payload;
    },
    function handleQuestionError() {
      questionPayload = { questions: QUESTION_FALLBACK };
    }
  );
}

function setup() {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent("game-root");
  pixelDensity(1);
  noSmooth();
  frameRate(60);
  textFont("monospace");
  const loadedQuestions = questionPayload && questionPayload.questions ? questionPayload.questions : QUESTION_FALLBACK;
  game = new Game(loadedQuestions);
}

function draw() {
  game.update();
  game.render();
}

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

function clampValue(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function rectsOverlap(firstRect, secondRect) {
  return firstRect.left < secondRect.right &&
    firstRect.right > secondRect.left &&
    firstRect.top < secondRect.bottom &&
    firstRect.bottom > secondRect.top;
}

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

class Game {
  constructor(questions) {
    this.questions = questions;
    this.audio = new AudioManager();
    this.ui = new UIManager(this);
    this.keys = { up: false, down: false };
    this.hotspots = [];
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
    this.totalCredits -= 1;
    this.weekLostCredits += 1;
    this.screenShake = 12;
    this.audio.hit();
  }

  update() {
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
    this.hotspots = [];
    push();
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
    drawSkyGradient("#4c9dff", "#102a5c");
    drawTitleLandscape(frameCount * 0.4);
    drawPanel(270, 98, 740, 330, "#101624");
    drawPixelText("THE LAST", 386, 205, 64, COLORS.paper, LEFT);
    drawPixelText("SEMESTER", 335, 286, 76, COLORS.gold, LEFT);
    drawPixelText("5 WEEKS TO GRADUATION", 442, 362, 24, "#8fd7ff", LEFT);
    const pulseOffset = Math.sin(this.titlePulse) * 5;
    drawPixelButton(490, 485 + pulseOffset, 300, 64, "START", false);
    this.addHotspot("start", 490, 470, 300, 92, () => {
      this.audio.menu();
      this.setState("difficulty-select");
    });
    drawPixelText("UP: JUMP    DOWN: CROUCH    ENTER: CONFIRM", 330, 640, 22, COLORS.paper, LEFT);
  }

  renderDifficultySelect() {
    drawMenuBackdrop("#5fa8ff", "#183b73");
    drawPixelText("CHOOSE GRADUATION TARGET", 285, 118, 42, COLORS.gold, LEFT);
    drawPixelText("Credits can drop during the commute. Quizzes earn them back.", 287, 166, 22, COLORS.paper, LEFT);
    for (let difficultyIndex = 0; difficultyIndex < DIFFICULTIES.length; difficultyIndex += 1) {
      const difficulty = DIFFICULTIES[difficultyIndex];
      const cardX = 210 + difficultyIndex * 300;
      const cardY = 250;
      const isSelected = this.selectedDifficulty.id === difficulty.id;
      drawPanel(cardX, cardY, 260, 230, isSelected ? "#3c4f7e" : "#202b45");
      drawPixelText(difficulty.label.toUpperCase(), cardX + 42, cardY + 64, 30, isSelected ? COLORS.gold : COLORS.paper, LEFT);
      drawPixelText(`${difficulty.targetCredits} CREDITS`, cardX + 42, cardY + 112, 24, "#8fd7ff", LEFT);
      drawWrappedText(difficulty.description, cardX + 42, cardY + 145, 178, 24, 17, COLORS.paper, LEFT);
      drawPixelButton(cardX + 42, cardY + 175, 176, 46, `${difficultyIndex + 1}`, isSelected);
      this.addHotspot(`difficulty-${difficulty.id}`, cardX, cardY, 260, 230, () => {
        this.selectedDifficulty = difficulty;
        this.audio.menu();
      });
    }
    drawPixelButton(470, 545, 340, 62, "BEGIN", true);
    this.addHotspot("begin-run", 470, 545, 340, 62, () => {
      this.audio.menu();
      this.startNewRun();
    });
  }

  renderIntro() {
    drawClassroomBackdrop();
    drawPanel(176, 112, 928, 462, "#19273e");
    drawPixelText("SEMESTER BRIEFING", 282, 180, 42, COLORS.gold, LEFT);
    drawWrappedText("Survive five weeks of auto-running commutes, dodge student-life distractions, and answer COD 208 quiz questions before the timer runs out.", 282, 245, 720, 34, 25, COLORS.paper, LEFT);
    drawWrappedText(`Target: ${this.selectedDifficulty.targetCredits} credits on ${this.selectedDifficulty.label}. Each week quiz is worth 6 credits. Obstacles cost 1 credit.`, 282, 358, 720, 32, 23, "#8fd7ff", LEFT);
    drawPixelButton(464, 610, 352, 58, "WEEK 1", true);
    this.addHotspot("intro-next", 464, 610, 352, 58, () => {
      this.audio.menu();
      this.startLoading("week-intro", this.currentWeek.loadingText, 72);
    });
  }

  renderLoading() {
    const progress = this.loading ? this.loading.frame / this.loading.durationFrames : 1;
    drawSkyGradient("#244c8f", "#0d1430");
    drawLoadingPlatform(progress);
    drawPanel(310, 220, 660, 250, "#121a2c");
    drawPixelText("LOADING", 516, 294, 44, COLORS.gold, LEFT);
    drawPixelText(this.loading ? this.loading.label.toUpperCase() : "READY", 384, 350, 23, COLORS.paper, LEFT);
    drawProgressBar(392, 390, 496, 34, progress, COLORS.green);
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
    drawMenuBackdrop(succeeded ? "#6da9ff" : "#31384a", succeeded ? "#183b73" : "#111827");
    if (succeeded) {
      drawDiplomaScene(frameCount);
      drawPanel(284, 86, 712, 200, "#14213a");
      drawPixelText("GRADUATED", 440, 168, 62, COLORS.gold, LEFT);
      drawPixelText(`${this.totalCredits} / ${this.selectedDifficulty.targetCredits} CREDITS`, 434, 230, 27, COLORS.paper, LEFT);
    } else {
      drawFailDeskScene();
      drawPanel(256, 88, 768, 220, "#201b2a");
      drawPixelText("SEMESTER MISSED", 354, 168, 52, COLORS.red, LEFT);
      drawPixelText(`${this.totalCredits} / ${this.selectedDifficulty.targetCredits} CREDITS`, 434, 238, 27, COLORS.paper, LEFT);
    }
    drawPixelButton(468, 610, 344, 58, "PLAY AGAIN", true);
    this.addHotspot("replay", 468, 610, 344, 58, () => {
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
      this.setState("difficulty-select");
      this.audio.menu();
    } else if (this.state === "difficulty-select") {
      this.startNewRun();
      this.audio.menu();
    } else if (this.state === "intro") {
      this.startLoading("week-intro", this.currentWeek.loadingText, 72);
      this.audio.menu();
    } else if (this.state === "week-intro") {
      this.startCommute();
      this.audio.menu();
    } else if (this.state === "week-summary") {
      this.advanceFromSummary();
      this.audio.menu();
    } else if (this.state === "ending-success" || this.state === "ending-fail") {
      this.resetRunValues();
      this.setState("title");
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
    this.audio.ensureReady();
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

class Player {
  constructor() {
    this.positionX = 218;
    this.positionY = GROUND_Y;
    this.width = 54;
    this.standingHeight = 88;
    this.crouchHeight = 52;
    this.velocityY = 0;
    this.grounded = true;
    this.crouching = false;
    this.invulnerableFrames = 0;
    this.runFrame = 0;
  }

  get height() {
    return this.crouching ? this.crouchHeight : this.standingHeight;
  }

  jump() {
    if (!this.grounded) {
      return false;
    }
    this.velocityY = -19.5;
    this.grounded = false;
    this.crouching = false;
    return true;
  }

  update(keys) {
    this.runFrame += 0.2;
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
    }
    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames -= 1;
    }
  }

  hit() {
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

  render() {
    const bounds = this.getBounds();
    const flicker = this.invulnerableFrames > 0 && frameCount % 6 < 3;
    if (flicker) {
      return;
    }
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
}

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
    let worldX = 920;
    let patternIndex = 0;
    while (worldX < this.weekConfig.length - 600) {
      const patternName = this.weekConfig.patterns[patternIndex % this.weekConfig.patterns.length];
      const pattern = PATTERN_LIBRARY[patternName];
      for (let obstacleIndex = 0; obstacleIndex < pattern.length; obstacleIndex += 1) {
        const entry = pattern[obstacleIndex];
        obstacles.push(new Obstacle(entry.type, worldX + entry.offset));
      }
      worldX += this.weekConfig.spacing + (patternIndex % 2) * 45;
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
    drawGround(this.weekConfig.palette, this.scroll);
    for (let obstacleIndex = 0; obstacleIndex < this.obstacles.length; obstacleIndex += 1) {
      this.obstacles[obstacleIndex].render(this.scroll, this.weekConfig.palette);
    }
    drawClassroomDoor(this.doorWorldX - this.scroll, this.weekConfig.palette);
  }

  getProgress() {
    return clampValue(this.scroll / this.weekConfig.length, 0, 1);
  }
}

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

class QuizManager {
  constructor(questions, weekNumber) {
    this.questions = questions.slice(0, QUESTIONS_PER_WEEK);
    while (this.questions.length < QUESTIONS_PER_WEEK) {
      const fallback = QUESTION_FALLBACK.find((question) => question.week === weekNumber);
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
    const correct = answerIndex === this.currentQuestion.correctIndex;
    if (correct) {
      this.correctCount += 1;
      audio.correct();
    } else {
      audio.wrong();
    }
    this.feedbackFrames = 24;
  }

  render(gameInstance) {
    drawPanel(140, 134, 1000, 452, "#f4f1e8");
    fill("#14213a");
    noStroke();
    rect(166, 162, 948, 104, 3);
    drawPixelText(`QUESTION ${this.currentIndex + 1} / ${this.questions.length}`, 188, 202, 22, COLORS.gold, LEFT);
    drawWrappedText(this.currentQuestion.prompt, 188, 228, 890, 30, 23, COLORS.paper, LEFT);
    for (let answerIndex = 0; answerIndex < this.currentQuestion.options.length; answerIndex += 1) {
      const buttonX = 188 + (answerIndex % 2) * 456;
      const buttonY = 320 + Math.floor(answerIndex / 2) * 104;
      let selected = false;
      let disabled = false;
      if (this.feedbackFrames > 0) {
        selected = answerIndex === this.currentQuestion.correctIndex;
        disabled = answerIndex !== this.currentQuestion.correctIndex;
      } else {
        selected = answerIndex === this.selectedIndex;
      }
      drawPixelButton(buttonX, buttonY, 410, 72, `${answerIndex + 1}. ${this.currentQuestion.options[answerIndex]}`, selected, disabled);
      gameInstance.addHotspot(`answer-${answerIndex}`, buttonX, buttonY, 410, 72, () => {
        this.answer(answerIndex, gameInstance.audio);
      });
    }
    if (this.feedbackFrames > 0) {
      const correct = this.selectedIndex === this.currentQuestion.correctIndex;
      drawPixelText(correct ? "CORRECT" : "MISSED", 548, 548, 26, correct ? COLORS.green : COLORS.red, LEFT);
    }
  }
}

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
  drawGround(weekConfig.palette, scroll);
}

function drawWeekBackground(weekConfig, scroll) {
  drawSkyGradient(weekConfig.palette.skyTop, weekConfig.palette.skyBottom);
  drawClouds(scroll * 0.16);
  if (weekConfig.id === 1) {
    drawCampusLayer(scroll, weekConfig.palette);
  } else if (weekConfig.id === 2) {
    drawDormLayer(scroll, weekConfig.palette);
  } else if (weekConfig.id === 3) {
    drawNightlifeLayer(scroll, weekConfig.palette);
  } else if (weekConfig.id === 4) {
    drawLibraryLayer(scroll, weekConfig.palette);
  } else {
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
    ellipse(hillX + 180, 500, 420, 160);
  }
  fill("#e9dcb7");
  for (let archIndex = 0; archIndex < 4; archIndex += 1) {
    const archX = archIndex * 420 - (scroll * 0.2) % 420;
    rect(archX + 70, 340, 180, 150);
    fill("#5476a2");
    rect(archX + 118, 396, 84, 94, 40);
    fill("#e9dcb7");
    triangle(archX + 52, 340, archX + 160, 285, archX + 270, 340);
  }
}

function drawDormLayer(scroll, palette) {
  noStroke();
  for (let buildingIndex = 0; buildingIndex < 6; buildingIndex += 1) {
    const buildingX = buildingIndex * 300 - (scroll * 0.18) % 300;
    fill(buildingIndex % 2 === 0 ? "#8a6c7b" : "#6d7ea6");
    rect(buildingX, 236, 220, 270);
    fill("#ffe6a0");
    for (let windowX = buildingX + 28; windowX < buildingX + 190; windowX += 54) {
      for (let windowY = 268; windowY < 455; windowY += 52) {
        rect(windowX, windowY, 28, 26);
      }
    }
    fill(palette.accent);
    rect(buildingX + 18, 502, 180, 8);
  }
}

function drawNightlifeLayer(scroll, palette) {
  noStroke();
  fill("#183145");
  for (let blockIndex = 0; blockIndex < 7; blockIndex += 1) {
    const blockX = blockIndex * 250 - (scroll * 0.18) % 250;
    rect(blockX, 300 - (blockIndex % 3) * 22, 170, 230);
    fill(blockIndex % 2 === 0 ? "#ffcf4a" : "#e65a65");
    rect(blockX + 22, 328, 84, 22);
    rect(blockX + 26, 384, 24, 18);
    rect(blockX + 74, 420, 24, 18);
    fill("#183145");
  }
  fill("#46c2a4");
  for (let signIndex = 0; signIndex < 4; signIndex += 1) {
    const signX = signIndex * 360 + 120 - (scroll * 0.32) % 360;
    rect(signX, 238, 108, 34, 2);
  }
}

function drawLibraryLayer(scroll, palette) {
  noStroke();
  fill("#d4d0bd");
  for (let libraryIndex = 0; libraryIndex < 4; libraryIndex += 1) {
    const libraryX = libraryIndex * 430 - (scroll * 0.16) % 430;
    rect(libraryX + 40, 285, 300, 220);
    fill("#7d8790");
    for (let columnIndex = 0; columnIndex < 5; columnIndex += 1) {
      rect(libraryX + 72 + columnIndex * 50, 326, 24, 178);
    }
    fill("#d4d0bd");
    triangle(libraryX + 28, 285, libraryX + 190, 218, libraryX + 352, 285);
  }
}

function drawFinalLayer(scroll, palette) {
  noStroke();
  fill("#325d73");
  for (let gateIndex = 0; gateIndex < 4; gateIndex += 1) {
    const gateX = gateIndex * 430 - (scroll * 0.18) % 430;
    rect(gateX + 52, 340, 40, 170);
    rect(gateX + 268, 340, 40, 170);
    rect(gateX + 52, 340, 256, 24);
    fill(palette.accent);
    rect(gateX + 106, 292, 150, 42, 3);
    fill("#325d73");
  }
  fill("#ffffff");
  for (let sparkleIndex = 0; sparkleIndex < 18; sparkleIndex += 1) {
    const sparkleX = (sparkleIndex * 82 + frameCount * 0.8) % CANVAS_WIDTH;
    const sparkleY = 105 + (sparkleIndex % 5) * 42;
    rect(sparkleX, sparkleY, 8, 8);
  }
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
  push();
  stroke(COLORS.ink);
  strokeWeight(4);
  line(positionX + 41, 0, positionX + 41, positionY + 10);
  fill(damaged ? "#8d8d8d" : accentColor);
  ellipse(positionX + 41, positionY + 46, 82, 82);
  strokeWeight(2);
  stroke(COLORS.ink);
  for (let gridIndex = -2; gridIndex <= 2; gridIndex += 1) {
    line(positionX + 16, positionY + 46 + gridIndex * 14, positionX + 66, positionY + 46 + gridIndex * 14);
    line(positionX + 41 + gridIndex * 13, positionY + 16, positionX + 41 + gridIndex * 13, positionY + 76);
  }
  noStroke();
  fill("#ffffff");
  rect(positionX + 24, positionY + 25, 14, 10);
  rect(positionX + 50, positionY + 52, 12, 10);
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
  noFill();
  stroke(damaged ? "#9ba4b6" : COLORS.red);
  strokeWeight(5);
  ellipse(positionX + 35, positionY + 39, 29, 29);
  point(positionX + 46, positionY + 27);
  noStroke();
  fill(COLORS.red);
  rect(positionX + 46, positionY - 8, 24, 24, 12);
  drawPixelText("!", positionX + 53, positionY + 10, 16, COLORS.paper, LEFT);
  pop();
}

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