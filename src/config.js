// canvas width and height are how big the game drawing area is in pixels
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
// ground_y is where the floor is so the player lands at the right height
const GROUND_Y = 574;
// the game has five weeks total before you reach the end
const MAX_WEEKS = 5;
// each quiz gives the player 60 seconds to answer all the questions
const QUIZ_SECONDS = 60;
// six questions per week, each one is worth one credit if you get it right
const QUESTIONS_PER_WEEK = 6;
// base speed is how fast week 1 scrolls, the later weeks build on this
const BASE_WEEK_SPEED = 6.2;
// every new week gets 20 persent faster using this multiplyer
const WEEK_SPEED_MULTIPLIER = 1.2;

// these are all the colors we use, keeping them here means we only have to change one spot
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

// difficulty controls how many credits you need to graduate at the end
// easy is forgiving, hard makes you do almost everything right
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

// week configs hold everything each week needs, speed, colors, and obstacle order
// putting them all here makes it easy to tweak one week without touching the game code
const WEEK_CONFIGS = [
  // week 1 is slow and simple so the player can learn the controls
  {
    id: 1,
    title: "Campus Wakeup",
    subtitle: "Quadrangle paths, morning buzz, first-week pace",
    speed: BASE_WEEK_SPEED,
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
  // week 2 goes a little faster and starts mixing obsticles together
  {
    id: 2,
    title: "Hallway Hustle",
    subtitle: "Lockers, posters, and tighter mixed decisions",
    speed: BASE_WEEK_SPEED * WEEK_SPEED_MULTIPLIER,
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
  // week 3 is louder and the obstacles start coming in pairs more often
  {
    id: 3,
    title: "Cafeteria Chaos",
    subtitle: "Tray lines, vending glow, and louder distractions",
    speed: BASE_WEEK_SPEED * WEEK_SPEED_MULTIPLIER ** 2,
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
  // week 4 is the libary, things get tight and the spacing is smaller
  {
    id: 4,
    title: "Library Stacks",
    subtitle: "Shelves, desk lamps, and denser obstacle chains",
    speed: BASE_WEEK_SPEED * WEEK_SPEED_MULTIPLIER ** 3,
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
  // week 5 is the final hall, fastest speed and the hardest obstacle mix
  {
    id: 5,
    title: "OZU Final Hall",
    subtitle: "Banners, exam doors, and the classroom in sight",
    speed: BASE_WEEK_SPEED * WEEK_SPEED_MULTIPLIER ** 4,
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

// obstacle defs say how big each one is and wether you jump or crouch to avoid it
// the collider inset makes the hit box a bit smaller so it feels more fair
const OBSTACLE_DEFS = {
  bed: {
    label: "Bed",
    // bed is on the ground so you have to jump over it
    action: "jump",
    width: 118,
    height: 52,
    colliderInset: 8
  },
  disco: {
    label: "Party",
    // disco ball hangs in the air so you duck under it
    action: "crouch",
    width: 82,
    height: 92,
    colliderInset: 6
  },
  phone: {
    label: "Scroll",
    // phone is on the ground, jump to avoid getting distracted
    action: "jump",
    width: 70,
    height: 86,
    colliderInset: 6
  }
};

// the pattern library groups obstacles into named combos for each week to use
// single ones are easy, the multi ones are harder and need quick thinking
const PATTERN_LIBRARY = {
  bed: [{ type: "bed", offset: 0 }],
  disco: [{ type: "disco", offset: 0 }],
  phone: [{ type: "phone", offset: 0 }],
  // bedDisco puts a bed right after a disco so the player has to jump then duck fast
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
  // doubleBed is just two beds close togther which trips people up
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
  // finalMix is four obstacles back to back, only shows up in week 5
  finalMix: [
    { type: "disco", offset: 0 },
    { type: "bed", offset: 350 },
    { type: "phone", offset: 735 },
    { type: "disco", offset: 1110 }
  ]
};

// this fallback list is used when the questions.json file can't be loaded
// its the same questions the real file has so the game still works ofline
const QUESTION_FALLBACK = [
  // week 1 questions are all about basic p5 stuff like setup and draw
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
  // week 2 questions move on to javascript basics like arrays and objects
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
  // week 3 asks about movement and colision stuff in games
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
    prompt: "Which p5.js function can move the origin before drawing?",
    options: ["translate()", "fill()", "createCanvas()", "frameRate()"],
    correctIndex: 0
  },
  {
    week: 3,
    prompt: "Which p5.js function can rotate shapes or images?",
    options: ["background()", "rotate()", "strokeWeight()", "textAlign()"],
    correctIndex: 1
  },
  // week 4 goes back to p5 drawing functions like rect and background
  {
    week: 4,
    prompt: "Which function clears the canvas with a fresh color?",
    options: ["createCanvas()", "text()", "background()", "noStroke()"],
    correctIndex: 2
  },
  {
    week: 4,
    prompt: "Which function draws a rectangle in p5.js?",
    options: ["ellipse()", "rect()", "triangle()", "point()"],
    correctIndex: 1
  },
  {
    week: 4,
    prompt: "What does noStroke() do?",
    options: ["It removes outlines from shapes", "It removes fill colors", "It stops the draw loop", "It changes text size"],
    correctIndex: 0
  },
  {
    week: 4,
    prompt: "Which function draws an image onto the canvas?",
    options: ["line()", "rect()", "tint()", "image()"],
    correctIndex: 3
  },
  {
    week: 4,
    prompt: "Which function shows words on the canvas?",
    options: ["background()", "text()", "scale()", "rotate()"],
    correctIndex: 1
  },
  {
    week: 4,
    prompt: "What do push() and pop() help save and restore?",
    options: ["They load pictures from files", "They pause the sketch", "They save and restore drawing settings", "They count frames"],
    correctIndex: 2
  },
  // week 5 questions cover more p5 helpers and then ends with the fun one
  {
    week: 5,
    prompt: "Which function sets the outline color for shapes?",
    options: ["stroke()", "fill()", "noLoop()", "circle()"],
    correctIndex: 0
  },
  {
    week: 5,
    prompt: "Which function gives a random value?",
    options: ["map()", "constrain()", "random()", "dist()"],
    correctIndex: 2
  },
  {
    week: 5,
    prompt: "Which function can remap one number range into another?",
    options: ["lerp()", "map()", "text()", "vertex()"],
    correctIndex: 1
  },
  {
    week: 5,
    prompt: "Which constant is often used to center text or shapes?",
    options: ["LEFT", "TOP", "BOTTOM", "CENTER"],
    correctIndex: 3
  },
  {
    week: 5,
    prompt: "Which p5.js function can draw a circle or oval?",
    options: ["square()", "arc()", "ellipse()", "quad()"],
    correctIndex: 2
  },
  {
    week: 5,
    prompt: "do you like COD 208?",
    options: ["Yes", "Of course", "definitely", "YES!"],
    // all four answers are correct here so everyone gets this one right
    correctIndex: [0, 1, 2, 3]
  }
];