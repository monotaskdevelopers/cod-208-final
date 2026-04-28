# Detailed Implementation Roadmap

## Purpose

This document translates the existing design documentation into a practical build order for `The Last Semester`. It is written for implementation, not concept development. The goal is to tell you exactly what to build first, what can stay temporary, what should be tested before moving on, and how the reference images should shape the final result.

This roadmap assumes:

- The game will be built in p5.js.
- The codebase will use a class-based structure.
- The project should stay small enough for a class deadline.
- Placeholder art is acceptable early, but the final visual direction should follow the reference images and the rules in `visual-direction.md`.

## Non-Negotiable Build Rules

Before implementation starts, lock these rules so the project does not drift:

1. Build one complete week vertically before trying to build all five weeks.
2. Use placeholder shapes and debug text first, then replace them with art.
3. Keep commute systems separate from classroom systems.
4. Store week settings and quiz data in plain objects or JSON instead of hard-coding values across multiple files.
5. Do not copy art from the inspiration images. Use them only for composition, palette logic, readability, and pacing reference.

## Recommended Technical Baseline

To keep the project manageable, start with a simple file layout rather than over-engineering the codebase.

Recommended initial structure:

```text
index.html
style.css
src/
  sketch.js
  config.js
  GameStateManager.js
  Player.js
  Obstacle.js
  LevelManager.js
  QuizManager.js
  UIManager.js
  QuestionBank.js
assets/
  player/
  obstacles/
  environment/
  ui/
  quiz/
  effects/
  audio/
  data/
```

Recommended implementation defaults:

- Canvas size: start with `1280 x 720` or `960 x 540`
- Rendering style: nearest-neighbor scaling for pixel art
- Game state storage: one central state manager
- Credits start at `0`
- Obstacle collision penalty: start with `-1 credit`
- Credits can go below `0` during early prototypes unless the team decides to clamp later
- Weekly assignment structure: `6 questions per week`, `1 credit per correct answer`, `6 credits max`

These defaults follow the current docs and make the math easy to understand.

## Reference Image Translation Into Implementation Rules

The three reference images should guide implementation in specific ways.

### Mario-style reference: gameplay readability

Use this reference to implement:

- Clear obstacle silhouettes
- Strong terrain edges
- Safe ground that is readable immediately
- Large, obvious collision shapes
- A camera framing where the player always has space ahead to read the next hazard

### Sonic-style reference: speed and screen rhythm

Use this reference to implement:

- Long horizontal movement lanes
- Strong blue-sky negative space
- Fast-feeling obstacle spacing
- Repeating visual beats that make the run feel continuous
- HUD counters that are always visible and easy to parse while moving

### Kirby-style reference: layered atmosphere

Use this reference to implement:

- Softer, more decorative backgrounds behind sharper gameplay objects
- Friendly but readable environmental dressing
- A foreground-to-background contrast strategy
- A slightly playful tone that still supports tension

## Phase 0: Pre-Production Lock

### Goal

Turn the design docs into one implementation agreement so the team does not redesign mechanics while coding.

### Steps

1. Read all files in the `docs/` folder together as one spec.
2. Lock the current rules from `game-rules-and-mechanics.md`.
3. Lock the current flow from `user-flow-and-screens.md`.
4. Lock the art direction from `visual-direction.md`.
5. Decide whether the prototype allows negative credits or clamps at zero.
6. Decide how many questions appear in each weekly quiz.
7. Decide whether quiz answers will be mouse-driven only or allow number keys too.
8. Decide the canvas size and whether the game should scale responsively.
9. Decide who is responsible for code, art, question writing, and polish.
10. Write these decisions in one shared checklist or issue tracker.

### Output

- One locked implementation note for the team
- No unresolved questions about controls, credits, or quiz structure

### Exit Criteria

- Everyone on the team can describe the exact weekly loop without disagreement.

## Phase 1: Project Scaffold And p5.js Bootstrapping

