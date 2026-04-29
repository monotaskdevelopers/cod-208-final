const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const GROUND_Y = 574;
const MAX_WEEKS = 5;
const QUIZ_SECONDS = 60;
const QUESTIONS_PER_WEEK = 6;

const COLORS = {
  ink: "#1c1c24",
  panel: "#253047",
  panelDark: "#111827",
  panelLight: "#4c6aa4",
  paper: "#f4f1e8",
  gold: "#f3c94a",
  red: "#d94a4a",
  green: "#3fbf5f",
  blue: "#2e5fd6",
  sky: "#6da9ff",
  dirt: "#c78b4b",
  dirtShadow: "#8a5b2f"
};

const DIFFICULTIES = [
  {
    id: "easy",
    label: "Easy",
    targetCredits: 20,
    description: "Forgiving graduation target"
  },
  {
    id: "medium",
    label: "Medium",
    targetCredits: 26,
    description: "Consistent weeks required"
  },
  {
    id: "hard",
    label: "Hard",
    targetCredits: 30,
    description: "Perfect semester pressure"
  }
];

const WEEK_CONFIGS = [
  {
    id: 1,
    title: "Campus Wakeup",
    subtitle: "Quadrangle paths, morning buzz, first-week pace",
    speed: 5.2,
    length: 5600,
    spacing: 760,
    palette: {
      skyTop: "#70b6ff",
      skyBottom: "#a9d9ff",
      far: "#8ecf87",
      mid: "#4d9c68",
      groundTop: "#3fbf5f",
      groundFace: "#c78b4b",
      groundShadow: "#8a5b2f",
      accent: "#f3c94a"
    },
    patterns: ["bed", "disco", "phone", "bedDisco", "bed", "phone"],
    loadingText: "Crossing the campus quad"
  },
  {
    id: 2,
    title: "Hallway Hustle",
    subtitle: "Lockers, posters, and tighter mixed decisions",
    speed: 6.1,
    length: 6200,
    spacing: 740,
    palette: {
      skyTop: "#75b8f8",
      skyBottom: "#d2e6ff",
      far: "#9bb0d9",
      mid: "#5f7fb9",
      groundTop: "#56c17b",
      groundFace: "#b85f45",
      groundShadow: "#743b35",
      accent: "#ffe06b"
    },
    patterns: ["phone", "bed", "disco", "phoneBed", "doubleBed", "disco"],
    loadingText: "Finding the next lecture hall"
  },
  {
    id: 3,
    title: "Cafeteria Chaos",
    subtitle: "Tray lines, vending glow, and louder distractions",
    speed: 6.9,
    length: 6900,
    spacing: 720,
    palette: {
      skyTop: "#244c8f",
      skyBottom: "#5b9fd8",
      far: "#315a6f",
      mid: "#24443d",
      groundTop: "#43c46c",
      groundFace: "#6e5874",
      groundShadow: "#2c2635",
      accent: "#ffcf4a"
    },
    patterns: ["disco", "phone", "bedDisco", "phone", "discoBed", "bed"],
    loadingText: "Crossing the student commons"
  },
  {
    id: 4,
    title: "Library Stacks",
    subtitle: "Shelves, desk lamps, and denser obstacle chains",
    speed: 7.8,
    length: 7600,
    spacing: 700,
    palette: {
      skyTop: "#8fc7ff",
      skyBottom: "#d7ebff",
      far: "#95a7ad",
      mid: "#6e8391",
      groundTop: "#4bbf73",
      groundFace: "#9c8f68",
      groundShadow: "#59513e",
      accent: "#f3c94a"
    },
    patterns: ["phoneBed", "bed", "disco", "phoneDisco", "bed", "doubleBed"],
    loadingText: "Looking for a silent corner"
  },
  {
    id: 5,
    title: "OZU Final Hall",
    subtitle: "Banners, exam doors, and the classroom in sight",
    speed: 8.8,
    length: 8400,
    spacing: 680,
    palette: {
      skyTop: "#5ca8ff",
      skyBottom: "#ffd37a",
      far: "#73b88a",
      mid: "#416f8a",
      groundTop: "#42c767",
      groundFace: "#bd7f4a",
      groundShadow: "#6b442d",
      accent: "#ffef74"
    },
    patterns: ["bedDisco", "phone", "disco", "phoneDisco", "bed", "finalMix"],
    loadingText: "Marching toward finals"
  }
];

