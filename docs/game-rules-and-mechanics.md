# Game Rules And Mechanics

## Locked Decisions From The Current Concept

These points come directly from the brief and Gemini refinement and should be treated as the current approved rules:

- The game is a 2D side-scrolling platformer with auto-movement to the right.
- The player uses the up arrow to jump and the down arrow to crouch.
- The game lasts 5 weeks, with each week acting as one level.
- Each week has two phases: commute and classroom.
- Commute hazards are student-life distractions such as beds, disco balls, and Instagram-related obstacles.
- Hitting obstacles drains credits.
- The classroom phase is now a timed multiple-choice COD 208 quiz.
- Each weekly assignment is worth 6 credits.
- Each quiz has a 1-minute maximum timer.
- Difficulty options are Easy, Medium, and Hard.
- Graduation thresholds are 20, 26, and 30 credits respectively.
- The player sees both a credit tracker and a week counter.
- The game ends with a graduation result and diploma outcome.

## Core Loop

Each week follows this structure:

1. Week intro
2. Auto-run commute section
3. Avoid distractions through jump and crouch actions
4. Reach classroom door
5. Start timed COD 208 quiz
6. Earn up to 6 credits for the week
7. Show week summary
8. Move to next week or final results

## Controls

- Up arrow: jump
- Down arrow: crouch
- Enter or mouse click: menu confirm and screen progression
- Number keys or mouse click: answer quiz choices

If only one input style is used for quiz answers, mouse click is the clearest option for classroom readability.

## Platforming Phase

### Player movement

- The player character auto-runs to the right.
- The player cannot stop or reverse.
- Week speed increases over time.
- Jump and crouch are the only core movement verbs.

This is important because the project is built around pressure and forward momentum, not free exploration.

### Obstacles

Current confirmed obstacles:

- Bed
- Disco ball / partying symbol
- Instagram / doomscrolling symbol

These should be arranged so the player must read high vs. low hazards quickly.

Recommended interaction logic:

- Low obstacle: jump over it
- High obstacle: crouch under it
- Mixed sequence: forces quick decision-making

### Credit drain

The concept confirms that collisions drain credits, but the exact implementation amount is not yet fixed.

Recommended default for prototype balancing:

- Each collision: `-1 credit`

Reason:

- It is easy to understand.
- It scales well against the `6 credits per week` structure.
- It creates stakes without instantly collapsing a run.

## Classroom Phase

### Quiz format

- The classroom section replaces the earlier rhythm/reaction concept.
- The player answers multiple-choice questions based on COD 208 content.
- The assignment phase should feel tense but readable.

### Timer

- Each weekly quiz has a maximum duration of `60 seconds`.
- The timer should remain visible at all times during the quiz.
- The timer becomes part of the pressure curve, especially in later weeks.

### Weekly credit value

- Each week can award up to `6 credits`.
- Across `5 weeks`, the maximum possible total is `30 credits`.

This structure maps cleanly to the selected difficulty goals.

## Difficulty Structure

### Easy

- Graduation target: `20 credits`
- Intended for players who can make mistakes in both platforming and quizzes

### Medium

- Graduation target: `26 credits`
- Intended to require consistent performance

### Hard

- Graduation target: `30 credits`
- Intended as a perfect or near-perfect graduation run

## Difficulty Scaling By Week

The main confirmed scaling lever is speed.

Recommended weekly progression:

- Week 1: onboarding pace, simplest obstacle spacing
- Week 2: slightly faster, clearer mixed obstacle patterns
- Week 3: faster pace, tighter reaction windows
- Week 4: denser obstacle chaining
- Week 5: highest speed and most demanding transition into the final quiz

If the quiz itself is later tuned for difficulty, do it through question selection and time pressure rather than changing the rules every week.

## UI Rules

During commute:

- Show current week
- Show current credits
- Show target credits for selected difficulty

During classroom:

- Show current week
- Show current credits
- Show countdown timer
- Show question progress if multiple questions are used

During summary:

- Show credits gained this week
- Show total credits so far
- Show remaining requirement to graduate

## End States

### Graduate

The player reaches or exceeds the selected difficulty threshold by the end of Week 5 and receives the diploma ending.

### Do not graduate

The player ends Week 5 below the selected target and receives a failure or retry ending.

## Open Implementation Choice

One remaining logic detail is how low credits can go during the semester.

Two workable options:

- Allow negative credits for stronger stakes from Week 1 onward.
- Clamp at `0` for a more forgiving arcade feel.

Recommended prototype choice: allow negative credits, because obstacle hits need to matter even before the player has earned many weekly credits.