### Goal

Create the minimum runnable project so the team can iterate fast.

### Steps

1. Create the base file structure.
2. Add p5.js to `index.html` through a CDN script or the team's preferred setup.
3. Create a canvas in `setup()`.
4. Set a stable frame rate target.
5. Add a single background color so the sketch visibly renders.
6. Add `draw()` with a state switch based on the current screen.
7. Create placeholder states for:
   - `title`
   - `difficulty-select`
   - `intro`
   - `week-intro`
   - `commute`
   - `door-transition`
   - `quiz`
   - `week-summary`
   - `ending-success`
   - `ending-fail`
8. Add a temporary text label for each state so you can confirm screen changes visually.
9. Add a simple input helper for Enter, arrow keys, and mouse clicks.
10. Add a `config.js` file containing difficulty values, week values, and global constants.

### What To Keep Temporary

- Backgrounds can be solid colors.
- The player can be a rectangle.
- Obstacles can be colored boxes.
- Menu buttons can be plain drawn rectangles.

### Validation

- The game launches without errors.
- You can switch between all core states manually.
- The canvas shows the correct state label every time.

### Exit Criteria

- The skeleton project runs and the state machine exists, even if nothing looks polished yet.

## Phase 2: Core State Management And Menu Flow

### Goal

Implement the front half of the player journey before touching advanced gameplay logic.

### Steps

1. Create `GameStateManager`.
2. Store these core values in one place:
   - current state
   - selected difficulty
   - current week
   - current total credits
   - max weeks
   - win or fail result
3. Build the `title` screen.
4. Add a start prompt with keyboard or mouse confirmation.
5. Build the `difficulty-select` screen.
6. Add three difficulty buttons with visible targets:
   - Easy: 20
   - Medium: 26
   - Hard: 30
7. Build the `intro` screen using a short summary of the semester goal.
8. Build the `week-intro` screen that shows week number, current credits, and target credits.
9. Add transitions so the game can move from `title` to `difficulty-select` to `intro` to `week-intro` to `commute`.
10. Add a reset function that returns all game values to defaults.

### UX Rules To Implement Here

- The selected difficulty should remain visible after the player chooses it.
- The player should never lose track of which week they are on.
- Menu buttons should be large and simple.

### Validation

- The entire front menu sequence works without opening the commute or quiz systems yet.
- Reset sends the player back to a clean title state.

### Exit Criteria

- A player can start a run, choose difficulty, see the intro, and reach Week 1 consistently.

## Phase 3: Player Controller And Commute Prototype

### Goal

Build the movement foundation for the platforming section using placeholder art.

### Steps

1. Create `Player.js`.
2. Add properties for:
   - x
   - y
   - width
   - height
   - vertical velocity
   - gravity
   - jump force
   - grounded state
   - crouch state
   - hit state or invulnerability timer
3. Place the player on a single ground plane.
4. Implement auto-run behavior by keeping the player visually fixed while the world moves left, or by moving the player right while the camera follows.
5. For scope and simplicity, prefer keeping the player near the left third of the screen and moving world objects left.
6. Implement `jump()` on up arrow.
7. Allow jumps only when grounded.
8. Implement `crouch()` on down arrow.
9. Resize or shift the hitbox when crouching if needed.
10. Add a debug draw for the hitbox.
11. Tune gravity, jump force, and fall speed until motion feels snappy rather than floaty.
12. Add a simple idle, run, jump, and crouch visual difference, even if it is only color changes during prototype.

### Important Motion Target From The References

- Jump rise should be quick.
- Falling should be slightly faster than rising.
- Crouch should feel immediate, not delayed.
- The run should feel constant and pressurized.

### Validation

- The player can jump cleanly over a placeholder block.
- The player can crouch under a placeholder overhead object.
- The player cannot double jump unless explicitly allowed.
- The player returns to standing correctly after crouch release.

### Exit Criteria

- The movement system already feels like the intended game, even without art.

