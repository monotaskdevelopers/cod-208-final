# Technical Structure

## Purpose

This is a recommended implementation structure for building `The Last Semester` in p5.js while staying aligned with the class brief and the refined mechanics.

## Core Architecture

The game fits well into a class-based p5.js structure because it has clearly separated gameplay states and reusable object types.

Recommended main classes/modules:

- `Game` or `GameStateManager`
- `Player`
- `Obstacle`
- `LevelManager`
- `QuizManager`
- `UIManager`
- `AssetLoader`
- `QuestionBank`

## Recommended Responsibilities

### GameStateManager

Handles:

- Current screen/state
- Difficulty selection
- Week progression
- Total credits
- Win/fail resolution
- Transition logic between commute and quiz

Suggested states:

- `title`
- `difficulty-select`
- `intro`
- `week-intro`
- `commute`
- `quiz`
- `week-summary`
- `ending-success`
- `ending-fail`

### Player

Handles:

- Position
- Jump physics
- Crouch state
- Current animation
- Collision box
- Hit feedback

The player should not control overall score or game progression directly.

### Obstacle

Handles:

- Type of distraction
- Sprite and animation
- Position and movement relative to scroll speed
- Collision bounds
- Whether the obstacle has already applied damage/credit drain

Obstacle types can be set through data values rather than separate classes if the project stays small.

### LevelManager

Handles:

- Week-specific speed
- Obstacle spawn patterns
- Background selection
- Door placement
- Level completion trigger

This keeps the commute logic separate from the rest of the game loop.

### QuizManager

Handles:

- Current question set
- Answer selection
- 60-second timer
- Credit rewards for the week
- Quiz completion condition

This class should own classroom rules so they do not get mixed into the platforming code.

### UIManager

Handles:

- Credits HUD
- Week counter
- Difficulty label
- Quiz timer
- Menu buttons
- Summary and ending panels

### AssetLoader

Handles:

- Preload calls for images, audio, and fonts
- Asset lookup by key
- Fallback placeholder logic during early prototyping

### QuestionBank

Handles:

- Loading COD 208 question data from JSON
- Returning questions by week or difficulty
- Avoiding repeated questions if needed

## Recommended Data Model

### Difficulty config

Use a simple config object:

```js
const DIFFICULTY = {
  easy: { targetCredits: 20 },
  medium: { targetCredits: 26 },
  hard: { targetCredits: 30 },
};
```

### Week config

Store week-specific variables in data rather than hard-coding them in draw logic.

```js
const WEEKS = [
  { id: 1, speed: 5, background: "week1", quizCredits: 6 },
  { id: 2, speed: 6, background: "week2", quizCredits: 6 },
  { id: 3, speed: 7, background: "week3", quizCredits: 6 },
  { id: 4, speed: 8, background: "week4", quizCredits: 6 },
  { id: 5, speed: 9, background: "week5", quizCredits: 6 },
];
```

### Question data

Recommended JSON shape:

```json
[
  {
    "week": 1,
    "prompt": "Question text here",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 2
  }
]
```

## Recommended Build Order

1. Get state switching working with placeholder screens.
2. Build player jump and crouch in a single test level.
3. Add obstacle collisions and credit drain.
4. Add week progression and increasing speed.
5. Add classroom quiz state with timer.
6. Connect total credits and ending logic.
7. Replace placeholders with real assets and polish.

## Scope Control

To keep the class project manageable:

- Reuse the same core player controller across all weeks.
- Change difficulty mainly through speed, spacing, and question selection.
- Avoid overbuilding narrative systems.
- Use data files for questions and week settings whenever possible.

## Practical Rule

If a piece of logic belongs only to one phase, keep it inside that phase's manager. The project will stay much easier to debug if commute systems and classroom systems do not leak into each other.