const OBSTACLE_DEFS = {
  bed: {
    label: "Bed",
    action: "jump",
    width: 118,
    height: 52,
    colliderInset: 8
  },
  disco: {
    label: "Party",
    action: "crouch",
    width: 82,
    height: 92,
    colliderInset: 6
  },
  phone: {
    label: "Scroll",
    action: "jump",
    width: 70,
    height: 86,
    colliderInset: 6
  }
};

const PATTERN_LIBRARY = {
  bed: [{ type: "bed", offset: 0 }],
  disco: [{ type: "disco", offset: 0 }],
  phone: [{ type: "phone", offset: 0 }],
  bedDisco: [
    { type: "bed", offset: 0 },
    { type: "disco", offset: 335 }
  ],
  discoBed: [
    { type: "disco", offset: 0 },
    { type: "bed", offset: 360 }
  ],
  phoneBed: [
    { type: "phone", offset: 0 },
    { type: "bed", offset: 345 }
  ],
  discoPhone: [
    { type: "disco", offset: 0 },
    { type: "phone", offset: 355 }
  ],
  phoneDisco: [
    { type: "phone", offset: 0 },
    { type: "disco", offset: 360 }
  ],
  doubleBed: [
    { type: "bed", offset: 0 },
    { type: "bed", offset: 380 }
  ],
  doublePhone: [
    { type: "phone", offset: 0 },
    { type: "phone", offset: 360 }
  ],
  bedPhoneDisco: [
    { type: "bed", offset: 0 },
    { type: "phone", offset: 360 },
    { type: "disco", offset: 735 }
  ],
  finalMix: [
    { type: "disco", offset: 0 },
    { type: "bed", offset: 350 },
    { type: "phone", offset: 735 },
    { type: "disco", offset: 1110 }
  ]
};