## Phase 4: Obstacle System, World Scroll, And Collision Logic

### Goal

Turn the commute into a playable obstacle course with credit penalties.

### Steps

1. Create `Obstacle.js`.
2. Define obstacle types for:
   - bed
   - disco ball
   - instagram
3. Give each obstacle a type, position, size, speed multiplier, and whether it has already applied damage.
4. Create `LevelManager.js`.
5. Store week-specific values in a config object, including:
   - world speed
   - background key
   - obstacle spawn timing
   - obstacle pattern list
   - level length or door position
6. Start with Week 1 only.
7. Spawn obstacles from right to left using a timer or pattern queue.
8. Render obstacles as distinct colored placeholder shapes that match their final silhouette logic:
   - bed as a wide low rectangle
   - disco ball as a hanging or round shape
   - instagram as a square or phone-like icon
9. Add axis-aligned bounding box collision first because it is easy to debug.
10. On collision, subtract `1 credit` from the total.
11. Add a brief invulnerability timer so one overlap does not remove multiple credits per frame.
12. Add hit feedback such as flash, tint, or screen shake.
13. Remove obstacles once they leave the screen.
14. Add a door object at the end of the level.
15. Trigger `door-transition` when the player reaches the door.

### Recommended First Pattern Set

Start with only three pattern types:

1. Single jump obstacle
2. Single crouch obstacle
3. Jump followed by crouch

Do not build advanced patterns until the basic rhythm is fair.

### Validation

- Obstacles spawn and move consistently.
- Credits decrease only once per valid collision.
- The player can survive a short Week 1 commute.
- The level ends cleanly when the door is reached.

### Exit Criteria

- Week 1 commute is fully playable with placeholder visuals.

## Phase 5: HUD, Screen Feedback, And Readability Layer

### Goal

Make the game readable while it is being played, not just while being debugged.

### Steps

1. Create `UIManager.js`.
2. Draw a retro-style HUD frame in the screen corners.
3. Show these values during commute:
   - current credits
   - target credits
   - current week
   - selected difficulty
4. Keep the HUD fixed to the screen rather than the world.
5. Use strong outline colors so the text stays readable over bright backgrounds.
6. Add hit feedback messaging only if it does not clutter the screen.
7. Build the `week-summary` screen.
8. Show:
   - credits earned this week
   - credits lost during commute if tracked separately
   - new total credits
   - selected target
   - short status message
9. Build the success and fail result panels for the end of the game.
10. Make sure the UI layout works before final art is imported.

### Reference-Driven UI Rules

- Use the Sonic-style always-visible counter logic.
- Keep the HUD simple like an arcade overlay.
- Avoid modern flat UI or thin text.

### Validation

- The player can tell their status without pausing.
- No HUD element overlaps important gameplay action.
- The summary screen explains what happened that week.

### Exit Criteria

- A spectator can understand the player's progress just by watching the screen.

## Phase 6: Classroom Quiz System And Question Data

### Goal

Implement the classroom phase as a clean, timed COD 208 multiple-choice system.

### Steps

1. Create `assets/data/questions.json`.
2. Structure question data with at least:
   - week
   - prompt
   - options
   - correctIndex
3. Create `QuestionBank.js`.
4. Load the JSON in `preload()` or through a dedicated loader.
5. Add a method to fetch only the current week's questions.
6. Create `QuizManager.js`.
7. Store:
   - current question list
   - current question index
   - selected answer
   - timer remaining
   - score
   - completion state
8. Start with a simple structure of `6 questions per week` and `1 credit per correct answer`.
9. Build the classroom layout using placeholder panels.
10. Display:
    - question text
    - four answer options
    - timer
    - week
    - total credits so far
11. Add answer input using mouse click first.
12. Add number-key input later if it does not complicate the UI.
13. Subtract time continuously from `60 seconds`.
14. End the quiz when either:
    - all questions are answered
    - the timer reaches zero
15. Convert correct answers into weekly credits.
16. Add immediate answer feedback if wanted, but keep it fast so the quiz does not drag.
17. Send the game to `week-summary` once the quiz ends.

### Important Classroom Design Rule

The classroom should feel tense but calmer than the commute. The pressure comes from the timer, not from visual chaos.

### Validation

- The correct weekly question set loads.
- The timer starts and ends correctly.
- Correct answers award credits correctly.
- The player cannot select multiple answers for the same question unless that behavior is intentional.

### Exit Criteria

- One full week can be played from intro to commute to classroom to summary.

## Phase 7: First Vertical Slice Completion

### Goal

Finish a fully playable Week 1 before scaling content.

### Steps

1. Play from title to Week 1 summary without using debug skips.
2. Fix any state transition bugs.
3. Fix any credit calculation bugs.
4. Fix any timer bugs.
5. Fix any collision fairness problems.
6. Reduce friction in menus and screen transitions.
7. Confirm that the player clearly understands what to do in both phases.
8. Confirm that the game already feels like `The Last Semester` even with placeholder art.

### Vertical Slice Questions To Ask

- Does auto-run already create pressure?
- Are the obstacle types readable in one glance?
- Does the classroom phase feel like a meaningful reward and risk layer?
- Does the credit goal feel understandable?
- Does the week summary motivate the next round?

### Exit Criteria

- Week 1 feels like a small but complete version of the final game.

## Phase 8: Scale From One Week To Five Weeks

### Goal

Expand the system from a single successful week into the full semester structure.

### Steps

1. Add week data for Weeks 2 to 5.
2. Increase world speed per week.
3. Increase obstacle complexity per week.
4. Keep the core rules identical so the player is learning escalating difficulty, not new controls.
5. Add week-specific background keys.
6. Add unique obstacle pattern sets for each week.
7. Add unique question sets for each week.
8. Update `week-intro` copy so it reflects progression.
9. After each `week-summary`, increment the week counter.
10. After Week 5 summary, compare total credits against the selected target.
11. Route to `ending-success` or `ending-fail`.

### Recommended Difficulty Curve

- Week 1: onboarding speed and simple patterns
- Week 2: slightly faster with clearer mixed actions
- Week 3: more frequent obstacle decisions
- Week 4: tighter spacing and less downtime
- Week 5: highest movement pressure and the most demanding final quiz context

### Validation

- Every week loads the correct speed and content.
- Credits persist correctly across all five weeks.
- The final ending logic respects difficulty selection.

### Exit Criteria

- The entire semester can be played start to finish.

## Phase 9: Visual Production And Asset Integration

### Goal

Replace placeholder visuals with a coherent pixel-art presentation that follows the references.

### Steps

1. Create the `assets/` folder structure from `asset-import-plan.md`.
2. Import or create placeholder sprite sheets with matching pixel density.
3. Start by replacing only the most important gameplay assets:
   - player
   - three obstacle types
   - ground tiles
   - classroom door
   - HUD panel
4. Set image rendering to preserve crisp pixel edges.
5. Build the player run cycle first because it is the most visible animation.
6. Add jump, crouch, idle, and hit states afterward.
7. Replace obstacle rectangles with readable pixel sprites.
8. Build the Week 1 environment using a composition inspired by the references:
   - broad readable ground
   - big sky or open background space
   - chunky, simple props
   - higher-contrast foreground than background
9. Add parallax layers carefully so they support motion without clutter.
10. Repeat the same structure for Weeks 2 to 5 with different props and palette emphasis.
11. Build the classroom background and quiz panel.
12. Replace plain menu buttons with retro-styled UI elements.
13. Add the diploma art to the success ending.

### Visual Implementation Checklist From The References

- The player silhouette is readable from a distance.
- Obstacles are recognizable before the player reaches them.
- The HUD reads clearly over bright environments.
- Background detail stays behind gameplay detail.
- The screen composition suggests speed without becoming noisy.