const QUESTION_FALLBACK = [
  {
    week: 1,
    prompt: "Which p5.js function is called once when the sketch first starts?",
    options: ["draw()", "setup()", "mousePressed()", "keyTyped()"],
    correctIndex: 1
  },
  {
    week: 1,
    prompt: "Which function repeats every frame in a p5.js sketch?",
    options: ["setup()", "preload()", "draw()", "windowResized()"],
    correctIndex: 2
  },
  {
    week: 1,
    prompt: "What does createCanvas(1280, 720) define?",
    options: ["The browser window size", "The drawing surface size", "The frame rate", "The color mode"],
    correctIndex: 1
  },
  {
    week: 1,
    prompt: "Which p5.js variable gives the current horizontal mouse position?",
    options: ["mouseX", "pmouseY", "keyCode", "deltaTime"],
    correctIndex: 0
  },
  {
    week: 1,
    prompt: "Which command sets the fill color for shapes drawn after it?",
    options: ["stroke()", "fill()", "rect()", "background()"],
    correctIndex: 1
  },
  {
    week: 1,
    prompt: "Why is preload() useful for games?",
    options: ["It stores keyboard input", "It loads assets before setup", "It checks collisions", "It changes screen size"],
    correctIndex: 1
  },
  {
    week: 2,
    prompt: "Which JavaScript data type is best for an ordered list of quiz questions?",
    options: ["Boolean", "Array", "String", "Number"],
    correctIndex: 1
  },
  {
    week: 2,
    prompt: "What does an object literal usually store?",
    options: ["Named properties", "Only one number", "Only true or false", "Only keyboard events"],
    correctIndex: 0
  },
  {
    week: 2,
    prompt: "Which loop is commonly used to visit every item in an array?",
    options: ["if", "for", "return", "const"],
    correctIndex: 1
  },
  {
    week: 2,
    prompt: "What does push() do to an array?",
    options: ["Removes the first item", "Adds an item to the end", "Sorts all items", "Clears the array"],
    correctIndex: 1
  },
  {
    week: 2,
    prompt: "Which keyword creates a value that should not be reassigned?",
    options: ["var", "let", "const", "case"],
    correctIndex: 2
  },
  {
    week: 2,
    prompt: "Why store week settings in data instead of scattered code?",
    options: ["It makes tuning easier", "It disables input", "It removes the canvas", "It hides variables"],
    correctIndex: 0
  },
  {
    week: 3,
    prompt: "In a platformer, gravity usually changes which value?",
    options: ["Horizontal color", "Vertical velocity", "Font size", "Mouse position"],
    correctIndex: 1
  },
  {
    week: 3,
    prompt: "AABB collision means checking overlap between what?",
    options: ["Audio tracks", "Rectangular bounds", "Color palettes", "Keyboard strings"],
    correctIndex: 1
  },
  {
    week: 3,
    prompt: "Why add a short invulnerability timer after a hit?",
    options: ["To prevent repeated damage per overlap", "To stop drawing the HUD", "To reset all questions", "To increase font weight"],
    correctIndex: 0
  },
  {
    week: 3,
    prompt: "What does deltaTime help measure?",
    options: ["Elapsed time between frames", "The active font", "The number of images", "The selected answer"],
    correctIndex: 0
  },
  {
    week: 3,
    prompt: "Which input should trigger a jump in this game?",
    options: ["Left arrow", "Up arrow", "Escape", "Spacebar only"],
    correctIndex: 1
  },
  {
    week: 3,
    prompt: "What makes a high obstacle fair?",
    options: ["It is readable before it reaches the player", "It is invisible", "It changes size randomly", "It overlaps the HUD"],
    correctIndex: 0
  },
  {
    week: 4,
    prompt: "What is a game state manager responsible for?",
    options: ["Screen transitions and run data", "Only drawing one rectangle", "Only browser reloads", "Only image compression"],
    correctIndex: 0
  },
  {
    week: 4,
    prompt: "Which state should handle multiple-choice questions?",
    options: ["commute", "quiz", "title", "ending"],
    correctIndex: 1
  },
  {
    week: 4,
    prompt: "Why keep commute and classroom systems separate?",
    options: ["They have different rules and pacing", "They use the same obstacles", "They both need gravity", "They should share every variable"],
    correctIndex: 0
  },
  {
    week: 4,
    prompt: "Which method is a clean way to restart a run?",
    options: ["Reset central game values", "Reload every image each frame", "Delete the canvas", "Ignore input"],
    correctIndex: 0
  },
  {
    week: 4,
    prompt: "What does a HUD usually show?",
    options: ["Status values during play", "Only source code", "Browser history", "Asset filenames"],
    correctIndex: 0
  },
  {
    week: 4,
    prompt: "What should happen after Week 5 summary?",
    options: ["Compare credits to the target", "Start Week 1 again automatically", "Hide the ending", "Erase difficulty"],
    correctIndex: 0
  },
  {
    week: 5,
    prompt: "Which visual rule matters most for a fast platformer?",
    options: ["Readable silhouettes", "Tiny hidden hazards", "Thin low-contrast text", "Random layouts"],
    correctIndex: 0
  },
  {
    week: 5,
    prompt: "Why use parallax layers?",
    options: ["To suggest depth and motion", "To remove collision logic", "To pause the timer", "To replace all inputs"],
    correctIndex: 0
  },
  {
    week: 5,
    prompt: "What is the maximum credit total after five perfect quizzes?",
    options: ["20", "26", "30", "60"],
    correctIndex: 2
  },
  {
    week: 5,
    prompt: "Which difficulty target requires a perfect score?",
    options: ["Easy", "Medium", "Hard", "Practice"],
    correctIndex: 2
  },
  {
    week: 5,
    prompt: "What should a final screen communicate?",
    options: ["Whether the player graduated", "Only the first question", "Only obstacle speed", "Nothing"],
    correctIndex: 0
  },
  {
    week: 5,
    prompt: "Which choice best supports maintainable game content?",
    options: ["Week and quiz data in structured objects", "Every number hidden in draw()", "Duplicated collision code", "No reset path"],
    correctIndex: 0
  }
];