### Exit Criteria

- The game looks stylistically consistent from title screen to ending.

## Phase 10: Audio, Juice, And Transition Polish

### Goal

Add feedback that makes the game feel finished without blowing up scope.

### Steps

1. Add a jump sound.
2. Add a hit sound.
3. Add menu selection sounds.
4. Add a door transition cue.
5. Add a quiz countdown warning sound near the final seconds.
6. Add separate loop tracks for commute and classroom if available.
7. Add a short victory cue for graduation.
8. Add a fail cue for non-graduation.
9. Add small visual effects:
   - jump dust
   - hit flash
   - screen shake on collision
   - fade or wipe into classroom
   - confetti or shine on diploma screen
10. Keep effects short and readable so they do not interrupt play.

### Validation

- Feedback improves clarity rather than distracting from input.
- Audio levels are balanced.
- Transitions feel intentional rather than abrupt.

### Exit Criteria

- The project feels cohesive and no longer like a prototype.

## Phase 11: Balancing, Bug Fixing, And Submission Prep

### Goal

Stabilize the build and make it presentation-ready.

### Steps

1. Playtest all three difficulties.
2. Confirm that Easy is forgiving, Medium is demanding, and Hard feels near-perfect.
3. Check whether collision penalties are too harsh or too soft.
4. Check whether the 60-second quiz timer feels fair with the actual question count.
5. Check whether Week 5 is difficult because of speed, not because of unreadable layout.
6. Remove debug overlays and test shortcuts.
7. Test the full five-week run multiple times.
8. Confirm that reset and replay always work.
9. Confirm that no week loads the wrong question data or speed value.
10. Confirm that the ending is based on total credits and selected difficulty.
11. Prepare a final checklist for submission.
12. Record screenshots or a demo video if required by the class.

### Final QA Checklist

- Title screen works
- Difficulty selection works
- Intro flow works
- Week intros display correct data
- Player jump and crouch respond immediately
- Obstacles collide fairly
- Credits update correctly
- Door transition works
- Quiz timer works
- Quiz answers score correctly
- Week summaries show correct totals
- Week progression reaches Week 5
- Endings respect difficulty thresholds
- Replay resets the run correctly

### Exit Criteria

- The build is stable enough to be shown live without explanation-heavy apologies.

## Suggested Development Order By Priority

If time gets tight, implement in this order:

1. State machine
2. Player movement
3. Obstacle collisions
4. Week 1 end-to-end loop
5. Quiz system
6. Full five-week progression
7. HUD clarity
8. Art replacement
9. Audio and polish

This protects the core experience first.

## Scope-Control Decisions That Will Save The Project

- Reuse one player controller across the entire game.
- Reuse one HUD layout across all gameplay states.
- Use data to change weeks instead of writing five separate level systems.
- Keep quiz structure identical every week and only change content.
- Use only three core obstacle families unless there is extra time.
- Prioritize readability over visual detail.

## Definition Of Done

The project is implementation-complete when:

- A player can start at the title screen and reach a final ending without debug shortcuts.
- All five weeks function with increasing speed.
- Each week contains a commute and a classroom quiz.
- Credits persist across the full run.
- Easy, Medium, and Hard produce different graduation thresholds.
- The visual presentation clearly reflects the retro pixel-platformer direction.
- The game communicates stress through pace, countdowns, and progression rather than confusion.

## Recommended Team Split

If the project is divided across multiple people, use this split:

- Person 1: state management, player controller, collision logic
- Person 2: quiz system, question data, week summaries, endings
- Person 3: art production, UI styling, asset import, audio and polish

If only two people are coding, merge the UI and art integration work into the person handling screens and state transitions.

## Final Implementation Advice

Do not try to make the game beautiful before it is playable. First make Week 1 work with rectangles. Then make the system complete across five weeks. Then make it look like the reference images. That order gives you the best chance of finishing a class project that is both coherent and presentable.
